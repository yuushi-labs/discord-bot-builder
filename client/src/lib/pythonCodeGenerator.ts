import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Python Code Generator
 * Converts Blockly blocks to discord.py compatible Python code.
 */

const INDENT = "    ";
const DEFAULT_TIMEZONE = "timezone(timedelta(hours=9))";

/** Line buffer that keeps track of indentation explicitly. */
class CodeWriter {
  private readonly lines: string[] = [];

  line(level: number, text: string): void {
    this.lines.push(INDENT.repeat(Math.max(0, level)) + text);
  }

  /** Append already-indented text, preserving its internal newlines. */
  raw(text: string): void {
    for (const part of text.split("\n")) {
      this.lines.push(part);
    }
  }

  get isEmpty(): boolean {
    return this.lines.length === 0;
  }

  get lineCount(): number {
    return this.lines.length;
  }

  toString(): string {
    return this.lines.join("\n");
  }
}

interface EventHandler {
  name: string;
  params: string;
  body: CodeWriter;
}

/**
 * Variables that exist inside the current event/task scope. Each entry is a
 * Python expression that evaluates to the value, or null when the scope has no
 * such value (e.g. `message` inside `on_ready`).
 */
interface Scope {
  message: string | null;
  author: string | null;
  channel: string | null;
  guild: string | null;
  /** The `discord.Interaction` in scope, for slash commands and UI callbacks. */
  interaction: string | null;
  /**
   * Slash-option names declared by the command currently being rendered, or
   * null when no slash command is in scope. Option-value getters may only read
   * a name listed here.
   */
  options: Set<string> | null;
  /**
   * Modal text-input attribute names declared by the modal currently being
   * rendered, or null when no modal is in scope.
   */
  modalInputs: Set<string> | null;
}

interface CodeContext {
  module: CodeWriter;
  events: EventHandler[];
  taskDefs: string[];
  taskStarts: string[];
  /** Module-level class defs (views/modals) emitted before the event handlers. */
  classDefs: string[];
  variables: Set<string>;
  scope: Scope;
  taskNameCounter: number;
  classCounter: number;
  slashCommands: number;
  /** Module-level names already taken, so generated handlers never shadow them. */
  usedModuleNames: Set<string>;
  usesAsyncio: boolean;
  usesDatetime: boolean;
  usesTasks: boolean;
  usesMessageContent: boolean;
  usesMembers: boolean;
  usesAppCommands: boolean;
  usesSqlite: boolean;
}

/**
 * Names the generated module defines at top level. A slash command whose name
 * slugifies to one of these would otherwise shadow `bot` (or a helper/import)
 * before `bot.run(...)` executes.
 */
const RESERVED_MODULE_NAMES = new Set([
  "discord",
  "commands",
  "app_commands",
  "asyncio",
  "sqlite3",
  "datetime",
  "time",
  "timezone",
  "timedelta",
  "tasks",
  "intents",
  "bot",
  "db_init",
  "db_set",
  "db_get",
  "db_increment",
  "db_delete",
  "db_exists",
  "on_ready",
  "on_message",
  "on_message_edit",
  "on_message_delete",
  "on_member_join",
  "on_member_remove",
  "on_reaction_add",
]);

const EVENT_SIGNATURES: Record<string, { name: string; params: string }> = {
  discord_on_ready: { name: "on_ready", params: "" },
  discord_on_message: { name: "on_message", params: "message" },
  discord_on_message_edit: { name: "on_message_edit", params: "before, after" },
  discord_on_message_delete: { name: "on_message_delete", params: "message" },
  discord_on_member_join: { name: "on_member_join", params: "member" },
  discord_on_member_remove: { name: "on_member_remove", params: "member" },
  discord_on_reaction_add: {
    name: "on_reaction_add",
    params: "reaction, user",
  },
};

const NO_SCOPE: Scope = {
  message: null,
  author: null,
  channel: null,
  guild: null,
  interaction: null,
  options: null,
  modalInputs: null,
};

function scopeForEvent(type: string): Scope {
  switch (type) {
    case "discord_on_message":
    case "discord_on_message_delete":
      return {
        message: "message",
        author: "message.author",
        channel: "message.channel",
        guild: "message.guild",
        interaction: null,
        options: null,
        modalInputs: null,
      };
    case "discord_on_message_edit":
      return {
        message: "after",
        author: "after.author",
        channel: "after.channel",
        guild: "after.guild",
        interaction: null,
        options: null,
        modalInputs: null,
      };
    case "discord_on_member_join":
    case "discord_on_member_remove":
      return {
        message: null,
        author: "member",
        channel: null,
        guild: "member.guild",
        interaction: null,
        options: null,
        modalInputs: null,
      };
    case "discord_on_reaction_add":
      return {
        message: "reaction.message",
        author: "user",
        channel: "reaction.message.channel",
        guild: "reaction.message.guild",
        interaction: null,
        options: null,
        modalInputs: null,
      };
    default:
      return { ...NO_SCOPE };
  }
}

function isEventBlock(type: string): boolean {
  return type in EVENT_SIGNATURES;
}

/**
 * Statement blocks that are valid at module level. Everything else needs an
 * event or task scope, so loose copies are ignored instead of emitting code
 * that references undefined variables.
 */
const MODULE_LEVEL_TYPES = new Set([
  "discord_schedule_task",
  "discord_schedule_daily",
  "discord_set_variable",
]);

function escapePythonString(value: string): string {
  return (
    value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      // Normalize CRLF, a lone CR and LF alike; a bare CR would otherwise leave an
      // unterminated string literal in the generated source.
      .replace(/\r\n?|\n/g, "\\n")
  );
}

/** Python keywords that cannot be used as a variable name. */
const PYTHON_RESERVED_WORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

// Built at runtime so the `u` flag does not trip the ES5 default target check.
// CPython uses the XID_Start/XID_Continue properties (a subset of
// ID_Start/ID_Continue), so a name like U+037A must be rejected.
const PYTHON_IDENTIFIER = new RegExp(
  "^[\\p{XID_Start}_][\\p{XID_Continue}]*$",
  "u"
);

/** Valid identifiers that still cannot be used as an assignment target. */
const PYTHON_RESERVED_ASSIGNMENTS = new Set(["__debug__"]);

/**
 * Validate a user-entered name as a usable Python identifier. Emitting an
 * invalid name as-is (e.g. `my var`, a keyword, or a leading digit) produces
 * code that fails to compile, so surface it as an error instead.
 *
 * CPython checks both the original spelling and its NFKC-normalized form
 * against the XID properties, so `Ⓐ` (normalizes to `A`) is rejected while a
 * fullwidth letter is accepted.
 */
function pythonIdentifier(
  name: string,
  options: { assignment?: boolean } = {}
): string {
  const normalized = name.normalize("NFKC");
  if (options.assignment && PYTHON_RESERVED_ASSIGNMENTS.has(normalized)) {
    throw new Error(
      `変数名「${name}」には代入できません（Python の予約名）。別の名前を指定してください。`
    );
  }
  if (
    !PYTHON_IDENTIFIER.test(name) ||
    !PYTHON_IDENTIFIER.test(normalized) ||
    PYTHON_RESERVED_WORDS.has(normalized)
  ) {
    throw new Error(
      `変数名「${name}」は Python の変数名として使えません。英字または「_」で始まり、` +
        `英数字と「_」のみを含む名前（予約語以外）を指定してください。`
    );
  }
  return name;
}

/**
 * A scoped value (message/author/channel/guild) only exists inside certain
 * events. Referencing one where it does not exist would emit code that always
 * raises at runtime, so fail generation with an actionable message instead.
 */
function requireScope(value: string | null, label: string): string {
  if (value === null) {
    throw new Error(
      `「${label}」はこのイベントでは利用できません。その値を持つイベント` +
        `（メッセージ受信など）の中でのみ使用できます。`
    );
  }
  return value;
}

/**
 * A slash-option value getter only resolves inside the command that declares
 * the option. discord.py passes the resolved value through the handler
 * parameter of the same name, so reference that parameter rather than
 * `interaction.namespace`, whose `channel` entries are raw
 * `AppCommandChannel` objects without `send`.
 */
function requireSlashOption(scope: Scope, name: string): string {
  if (scope.interaction === null || !scope.options?.has(name)) {
    throw new Error(
      `スラッシュコマンドのオプション「${name}」はここでは利用できません。` +
        `そのオプションを定義したスラッシュコマンドの処理の中でのみ使用できます。`
    );
  }
  return name;
}

/**
 * A modal input getter only resolves inside the `on_submit` of the modal that
 * declares the input; `self.<name>` has no meaning elsewhere.
 */
function requireModalInput(scope: Scope, name: string): string {
  if (scope.modalInputs === null || !scope.modalInputs.has(name)) {
    throw new Error(
      `モーダル入力「${name}」はここでは利用できません。` +
        `その入力欄を定義したモーダルの「送信されたら」の中でのみ使用できます。`
    );
  }
  return `self.${name}.value`;
}

/**
 * Resolve a statement input, falling back to a scoped value only when the input
 * is unconnected. The fallback is evaluated lazily so a connected value never
 * triggers the scoped-value check.
 */
function scopedInput(
  block: Blockly.Block,
  inputName: string,
  ctx: CodeContext,
  scoped: string | null,
  label: string
): string {
  const target = block.getInputTargetBlock(inputName);
  if (target) {
    const rendered = valueBlockToCode(target, ctx);
    if (rendered !== null) return rendered;
  }
  return requireScope(scoped, label);
}

/**
 * Resolve a role argument for `add_roles`/`remove_roles`. Those methods call
 * `role.id`, so a bare string raises `AttributeError` at runtime. A connected
 * expression is therefore treated as a role name and looked up in the member's
 * guild; only a block that already yields a role object (currently none) would
 * be passed through unchanged.
 */
function roleArgument(
  block: Blockly.Block,
  ctx: CodeContext,
  member: string
): string {
  const target = block.getInputTargetBlock("ROLE");
  if (!target) return "None";
  const rendered = valueBlockToCode(target, ctx);
  if (rendered === null) return "None";
  return `discord.utils.get(${member}.guild.roles, name=${rendered})`;
}

function inputExpr(
  block: Blockly.Block,
  inputName: string,
  ctx: CodeContext,
  fallback: string
): string {
  const target = block.getInputTargetBlock(inputName);
  if (!target) return fallback;
  return valueBlockToCode(target, ctx) ?? fallback;
}

/** A short, stable python-identifier-safe fragment for generated names. */
function slugify(value: string, fallback: string): string {
  const slug = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug || /^[0-9]/.test(slug)) return fallback;
  return slug;
}

/**
 * Discord slash command / option names allow only lowercase letters, digits,
 * hyphens and underscores. Invalid characters would make `bot.tree.sync()`
 * fail at runtime, so reject them with a clear message.
 */
const DISCORD_NAME = /^[a-z0-9_-]{1,32}$/;
function discordCommandName(value: string, label: string): string {
  const name = value.trim();
  if (!DISCORD_NAME.test(name)) {
    throw new Error(
      `${label}「${value}」は使用できません。小文字の英数字・ハイフン・アンダースコア（1〜32文字）を指定してください。`
    );
  }
  return name;
}

/**
 * A Discord name doubles as the Python parameter / attribute name in the
 * generated handler, so it must also be a valid identifier. Discord allows `-`
 * and reserved words that Python does not, so reject those with a dedicated
 * message rather than emitting an unparsable signature.
 */
function pythonParameterName(value: string, label: string): string {
  try {
    return pythonIdentifier(value, { assignment: true });
  } catch {
    throw new Error(
      `${label}「${value}」は Python の識別子として使えません。` +
        `英字または「_」で始まり、英数字と「_」のみを含む名前（予約語以外）を指定してください。`
    );
  }
}

/**
 * Names the generated code already binds where a user value is emitted: the
 * module-level names plus the `interaction` handler parameter. Reusing one as
 * a slash option, variable or embed variable would shadow that binding inside
 * the handler, so the code parses but fails at runtime (`AttributeError`).
 * Reject it during generation with an actionable message instead.
 */
function assertNameNotReserved(name: string, label: string): void {
  if (name === "interaction" || RESERVED_MODULE_NAMES.has(name)) {
    throw new Error(
      `${label}「${name}」は使用できません。生成コードが内部で使う名前と衝突し、` +
        `実行時にエラーになります。別の名前を指定してください。`
    );
  }
}

/** Read a checkbox-style field (Blockly stores "TRUE"/"FALSE"). */
function fieldChecked(block: Blockly.Block, field: string): boolean {
  return block.getFieldValue(field) === "TRUE";
}

/** Field value coerced to a trimmed string, or "" when unset. */
function fieldText(block: Blockly.Block, field: string): string {
  const value = block.getFieldValue(field);
  return value == null ? "" : String(value).trim();
}

/** Value blocks that render to a compound expression and may need grouping. */
const COMPOSITE_VALUE_TYPES = new Set([
  "discord_comparison",
  "discord_logic_and",
  "discord_logic_or",
  "discord_logic_not",
  "discord_string_concat",
]);

/** Render an operand, wrapping composite expressions to preserve grouping. */
function operandExpr(
  block: Blockly.Block,
  inputName: string,
  ctx: CodeContext,
  fallback: string
): string {
  const target = block.getInputTargetBlock(inputName);
  if (!target) return fallback;
  const rendered = valueBlockToCode(target, ctx);
  if (rendered === null) return fallback;
  return COMPOSITE_VALUE_TYPES.has(target.type) ? `(${rendered})` : rendered;
}

/** Render a value (output) block to a Python expression, or null if unknown. */
function valueBlockToCode(
  block: Blockly.Block,
  ctx: CodeContext
): string | null {
  switch (block.type) {
    case "discord_text": {
      const text = block.getFieldValue("TEXT") ?? "";
      return `"${escapePythonString(String(text))}"`;
    }
    case "discord_number":
      return String(block.getFieldValue("NUM") ?? "0");
    case "discord_string_concat": {
      const a = operandExpr(block, "A", ctx, '""');
      const b = operandExpr(block, "B", ctx, '""');
      return `${a} + ${b}`;
    }
    case "discord_comparison": {
      const a = operandExpr(block, "A", ctx, "None");
      const b = operandExpr(block, "B", ctx, "None");
      const opMap: Record<string, string> = {
        EQ: "==",
        NEQ: "!=",
        GT: ">",
        LT: "<",
        GTE: ">=",
        LTE: "<=",
      };
      const op = opMap[block.getFieldValue("OP")] ?? "==";
      return `${a} ${op} ${b}`;
    }
    case "discord_logic_and":
      return `${operandExpr(block, "A", ctx, "False")} and ${operandExpr(block, "B", ctx, "False")}`;
    case "discord_logic_or":
      return `${operandExpr(block, "A", ctx, "False")} or ${operandExpr(block, "B", ctx, "False")}`;
    case "discord_logic_not":
      return `not ${operandExpr(block, "A", ctx, "False")}`;
    case "discord_get_variable":
      return pythonIdentifier(block.getFieldValue("VAR") || "x");
    case "discord_get_message":
      return requireScope(ctx.scope.message, "メッセージ");
    case "discord_get_author":
      return requireScope(ctx.scope.author, "メッセージ送信者");
    case "discord_get_channel":
      return requireScope(ctx.scope.channel, "メッセージチャンネル");
    case "discord_get_guild":
      return requireScope(ctx.scope.guild, "サーバー");
    case "discord_get_message_content": {
      ctx.usesMessageContent = true;
      return `${requireScope(ctx.scope.message, "メッセージ内容")}.content`;
    }
    case "discord_get_all_servers":
      return "bot.guilds";
    case "discord_get_server_by_name": {
      const name = inputExpr(block, "NAME", ctx, '""');
      return `discord.utils.get(bot.guilds, name=${name})`;
    }
    case "discord_slash_option_value": {
      const name = pythonParameterName(
        fieldText(block, "NAME") || "option",
        "オプション名"
      );
      return requireSlashOption(ctx.scope, name);
    }
    case "discord_interaction_get_user":
      return requireScope(ctx.scope.interaction, "操作したユーザー") + ".user";
    case "discord_interaction_get_channel":
      return (
        requireScope(ctx.scope.interaction, "インタラクションのチャンネル") +
        ".channel"
      );
    case "discord_modal_input_value": {
      const name = pythonIdentifier(fieldText(block, "NAME") || "answer", {
        assignment: true,
      });
      return requireModalInput(ctx.scope, name);
    }
    case "discord_db_get": {
      const key = inputExpr(block, "KEY", ctx, '""');
      const def = inputExpr(block, "DEFAULT", ctx, "None");
      ctx.usesSqlite = true;
      return `db_get(${key}, ${def})`;
    }
    case "discord_db_exists": {
      const key = inputExpr(block, "KEY", ctx, '""');
      ctx.usesSqlite = true;
      return `db_exists(${key})`;
    }
    default:
      return null;
  }
}

/** Emit the statements connected to a statement input, or `pass` when empty. */
function emitBody(
  block: Blockly.Block,
  inputName: string,
  ctx: CodeContext,
  writer: CodeWriter,
  level: number
): void {
  const target = block.getInputTargetBlock(inputName);
  const before = writer.lineCount;
  let current: Blockly.Block | null = target;
  while (current) {
    statementBlockToCode(current, ctx, writer, level);
    current = current.getNextBlock();
  }
  // A connected block may still emit nothing (e.g. an unknown type), so base
  // the `pass` decision on the lines actually produced.
  if (writer.lineCount === before) {
    writer.line(level, "pass");
  }
}

function uniqueTaskName(ctx: CodeContext, base: string): string {
  const count = ctx.taskNameCounter++;
  return uniqueModuleName(ctx, count === 0 ? base : `${base}_${count}`);
}

/**
 * Allocate a module-level name that neither shadows a runtime global (imports,
 * `bot`, DB helpers) nor collides with an already-generated handler. A command
 * named `bot` would otherwise replace the bot instance before `bot.run(...)`.
 */
function uniqueModuleName(ctx: CodeContext, base: string): string {
  const taken = (candidate: string) =>
    RESERVED_MODULE_NAMES.has(candidate) ||
    PYTHON_RESERVED_WORDS.has(candidate) ||
    ctx.usedModuleNames.has(candidate);
  let candidate = base;
  let suffix = 1;
  while (taken(candidate)) {
    candidate = `${base}_${suffix++}`;
  }
  ctx.usedModuleNames.add(candidate);
  return candidate;
}

/** Allocate a unique class name (views/modals share the class counter). */
function uniqueClassName(ctx: CodeContext, prefix: string): string {
  let candidate: string;
  do {
    candidate = `${prefix}_${ctx.classCounter++}`;
  } while (
    RESERVED_MODULE_NAMES.has(candidate) ||
    ctx.usedModuleNames.has(candidate)
  );
  ctx.usedModuleNames.add(candidate);
  return candidate;
}

/** The discord.py annotation used for each slash-option type. */
const OPTION_TYPES: Record<string, string> = {
  str: "str",
  int: "int",
  float: "float",
  bool: "bool",
  user: "discord.User",
  member: "discord.Member",
  channel: "discord.abc.GuildChannel",
  role: "discord.Role",
};

/** Map a block dropdown value to a `discord.ButtonStyle` attribute name. */
const BUTTON_STYLES: Record<string, string> = {
  primary: "primary",
  secondary: "secondary",
  success: "success",
  danger: "danger",
  link: "link",
};

interface SlashOption {
  name: string;
  desc: string;
  type: string;
  required: boolean;
}

/** Collect the option chain connected to a slash command's OPTIONS input. */
function collectSlashOptions(
  block: Blockly.Block,
  ctx: CodeContext
): SlashOption[] {
  const options: SlashOption[] = [];
  const seen = new Set<string>();
  let current = block.getInputTargetBlock("OPTIONS");
  while (current) {
    if (current.type === "discord_slash_option") {
      const raw = discordCommandName(
        fieldText(current, "NAME") || "option",
        "オプション名"
      );
      // The option name becomes a Python parameter and a describe() keyword, so
      // it must be a valid identifier, unique within the command, and must not
      // shadow a name the generated handler already uses.
      const name = pythonParameterName(raw, "オプション名");
      assertNameNotReserved(name, "オプション名");
      if (seen.has(name)) {
        throw new Error(
          `同じスラッシュコマンドに同名のオプション「${name}」が複数あります。オプション名は重複しないようにしてください。`
        );
      }
      seen.add(name);
      options.push({
        name,
        desc: fieldText(current, "DESC") || "オプション",
        type: String(current.getFieldValue("TYPE") ?? "str"),
        required: fieldChecked(current, "REQUIRED"),
      });
    }
    current = current.getNextBlock();
  }
  return options;
}

/**
 * Render a `@bot.tree.command` definition from a slash-command block. Options
 * without a default are required, so they are emitted first: Python forbids a
 * parameter without a default after one that has a default.
 */
function buildSlashCommand(block: Blockly.Block, ctx: CodeContext): string {
  ctx.usesAppCommands = true;
  const name = discordCommandName(
    fieldText(block, "NAME") || "command",
    "コマンド名"
  );
  const desc = fieldText(block, "DESC") || "コマンド";
  const options = collectSlashOptions(block, ctx);

  const ordered = [
    ...options.filter(option => option.required),
    ...options.filter(option => !option.required),
  ];
  const fnBase = slugify(name, `command_${ctx.slashCommands}`);
  const fnName = uniqueModuleName(ctx, fnBase);
  ctx.slashCommands += 1;

  const params = ["interaction: discord.Interaction"];
  for (const option of ordered) {
    const annotation = OPTION_TYPES[option.type] ?? "str";
    params.push(
      option.required
        ? `${option.name}: ${annotation}`
        : `${option.name}: ${annotation} = None`
    );
  }

  const lines: string[] = [];
  lines.push(
    `@bot.tree.command(name="${escapePythonString(name)}", description="${escapePythonString(desc)}")`
  );
  if (options.length > 0) {
    const mapping = options
      .map(option => `${option.name}="${escapePythonString(option.desc)}"`)
      .join(", ");
    lines.push(`@app_commands.describe(${mapping})`);
  }
  lines.push(`async def ${fnName}(${params.join(", ")}):`);

  const body = new CodeWriter();
  const previousScope = ctx.scope;
  ctx.scope = {
    ...NO_SCOPE,
    interaction: "interaction",
    options: new Set(options.map(option => option.name)),
  };
  const target = block.getInputTargetBlock("DO");
  let current = target;
  while (current) {
    statementBlockToCode(current, ctx, body, 1);
    current = current.getNextBlock();
  }
  ctx.scope = previousScope;
  if (body.isEmpty) body.line(1, "pass");
  lines.push(body.toString());

  return lines.join("\n");
}

/**
 * Render a `discord.ui.View` subclass with a single button. The dynamic pieces
 * (label/emoji/url) are evaluated by the caller and passed to `__init__`, so a
 * handler-local value such as `message.content` is not referenced in the
 * module-level class body. `on_click` runs with `interaction` in scope.
 */
function buildButtonView(
  block: Blockly.Block,
  ctx: CodeContext
): ButtonViewSpec {
  const className = uniqueClassName(ctx, "ButtonView");
  const style =
    BUTTON_STYLES[String(block.getFieldValue("STYLE") ?? "primary")] ??
    "primary";
  const label = inputExpr(block, "LABEL", ctx, '"ボタン"');
  const emoji = block.getInputTargetBlock("EMOJI")
    ? inputExpr(block, "EMOJI", ctx, '""')
    : null;
  const url = block.getInputTargetBlock("URL")
    ? inputExpr(block, "URL", ctx, '""')
    : null;

  const ctorParams = ["label"];
  const ctorArgs: string[] = [label];
  if (emoji) {
    ctorParams.push("emoji=None");
    ctorArgs.push(emoji);
  }
  if (url) {
    ctorParams.push("url=None");
    ctorArgs.push(url);
  }

  const buttonArgs = ["label=label", `style=discord.ButtonStyle.${style}`];
  if (emoji) buttonArgs.push("emoji=emoji");
  if (url) buttonArgs.push("url=url");

  const body = new CodeWriter();
  const previousScope = ctx.scope;
  ctx.scope = { ...NO_SCOPE, interaction: "interaction" };
  const target = block.getInputTargetBlock("ON_CLICK");
  let current = target;
  while (current) {
    statementBlockToCode(current, ctx, body, 2);
    current = current.getNextBlock();
  }
  ctx.scope = previousScope;
  if (body.isEmpty) body.line(2, "pass");

  // A manual Button is required because `@discord.ui.button` rejects a url.
  const def = [
    `class ${className}(discord.ui.View):`,
    `${INDENT}def __init__(self, ${ctorParams.join(", ")}):`,
    `${INDENT.repeat(2)}super().__init__(timeout=180.0)`,
    `${INDENT.repeat(2)}self.button = discord.ui.Button(${buttonArgs.join(", ")})`,
    `${INDENT.repeat(2)}self.button.callback = self.on_click`,
    `${INDENT.repeat(2)}self.add_item(self.button)`,
    "",
    `${INDENT}async def on_click(self, interaction):`,
    body.toString(),
  ].join("\n");

  ctx.classDefs.push(def);
  return { className, ctorArgs };
}

interface ButtonViewSpec {
  className: string;
  /** Constructor arguments, in order, to pass at the instantiation site. */
  ctorArgs: string[];
}

interface ModalInputSpec {
  name: string;
  label: string;
  style: string;
  placeholder: string;
  required: boolean;
}

/** Attributes a generated modal must not overwrite with a text input. */
const MODAL_RESERVED_ATTRS = new Set([
  "title",
  "on_submit",
  "on_error",
  "on_timeout",
  "add_item",
  "children",
  "timeout",
  "custom_id",
  "stop",
  "wait",
  "is_finished",
  "interaction_check",
]);

/** Collect the TextInput descriptor chain attached to a modal block. */
function collectModalInputs(
  block: Blockly.Block,
  ctx: CodeContext
): ModalInputSpec[] {
  const inputs: ModalInputSpec[] = [];
  const seen = new Set<string>();
  let current = block.getInputTargetBlock("INPUTS");
  while (current) {
    if (current.type === "discord_modal_text_input") {
      const name = pythonIdentifier(fieldText(current, "NAME") || "answer", {
        assignment: true,
      });
      if (MODAL_RESERVED_ATTRS.has(name)) {
        throw new Error(
          `入力欄の名前「${name}」は使用できません。モーダルの内部属性と衝突します。別の名前を指定してください。`
        );
      }
      if (seen.has(name)) {
        throw new Error(
          `同じモーダルに入力欄「${name}」が複数あります。入力欄の名前は重複しないようにしてください。`
        );
      }
      seen.add(name);
      inputs.push({
        name,
        label: fieldText(current, "LABEL") || "入力",
        style: String(current.getFieldValue("STYLE") ?? "short"),
        placeholder: current.getInputTargetBlock("PLACEHOLDER")
          ? inputExpr(current, "PLACEHOLDER", ctx, '""')
          : "",
        required: fieldChecked(current, "REQUIRED"),
      });
    }
    current = current.getNextBlock();
  }
  return inputs;
}

/**
 * Render a `discord.ui.Modal` subclass. Inputs are created in `__init__` and
 * registered with `add_item`, so dynamic values (title, placeholder) are
 * evaluated at the call site rather than in the module-level class body.
 */
function buildModal(block: Blockly.Block, ctx: CodeContext): ButtonViewSpec {
  const className = uniqueClassName(ctx, "Modal");
  const title = inputExpr(block, "TITLE", ctx, '"入力フォーム"');
  const inputs = collectModalInputs(block, ctx);

  const ctorParams = ["title"];
  const ctorArgs: string[] = [title];
  const inputStatements: string[] = [];
  for (const input of inputs) {
    const style =
      input.style === "paragraph"
        ? "discord.TextStyle.paragraph"
        : "discord.TextStyle.short";
    const args = [
      `label="${escapePythonString(input.label)}"`,
      `style=${style}`,
    ];
    if (input.placeholder) {
      ctorParams.push(`${input.name}_placeholder=None`);
      ctorArgs.push(input.placeholder);
      args.push(`placeholder=${input.name}_placeholder`);
    }
    args.push(`required=${input.required ? "True" : "False"}`);
    inputStatements.push(
      `${INDENT.repeat(2)}self.${input.name} = discord.ui.TextInput(${args.join(", ")})`
    );
    inputStatements.push(
      `${INDENT.repeat(2)}self.add_item(self.${input.name})`
    );
  }

  const body = new CodeWriter();
  const previousScope = ctx.scope;
  ctx.scope = {
    ...NO_SCOPE,
    interaction: "interaction",
    modalInputs: new Set(inputs.map(input => input.name)),
  };
  const target = block.getInputTargetBlock("ON_SUBMIT");
  let current = target;
  while (current) {
    statementBlockToCode(current, ctx, body, 2);
    current = current.getNextBlock();
  }
  ctx.scope = previousScope;
  if (body.isEmpty) body.line(2, "pass");

  const lines: string[] = [
    `class ${className}(discord.ui.Modal):`,
    `${INDENT}def __init__(self, ${ctorParams.join(", ")}):`,
    `${INDENT.repeat(2)}super().__init__(title=title)`,
  ];
  lines.push(...inputStatements);
  lines.push("");
  lines.push(`${INDENT}async def on_submit(self, interaction):`);
  lines.push(body.toString());

  ctx.classDefs.push(lines.join("\n"));
  return { className, ctorArgs };
}

function parseClockTime(
  block: Blockly.Block | null
): { hour: number; minute: number } | null {
  if (!block || block.type !== "discord_text") return null;
  const value = String(block.getFieldValue("TEXT") ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Render a statement block at the given indentation level. */
function statementBlockToCode(
  block: Blockly.Block,
  ctx: CodeContext,
  writer: CodeWriter,
  level: number
): void {
  switch (block.type) {
    case "discord_send_message": {
      const channel = scopedInput(
        block,
        "CHANNEL",
        ctx,
        ctx.scope.channel,
        "メッセージチャンネル"
      );
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      writer.line(level, `await ${channel}.send(${message})`);
      return;
    }
    case "discord_send_embed": {
      const channel = scopedInput(
        block,
        "CHANNEL",
        ctx,
        ctx.scope.channel,
        "メッセージチャンネル"
      );
      const title = inputExpr(block, "TITLE", ctx, '""');
      const description = inputExpr(block, "DESCRIPTION", ctx, '""');
      const color = inputExpr(block, "COLOR", ctx, "0");
      writer.line(
        level,
        `embed = discord.Embed(title=${title}, description=${description}, color=${color})`
      );
      writer.line(level, `await ${channel}.send(embed=embed)`);
      return;
    }
    case "discord_edit_message": {
      const message = scopedInput(
        block,
        "MESSAGE",
        ctx,
        ctx.scope.message,
        "メッセージ"
      );
      const content = inputExpr(block, "NEW_CONTENT", ctx, '""');
      writer.line(level, `await ${message}.edit(content=${content})`);
      return;
    }
    case "discord_delete_message": {
      const message = scopedInput(
        block,
        "MESSAGE",
        ctx,
        ctx.scope.message,
        "メッセージ"
      );
      writer.line(level, `await ${message}.delete()`);
      return;
    }
    case "discord_add_reaction": {
      const message = scopedInput(
        block,
        "MESSAGE",
        ctx,
        ctx.scope.message,
        "メッセージ"
      );
      const emoji = inputExpr(block, "EMOJI", ctx, '""');
      writer.line(level, `await ${message}.add_reaction(${emoji})`);
      return;
    }
    case "discord_add_role": {
      const member = scopedInput(
        block,
        "MEMBER",
        ctx,
        ctx.scope.author,
        "メンバー"
      );
      const role = roleArgument(block, ctx, member);
      writer.line(level, `await ${member}.add_roles(${role})`);
      return;
    }
    case "discord_remove_role": {
      const member = scopedInput(
        block,
        "MEMBER",
        ctx,
        ctx.scope.author,
        "メンバー"
      );
      const role = roleArgument(block, ctx, member);
      writer.line(level, `await ${member}.remove_roles(${role})`);
      return;
    }
    case "discord_ban_member": {
      const member = scopedInput(
        block,
        "MEMBER",
        ctx,
        ctx.scope.author,
        "メンバー"
      );
      const reason = inputExpr(block, "REASON", ctx, '""');
      writer.line(level, `await ${member}.ban(reason=${reason})`);
      return;
    }
    case "discord_kick_member": {
      const member = scopedInput(
        block,
        "MEMBER",
        ctx,
        ctx.scope.author,
        "メンバー"
      );
      const reason = inputExpr(block, "REASON", ctx, '""');
      writer.line(level, `await ${member}.kick(reason=${reason})`);
      return;
    }
    case "discord_print": {
      const text = inputExpr(block, "TEXT", ctx, '""');
      writer.line(level, `print(${text})`);
      return;
    }
    case "discord_set_variable": {
      const varName = pythonIdentifier(block.getFieldValue("VAR") || "x", {
        assignment: true,
      });
      assertNameNotReserved(varName, "変数名");
      const value = inputExpr(block, "VALUE", ctx, "None");
      ctx.variables.add(varName);
      writer.line(level, `${varName} = ${value}`);
      return;
    }
    case "discord_if": {
      const condition = inputExpr(block, "CONDITION", ctx, "False");
      writer.line(level, `if ${condition}:`);
      emitBody(block, "DO", ctx, writer, level + 1);
      return;
    }
    case "discord_if_else": {
      const condition = inputExpr(block, "CONDITION", ctx, "False");
      writer.line(level, `if ${condition}:`);
      emitBody(block, "DO", ctx, writer, level + 1);
      writer.line(level, "else:");
      emitBody(block, "ELSE", ctx, writer, level + 1);
      return;
    }
    case "discord_for_loop": {
      const raw = Number(block.getFieldValue("COUNT") ?? "0");
      const count = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
      writer.line(level, `for i in range(${count}):`);
      emitBody(block, "DO", ctx, writer, level + 1);
      return;
    }
    case "discord_while_loop": {
      const condition = inputExpr(block, "CONDITION", ctx, "False");
      writer.line(level, `while ${condition}:`);
      emitBody(block, "DO", ctx, writer, level + 1);
      return;
    }
    case "discord_conditional_message": {
      const condition = inputExpr(block, "CONDITION", ctx, "True");
      const channel = scopedInput(
        block,
        "CHANNEL",
        ctx,
        ctx.scope.channel,
        "メッセージチャンネル"
      );
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      writer.line(level, `if ${condition}:`);
      writer.line(level + 1, `await ${channel}.send(${message})`);
      return;
    }
    case "discord_broadcast_to_servers": {
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      writer.line(level, "for guild in bot.guilds:");
      writer.line(level + 1, "if guild.system_channel:");
      writer.line(level + 2, `await guild.system_channel.send(${message})`);
      return;
    }
    case "discord_schedule_task": {
      const interval = inputExpr(block, "INTERVAL", ctx, "60");
      const taskName = uniqueTaskName(ctx, "scheduled_task");
      const previousScope = ctx.scope;
      ctx.scope = { ...NO_SCOPE };
      const body = new CodeWriter();
      emitBody(block, "DO", ctx, body, 1);
      ctx.scope = previousScope;
      ctx.taskDefs.push(
        `@tasks.loop(seconds=${interval})\nasync def ${taskName}():\n${body.toString()}`
      );
      if (writer === ctx.module) {
        ctx.taskStarts.push(taskName);
      } else {
        writer.line(level, `if not ${taskName}.is_running():`);
        writer.line(level + 1, `${taskName}.start()`);
      }
      ctx.usesTasks = true;
      return;
    }
    case "discord_schedule_daily": {
      const timeBlock = block.getInputTargetBlock("TIME");
      const parsed = parseClockTime(timeBlock);
      const taskName = uniqueTaskName(ctx, "daily_task");
      const previousScope = ctx.scope;
      ctx.scope = { ...NO_SCOPE };
      ctx.usesTasks = true;
      ctx.usesDatetime = true;

      if (parsed) {
        const body = new CodeWriter();
        emitBody(block, "DO", ctx, body, 1);
        const decorator =
          `@tasks.loop(time=time(hour=${parsed.hour}, minute=${parsed.minute}, ` +
          `tzinfo=${DEFAULT_TIMEZONE}))`;
        ctx.taskDefs.push(
          `${decorator}\nasync def ${taskName}():\n${body.toString()}`
        );
      } else {
        const time = timeBlock
          ? (valueBlockToCode(timeBlock, ctx) ?? '"00:00"')
          : '"00:00"';
        const guarded = new CodeWriter();
        guarded.line(
          1,
          `now = datetime.now(${DEFAULT_TIMEZONE}).strftime('%H:%M')`
        );
        guarded.line(1, `if now == str(${time}).strip().zfill(5):`);
        const inner = new CodeWriter();
        emitBody(block, "DO", ctx, inner, 2);
        ctx.taskDefs.push(
          `@tasks.loop(minutes=1)\nasync def ${taskName}():\n${guarded.toString()}\n${inner.toString()}`
        );
      }
      ctx.scope = previousScope;
      if (writer === ctx.module) {
        ctx.taskStarts.push(taskName);
      } else {
        writer.line(level, `if not ${taskName}.is_running():`);
        writer.line(level + 1, `${taskName}.start()`);
      }
      return;
    }
    case "discord_wait": {
      const seconds = inputExpr(block, "SECONDS", ctx, "1");
      writer.line(level, `await asyncio.sleep(${seconds})`);
      ctx.usesAsyncio = true;
      return;
    }
    case "discord_interaction_reply": {
      const interaction = requireScope(ctx.scope.interaction, "応答先");
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      const ephemeral = fieldChecked(block, "EPHEMERAL")
        ? ", ephemeral=True"
        : "";
      writer.line(
        level,
        `await ${interaction}.response.send_message(${message}${ephemeral})`
      );
      return;
    }
    case "discord_interaction_reply_embed": {
      const interaction = requireScope(ctx.scope.interaction, "応答先");
      const embed = pythonIdentifier(fieldText(block, "VAR") || "embed");
      ctx.variables.add(embed);
      const ephemeral = fieldChecked(block, "EPHEMERAL")
        ? ", ephemeral=True"
        : "";
      writer.line(
        level,
        `await ${interaction}.response.send_message(embed=${embed}${ephemeral})`
      );
      return;
    }
    case "discord_embed_create": {
      const name = pythonIdentifier(fieldText(block, "VAR") || "embed", {
        assignment: true,
      });
      assertNameNotReserved(name, "Embed 変数名");
      const title = inputExpr(block, "TITLE", ctx, '""');
      const description = inputExpr(block, "DESCRIPTION", ctx, '""');
      const color = inputExpr(block, "COLOR", ctx, "0x5865F2");
      ctx.variables.add(name);
      writer.line(
        level,
        `${name} = discord.Embed(title=${title}, description=${description}, color=${color})`
      );
      return;
    }
    case "discord_embed_add_field": {
      const name = pythonIdentifier(fieldText(block, "VAR") || "embed");
      const fieldName = inputExpr(block, "NAME", ctx, '""');
      const fieldValue = inputExpr(block, "VALUE", ctx, '""');
      const inline = fieldChecked(block, "INLINE") ? "True" : "False";
      writer.line(
        level,
        `${name}.add_field(name=${fieldName}, value=${fieldValue}, inline=${inline})`
      );
      return;
    }
    case "discord_embed_set": {
      const name = pythonIdentifier(fieldText(block, "VAR") || "embed");
      const property = String(block.getFieldValue("PROPERTY") ?? "thumbnail");
      const value = inputExpr(block, "VALUE", ctx, '""');
      // Footer takes `text` and Author requires `name`; only Thumbnail/Image use
      // `url`. Using the wrong keyword raises TypeError when the embed is built.
      if (property === "footer") {
        writer.line(level, `${name}.set_footer(text=${value})`);
      } else if (property === "author") {
        writer.line(level, `${name}.set_author(name=${value})`);
      } else if (property === "image") {
        writer.line(level, `${name}.set_image(url=${value})`);
      } else {
        writer.line(level, `${name}.set_thumbnail(url=${value})`);
      }
      return;
    }
    case "discord_send_embed_object": {
      const channel = scopedInput(
        block,
        "CHANNEL",
        ctx,
        ctx.scope.channel,
        "メッセージチャンネル"
      );
      const name = pythonIdentifier(fieldText(block, "VAR") || "embed");
      writer.line(level, `await ${channel}.send(embed=${name})`);
      return;
    }
    case "discord_db_set": {
      const key = inputExpr(block, "KEY", ctx, '""');
      const value = inputExpr(block, "VALUE", ctx, '""');
      ctx.usesSqlite = true;
      writer.line(level, `db_set(${key}, ${value})`);
      return;
    }
    case "discord_db_increment": {
      const key = inputExpr(block, "KEY", ctx, '""');
      const amount = inputExpr(block, "AMOUNT", ctx, "1");
      ctx.usesSqlite = true;
      writer.line(level, `db_increment(${key}, ${amount})`);
      return;
    }
    case "discord_db_delete": {
      const key = inputExpr(block, "KEY", ctx, '""');
      ctx.usesSqlite = true;
      writer.line(level, `db_delete(${key})`);
      return;
    }
    case "discord_button_send": {
      const channel = scopedInput(
        block,
        "CHANNEL",
        ctx,
        ctx.scope.channel,
        "メッセージチャンネル"
      );
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      const view = buildButtonView(block, ctx);
      writer.line(
        level,
        `await ${channel}.send(${message}, view=${view.className}(${view.ctorArgs.join(", ")}))`
      );
      return;
    }
    case "discord_button_reply_view": {
      const interaction = requireScope(ctx.scope.interaction, "応答先");
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      const view = buildButtonView(block, ctx);
      const ephemeral = fieldChecked(block, "EPHEMERAL")
        ? ", ephemeral=True"
        : "";
      writer.line(
        level,
        `await ${interaction}.response.send_message(${message}, view=${view.className}(${view.ctorArgs.join(", ")})${ephemeral})`
      );
      return;
    }
    case "discord_open_modal": {
      const interaction = requireScope(ctx.scope.interaction, "応答先");
      const modal = buildModal(block, ctx);
      writer.line(
        level,
        `await ${interaction}.response.send_modal(${modal.className}(${modal.ctorArgs.join(", ")}))`
      );
      return;
    }
    default:
      return;
  }
}

function buildEventHandler(
  block: Blockly.Block,
  ctx: CodeContext
): EventHandler {
  const signature = EVENT_SIGNATURES[block.type];
  const body = new CodeWriter();

  if (block.type === "discord_on_message") {
    ctx.usesMessageContent = true;
    body.line(1, "if message.author == bot.user:");
    body.line(2, "return");
  } else if (
    block.type === "discord_on_message_edit" ||
    block.type === "discord_on_message_delete"
  ) {
    ctx.usesMessageContent = true;
  } else if (
    block.type === "discord_on_member_join" ||
    block.type === "discord_on_member_remove"
  ) {
    ctx.usesMembers = true;
  }

  const previousScope = ctx.scope;
  ctx.scope = scopeForEvent(block.type);

  const target = block.getInputTargetBlock("DO");
  let current: Blockly.Block | null = target;
  while (current) {
    statementBlockToCode(current, ctx, body, 1);
    current = current.getNextBlock();
  }

  ctx.scope = previousScope;

  // on_message always emits the author guard, so it never needs `pass`.
  if (body.isEmpty) {
    body.line(1, "pass");
  }

  return { name: signature.name, params: signature.params, body };
}

function renderEvent(event: EventHandler): string {
  return `@bot.event\nasync def ${event.name}(${event.params}):\n${event.body.toString()}`;
}

/** Start scheduled tasks from `on_ready`, creating the handler if needed. */
function applyScheduledTaskStarts(ctx: CodeContext): void {
  if (ctx.taskStarts.length === 0) return;

  let onReady = ctx.events.find(event => event.name === "on_ready");
  if (!onReady) {
    onReady = { name: "on_ready", params: "", body: new CodeWriter() };
    ctx.events.unshift(onReady);
  }

  for (const taskName of ctx.taskStarts) {
    onReady.body.line(1, `if not ${taskName}.is_running():`);
    onReady.body.line(2, `${taskName}.start()`);
  }
}

/**
 * Sync the command tree from `on_ready`, creating the handler when needed. The
 * sync is guarded so the commands are not re-registered on every reconnect.
 */
function applyTreeSync(ctx: CodeContext): void {
  let onReady = ctx.events.find(event => event.name === "on_ready");
  if (!onReady) {
    onReady = { name: "on_ready", params: "", body: new CodeWriter() };
    ctx.events.unshift(onReady);
  }
  onReady.body.line(1, "if not getattr(bot, '_tree_synced', False):");
  onReady.body.line(2, "await bot.tree.sync()");
  onReady.body.line(2, "bot._tree_synced = True");
}

export interface GeneratePythonCodeOptions {
  /** Expression passed to `bot.run(...)`, e.g. a token variable name. */
  tokenExpr?: string;
}

/** Parameterized helpers for the file-based SQLite store. */
const DB_HELPERS = `def db_init():
    conn = sqlite3.connect("bot_data.db")
    conn.execute("CREATE TABLE IF NOT EXISTS bot_data (key TEXT PRIMARY KEY, value TEXT)")
    conn.commit()
    conn.close()


def db_set(key, value):
    conn = sqlite3.connect("bot_data.db")
    conn.execute(
        "INSERT INTO bot_data (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (str(key), str(value)),
    )
    conn.commit()
    conn.close()


def db_get(key, default=None):
    conn = sqlite3.connect("bot_data.db")
    row = conn.execute("SELECT value FROM bot_data WHERE key = ?", (str(key),)).fetchone()
    conn.close()
    return row[0] if row else default


def db_increment(key, amount=1):
    conn = sqlite3.connect("bot_data.db")
    row = conn.execute("SELECT value FROM bot_data WHERE key = ?", (str(key),)).fetchone()
    try:
        current = int(row[0]) if row else 0
    except (TypeError, ValueError):
        current = 0
    new_value = current + int(amount)
    conn.execute(
        "INSERT INTO bot_data (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (str(key), str(new_value)),
    )
    conn.commit()
    conn.close()
    return new_value


def db_delete(key):
    conn = sqlite3.connect("bot_data.db")
    conn.execute("DELETE FROM bot_data WHERE key = ?", (str(key),))
    conn.commit()
    conn.close()


def db_exists(key):
    conn = sqlite3.connect("bot_data.db")
    row = conn.execute("SELECT 1 FROM bot_data WHERE key = ?", (str(key),)).fetchone()
    conn.close()
    return row is not None`;

/**
 * Generate complete Python code from a Blockly workspace.
 */
export function generatePythonCode(
  workspace: Blockly.Workspace,
  options: GeneratePythonCodeOptions = {}
): string {
  const ctx: CodeContext = {
    module: new CodeWriter(),
    events: [],
    taskDefs: [],
    taskStarts: [],
    classDefs: [],
    variables: new Set<string>(),
    scope: { ...NO_SCOPE },
    taskNameCounter: 0,
    classCounter: 0,
    slashCommands: 0,
    usedModuleNames: new Set<string>(),
    usesAsyncio: false,
    usesDatetime: false,
    usesTasks: false,
    usesMessageContent: false,
    usesMembers: false,
    usesAppCommands: false,
    usesSqlite: false,
  };

  const slashDefs: string[] = [];
  const slashNames = new Set<string>();

  for (const block of workspace.getTopBlocks(true)) {
    if (isEventBlock(block.type)) {
      if (
        ctx.events.some(
          event => event.name === EVENT_SIGNATURES[block.type].name
        )
      ) {
        throw new Error("同じイベントのブロックは1つだけ配置してください");
      }
      ctx.events.push(buildEventHandler(block, ctx));
      continue;
    }
    if (block.type === "discord_slash_command") {
      // Two commands with the same name would emit two same-named `async def`s;
      // the second silently wins and the first command's body is lost.
      const name = discordCommandName(
        fieldText(block, "NAME") || "command",
        "コマンド名"
      );
      if (slashNames.has(name)) {
        throw new Error(
          `同じ名前のスラッシュコマンド「${name}」が複数あります。コマンド名は重複しないようにしてください。`
        );
      }
      slashNames.add(name);
      slashDefs.push(buildSlashCommand(block, ctx));
      continue;
    }
    let current: Blockly.Block | null = block;
    while (current) {
      if (MODULE_LEVEL_TYPES.has(current.type)) {
        statementBlockToCode(current, ctx, ctx.module, 0);
      }
      current = current.getNextBlock();
    }
  }

  applyScheduledTaskStarts(ctx);
  // A slash command always needs the tree synced so it appears in Discord.
  if (slashDefs.length > 0) applyTreeSync(ctx);

  const out: string[] = [];
  out.push("import discord");
  out.push("from discord.ext import commands");
  if (ctx.usesAppCommands) out.push("from discord import app_commands");
  if (ctx.usesAsyncio) out.push("import asyncio");
  if (ctx.usesSqlite) out.push("import sqlite3");
  if (ctx.usesDatetime) {
    out.push("from datetime import datetime, time, timezone, timedelta");
  }
  if (ctx.usesTasks) out.push("from discord.ext import tasks");
  out.push("");

  if (ctx.usesMessageContent || ctx.usesMembers) {
    out.push("intents = discord.Intents.default()");
    out.push(
      "# Enable the privileged intents below in the Discord Developer Portal:"
    );
    out.push(
      "# https://discord.com/developers/applications -> Bot -> Privileged Intents"
    );
    if (ctx.usesMessageContent) out.push("intents.message_content = True");
    if (ctx.usesMembers) out.push("intents.members = True");
    out.push("bot = commands.Bot(command_prefix='!', intents=intents)");
  } else {
    out.push(
      "bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())"
    );
  }
  out.push("");

  if (ctx.usesSqlite) {
    out.push(DB_HELPERS);
    out.push("");
    out.push("db_init()");
    out.push("");
  }

  if (!ctx.module.isEmpty) {
    out.push(ctx.module.toString());
    out.push("");
  }

  for (const def of ctx.classDefs) {
    out.push(def);
    out.push("");
  }

  for (const def of slashDefs) {
    out.push(def);
    out.push("");
  }

  for (const def of ctx.taskDefs) {
    out.push(def);
    out.push("");
  }

  for (const event of ctx.events) {
    out.push(renderEvent(event));
    out.push("");
  }

  if (options.tokenExpr) {
    out.push(`bot.run(${options.tokenExpr})`);
  } else {
    out.push("# Replace 'YOUR_DISCORD_BOT_TOKEN' with your actual bot token");
    out.push("bot.run('YOUR_DISCORD_BOT_TOKEN')");
  }

  return out.join("\n");
}
