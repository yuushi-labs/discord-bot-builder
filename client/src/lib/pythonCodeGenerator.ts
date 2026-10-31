import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Python Code Generator
 * Converts Blockly blocks to discord.py compatible Python code.
 */

const INDENT = "    ";

/** Line buffer that keeps track of indentation explicitly. */
class CodeWriter {
  private readonly lines: string[] = [];

  line(level: number, text: string): void {
    this.lines.push(INDENT.repeat(Math.max(0, level)) + text);
  }

  get isEmpty(): boolean {
    return this.lines.length === 0;
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

interface CodeContext {
  module: CodeWriter;
  events: EventHandler[];
  taskDefs: string[];
  taskStarts: string[];
  variables: Set<string>;
  usesAsyncio: boolean;
  usesDatetime: boolean;
  usesTasks: boolean;
}

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

function isEventBlock(type: string): boolean {
  return type in EVENT_SIGNATURES;
}

function escapePythonString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
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
      const a = inputExpr(block, "A", ctx, '""');
      const b = inputExpr(block, "B", ctx, '""');
      return `${a} + ${b}`;
    }
    case "discord_comparison": {
      const a = inputExpr(block, "A", ctx, "None");
      const b = inputExpr(block, "B", ctx, "None");
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
      return `${inputExpr(block, "A", ctx, "False")} and ${inputExpr(block, "B", ctx, "False")}`;
    case "discord_logic_or":
      return `${inputExpr(block, "A", ctx, "False")} or ${inputExpr(block, "B", ctx, "False")}`;
    case "discord_logic_not":
      return `not ${inputExpr(block, "A", ctx, "False")}`;
    case "discord_get_variable":
      return block.getFieldValue("VAR") || "x";
    case "discord_get_message":
      return "message";
    case "discord_get_author":
      return "message.author";
    case "discord_get_channel":
      return "message.channel";
    case "discord_get_guild":
      return "message.guild";
    case "discord_get_message_content":
      return "message.content";
    case "discord_get_all_servers":
      return "bot.guilds";
    case "discord_get_server_by_name": {
      const name = inputExpr(block, "NAME", ctx, '""');
      return `discord.utils.get(bot.guilds, name=${name})`;
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
  if (!target) {
    writer.line(level, "pass");
    return;
  }
  let current: Blockly.Block | null = target;
  while (current) {
    statementBlockToCode(current, ctx, writer, level);
    current = current.getNextBlock();
  }
}

function uniqueTaskName(ctx: CodeContext, base: string): string {
  const count = ctx.taskDefs.length;
  return count === 0 ? base : `${base}_${count}`;
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
      const channel = inputExpr(block, "CHANNEL", ctx, "message.channel");
      const message = inputExpr(block, "MESSAGE", ctx, '""');
      writer.line(level, `await ${channel}.send(${message})`);
      return;
    }
    case "discord_send_embed": {
      const channel = inputExpr(block, "CHANNEL", ctx, "message.channel");
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
      const message = inputExpr(block, "MESSAGE", ctx, "message");
      const content = inputExpr(block, "NEW_CONTENT", ctx, '""');
      writer.line(level, `await ${message}.edit(content=${content})`);
      return;
    }
    case "discord_delete_message": {
      const message = inputExpr(block, "MESSAGE", ctx, "message");
      writer.line(level, `await ${message}.delete()`);
      return;
    }
    case "discord_add_reaction": {
      const message = inputExpr(block, "MESSAGE", ctx, "message");
      const emoji = inputExpr(block, "EMOJI", ctx, '""');
      writer.line(level, `await ${message}.add_reaction(${emoji})`);
      return;
    }
    case "discord_add_role": {
      const member = inputExpr(block, "MEMBER", ctx, "member");
      const role = inputExpr(block, "ROLE", ctx, "None");
      writer.line(level, `await ${member}.add_roles(${role})`);
      return;
    }
    case "discord_remove_role": {
      const member = inputExpr(block, "MEMBER", ctx, "member");
      const role = inputExpr(block, "ROLE", ctx, "None");
      writer.line(level, `await ${member}.remove_roles(${role})`);
      return;
    }
    case "discord_ban_member": {
      const member = inputExpr(block, "MEMBER", ctx, "member");
      const reason = inputExpr(block, "REASON", ctx, '""');
      writer.line(level, `await ${member}.ban(reason=${reason})`);
      return;
    }
    case "discord_kick_member": {
      const member = inputExpr(block, "MEMBER", ctx, "member");
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
      const varName = block.getFieldValue("VAR") || "x";
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
      const channel = inputExpr(block, "CHANNEL", ctx, "message.channel");
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
      const body = new CodeWriter();
      emitBody(block, "DO", ctx, body, 1);
      ctx.taskDefs.push(
        `@tasks.loop(seconds=${interval})\nasync def ${taskName}():\n${body.toString()}`
      );
      ctx.taskStarts.push(taskName);
      ctx.usesTasks = true;
      return;
    }
    case "discord_schedule_daily": {
      const timeBlock = block.getInputTargetBlock("TIME");
      const parsed = parseClockTime(timeBlock);
      const taskName = uniqueTaskName(ctx, "daily_task");
      const body = new CodeWriter();
      emitBody(block, "DO", ctx, body, 1);
      ctx.usesTasks = true;
      ctx.usesDatetime = true;

      if (parsed) {
        const decorator = `@tasks.loop(time=time(hour=${parsed.hour}, minute=${parsed.minute}))`;
        ctx.taskDefs.push(
          `${decorator}\nasync def ${taskName}():\n${body.toString()}`
        );
      } else {
        const time = timeBlock
          ? (valueBlockToCode(timeBlock, ctx) ?? '"00:00"')
          : '"00:00"';
        const guarded = new CodeWriter();
        guarded.line(1, "now = datetime.now().strftime('%H:%M')");
        guarded.line(1, `if now == ${time}:`);
        const inner = new CodeWriter();
        emitBody(block, "DO", ctx, inner, 2);
        ctx.taskDefs.push(
          `@tasks.loop(hours=24)\nasync def ${taskName}():\n${guarded.toString()}\n${inner.toString()}`
        );
      }
      ctx.taskStarts.push(taskName);
      return;
    }
    case "discord_wait": {
      const seconds = inputExpr(block, "SECONDS", ctx, "1");
      writer.line(level, `await asyncio.sleep(${seconds})`);
      ctx.usesAsyncio = true;
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
  let hasBody = false;

  if (block.type === "discord_on_message") {
    body.line(1, "if message.author == bot.user:");
    body.line(2, "return");
  }

  const target = block.getInputTargetBlock("DO");
  if (target) {
    hasBody = true;
    let current: Blockly.Block | null = target;
    while (current) {
      statementBlockToCode(current, ctx, body, 1);
      current = current.getNextBlock();
    }
  }

  if (!hasBody && block.type !== "discord_on_message") {
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
 * Generate complete Python code from a Blockly workspace.
 */
export function generatePythonCode(workspace: Blockly.Workspace): string {
  const ctx: CodeContext = {
    module: new CodeWriter(),
    events: [],
    taskDefs: [],
    taskStarts: [],
    variables: new Set<string>(),
    usesAsyncio: false,
    usesDatetime: false,
    usesTasks: false,
  };

  for (const block of workspace.getTopBlocks(true)) {
    if (isEventBlock(block.type)) {
      ctx.events.push(buildEventHandler(block, ctx));
      continue;
    }
    let current: Blockly.Block | null = block;
    while (current) {
      statementBlockToCode(current, ctx, ctx.module, 0);
      current = current.getNextBlock();
    }
  }

  applyScheduledTaskStarts(ctx);

  const out: string[] = [];
  out.push("import discord");
  out.push("from discord.ext import commands");
  if (ctx.usesAsyncio) out.push("import asyncio");
  if (ctx.usesDatetime) out.push("from datetime import datetime, time");
  if (ctx.usesTasks) out.push("from discord.ext import tasks");
  out.push("");
  out.push(
    "bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())"
  );
  out.push("");

  if (!ctx.module.isEmpty) {
    out.push(ctx.module.toString());
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

  out.push("# Replace 'YOUR_DISCORD_BOT_TOKEN' with your actual bot token");
  out.push("bot.run('YOUR_DISCORD_BOT_TOKEN')");

  return out.join("\n");
}
