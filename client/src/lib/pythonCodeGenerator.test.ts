import { describe, it, expect, beforeEach } from "vitest";
import * as Blockly from "blockly";
import { defineDiscordBlocks } from "./blocklyBlocks";
import { generatePythonCode } from "./pythonCodeGenerator";

function connect(
  parent: Blockly.Block,
  child: Blockly.Block,
  inputName: string
) {
  const input = parent.getInput(inputName);
  if (!input || !input.connection) {
    throw new Error(`Missing input "${inputName}" on ${parent.type}`);
  }
  input.connection.connect(child.outputConnection!);
}

function setText(block: Blockly.Block, value: string) {
  (block.getField("TEXT") as Blockly.FieldTextInput).setValue(value);
}

function setNumber(block: Blockly.Block, value: number) {
  (block.getField("NUM") as Blockly.FieldNumber).setValue(value);
}

describe("Python Code Generator", () => {
  let workspace: Blockly.Workspace;

  beforeEach(() => {
    defineDiscordBlocks();
    workspace = new Blockly.Workspace();
  });

  it("generates imports, bot initialization and token placeholder", () => {
    const code = generatePythonCode(workspace);
    expect(code).toContain("import discord");
    expect(code).toContain("from discord.ext import commands");
    expect(code).toContain("bot = commands.Bot");
    expect(code).toContain("bot.run('YOUR_DISCORD_BOT_TOKEN')");
  });

  it("uses a provided token expression in bot.run", () => {
    const code = generatePythonCode(workspace, { tokenExpr: "DISCORD_TOKEN" });
    expect(code).toContain("bot.run(DISCORD_TOKEN)");
    expect(code).not.toContain("YOUR_DISCORD_BOT_TOKEN");
  });

  it("indents statements nested inside an event handler", () => {
    const event = workspace.newBlock("discord_on_message");
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    const channel = workspace.newBlock("discord_get_channel");
    setText(text, "Hello!");
    connect(send, text, "MESSAGE");
    connect(send, channel, "CHANNEL");
    event.getInput("DO")!.connection!.connect(send.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("async def on_message(message):");
    expect(code).toContain("if message.author == bot.user:");
    expect(code).toContain('    await message.channel.send("Hello!")');
    // The send must live inside the handler, not at module level.
    expect(code).not.toMatch(/^await message\.channel\.send/m);
  });

  it("emits pass for an empty event body", () => {
    workspace.newBlock("discord_on_member_join");
    const code = generatePythonCode(workspace);
    expect(code).toContain("async def on_member_join(member):");
    expect(code).toContain("    pass");
  });

  it("keeps on_message author guard when the body is empty", () => {
    workspace.newBlock("discord_on_message");
    const code = generatePythonCode(workspace);
    expect(code).toContain("async def on_message(message):");
    expect(code).toContain("    if message.author == bot.user:");
    expect(code).toContain("        return");
  });

  it("nests if/else bodies with correct indentation", () => {
    const event = workspace.newBlock("discord_on_message");
    const ifElse = workspace.newBlock("discord_if_else");
    const comparison = workspace.newBlock("discord_comparison");
    const left = workspace.newBlock("discord_get_message_content");
    const right = workspace.newBlock("discord_text");
    setText(right, "hello");
    connect(comparison, left, "A");
    connect(comparison, right, "B");

    const doSend = workspace.newBlock("discord_send_message");
    const doText = workspace.newBlock("discord_text");
    const doChannel = workspace.newBlock("discord_get_channel");
    setText(doText, "hi");
    connect(doSend, doText, "MESSAGE");
    connect(doSend, doChannel, "CHANNEL");

    const elseSend = workspace.newBlock("discord_send_message");
    const elseText = workspace.newBlock("discord_text");
    const elseChannel = workspace.newBlock("discord_get_channel");
    setText(elseText, "?");
    connect(elseSend, elseText, "MESSAGE");
    connect(elseSend, elseChannel, "CHANNEL");

    connect(ifElse, comparison, "CONDITION");
    ifElse.getInput("DO")!.connection!.connect(doSend.previousConnection!);
    ifElse.getInput("ELSE")!.connection!.connect(elseSend.previousConnection!);
    event.getInput("DO")!.connection!.connect(ifElse.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain('    if message.content == "hello":');
    expect(code).toContain('        await message.channel.send("hi")');
    expect(code).toContain("    else:");
    expect(code).toContain('        await message.channel.send("?")');
  });

  it("generates a scheduled task and starts it in on_ready", () => {
    const schedule = workspace.newBlock("discord_schedule_task");
    const interval = workspace.newBlock("discord_number");
    setNumber(interval, 60);
    connect(schedule, interval, "INTERVAL");

    const print = workspace.newBlock("discord_print");
    const text = workspace.newBlock("discord_text");
    setText(text, "tick");
    connect(print, text, "TEXT");
    schedule.getInput("DO")!.connection!.connect(print.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("from discord.ext import tasks");
    expect(code).toContain("@tasks.loop(seconds=60)");
    expect(code).toContain("async def scheduled_task():");
    expect(code).toContain("async def on_ready():");
    expect(code).toContain("if not scheduled_task.is_running():");
    expect(code).toContain("scheduled_task.start()");
    // A task has no message scope, so it must not reference `message`.
    expect(code).not.toContain("await message.channel.send");
  });

  it("gives nested schedule blocks distinct names", () => {
    const outer = workspace.newBlock("discord_schedule_task");
    const outerInterval = workspace.newBlock("discord_number");
    setNumber(outerInterval, 60);
    connect(outer, outerInterval, "INTERVAL");

    const inner = workspace.newBlock("discord_schedule_task");
    const innerInterval = workspace.newBlock("discord_number");
    setNumber(innerInterval, 30);
    connect(inner, innerInterval, "INTERVAL");
    outer.getInput("DO")!.connection!.connect(inner.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("async def scheduled_task():");
    expect(code).toContain("async def scheduled_task_1():");
  });

  it("uses an explicit time loop for daily schedules with HH:MM", () => {
    const schedule = workspace.newBlock("discord_schedule_daily");
    const time = workspace.newBlock("discord_text");
    setText(time, "09:30");
    connect(schedule, time, "TIME");

    const code = generatePythonCode(workspace);
    expect(code).toContain(
      "from datetime import datetime, time, timezone, timedelta"
    );
    expect(code).toContain(
      "@tasks.loop(time=time(hour=9, minute=30, tzinfo=timezone(timedelta(hours=9))))"
    );
  });

  it("checks every minute for a non-literal daily schedule time", () => {
    const schedule = workspace.newBlock("discord_schedule_daily");
    const print = workspace.newBlock("discord_print");
    const text = workspace.newBlock("discord_text");
    setText(text, "tick");
    connect(print, text, "TEXT");
    schedule.getInput("DO")!.connection!.connect(print.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("@tasks.loop(minutes=1)");
    expect(code).toContain(
      "now = datetime.now(timezone(timedelta(hours=9))).strftime('%H:%M')"
    );
  });

  it("adds the asyncio import when a wait block is used", () => {
    const event = workspace.newBlock("discord_on_ready");
    const wait = workspace.newBlock("discord_wait");
    const seconds = workspace.newBlock("discord_number");
    setNumber(seconds, 5);
    connect(wait, seconds, "SECONDS");
    event.getInput("DO")!.connection!.connect(wait.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("import asyncio");
    expect(code).toContain("await asyncio.sleep(5)");
  });

  it("escapes quotes and newlines in text blocks", () => {
    const event = workspace.newBlock("discord_on_message");
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    const channel = workspace.newBlock("discord_get_channel");
    setText(text, 'say "hi"\nnow');
    connect(send, text, "MESSAGE");
    connect(send, channel, "CHANNEL");
    event.getInput("DO")!.connection!.connect(send.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain('"say \\"hi\\"\\nnow"');
  });

  it("generates broadcast loops with nested indentation", () => {
    const event = workspace.newBlock("discord_on_ready");
    const broadcast = workspace.newBlock("discord_broadcast_to_servers");
    const text = workspace.newBlock("discord_text");
    setText(text, "hello everyone");
    connect(broadcast, text, "MESSAGE");
    event.getInput("DO")!.connection!.connect(broadcast.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("    for guild in bot.guilds:");
    expect(code).toContain("        if guild.system_channel:");
    expect(code).toContain(
      '            await guild.system_channel.send("hello everyone")'
    );
  });

  it("resolves message-based getters from the current event scope", () => {
    const event = workspace.newBlock("discord_on_message_edit");
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    const channel = workspace.newBlock("discord_get_channel");
    setText(text, "edited");
    connect(send, text, "MESSAGE");
    connect(send, channel, "CHANNEL");
    event.getInput("DO")!.connection!.connect(send.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain("async def on_message_edit(before, after):");
    expect(code).toContain('await after.channel.send("edited")');
    expect(code).not.toContain("message.channel");
  });

  it("enables message_content and members intents when needed", () => {
    const messageEvent = workspace.newBlock("discord_on_message");
    const joinEvent = workspace.newBlock("discord_on_member_join");
    expect(messageEvent.type).toBe("discord_on_message");
    expect(joinEvent.type).toBe("discord_on_member_join");

    const code = generatePythonCode(workspace);
    expect(code).toContain("intents.message_content = True");
    expect(code).toContain("intents.members = True");
    expect(code).toContain(
      "bot = commands.Bot(command_prefix='!', intents=intents)"
    );
    expect(code).toContain("Discord Developer Portal");
  });

  it("defines every block type the generator can emit", () => {
    const blockTypes = [
      "discord_on_ready",
      "discord_on_message",
      "discord_on_message_edit",
      "discord_on_message_delete",
      "discord_on_member_join",
      "discord_on_member_remove",
      "discord_on_reaction_add",
      "discord_send_message",
      "discord_send_embed",
      "discord_edit_message",
      "discord_delete_message",
      "discord_add_reaction",
      "discord_add_role",
      "discord_remove_role",
      "discord_ban_member",
      "discord_kick_member",
      "discord_print",
      "discord_set_variable",
      "discord_get_variable",
      "discord_if",
      "discord_if_else",
      "discord_for_loop",
      "discord_while_loop",
      "discord_comparison",
      "discord_logic_and",
      "discord_logic_or",
      "discord_logic_not",
      "discord_text",
      "discord_number",
      "discord_string_concat",
      "discord_get_message",
      "discord_get_author",
      "discord_get_channel",
      "discord_get_guild",
      "discord_get_message_content",
      "discord_conditional_message",
      "discord_get_all_servers",
      "discord_get_server_by_name",
      "discord_broadcast_to_servers",
      "discord_schedule_task",
      "discord_schedule_daily",
      "discord_wait",
      "discord_slash_command",
      "discord_slash_option",
      "discord_slash_option_value",
      "discord_interaction_reply",
      "discord_interaction_get_user",
      "discord_interaction_get_channel",
      "discord_embed_create",
      "discord_embed_add_field",
      "discord_embed_set",
      "discord_send_embed_object",
      "discord_interaction_reply_embed",
      "discord_button_send",
      "discord_button_reply_view",
      "discord_open_modal",
      "discord_modal_text_input",
      "discord_modal_input_value",
      "discord_db_set",
      "discord_db_get",
      "discord_db_increment",
      "discord_db_delete",
      "discord_db_exists",
    ];

    for (const type of blockTypes) {
      expect(
        () => workspace.newBlock(type),
        `missing block: ${type}`
      ).not.toThrow();
    }
  });

  it("parenthesizes composite operands to preserve grouping", () => {
    const event = workspace.newBlock("discord_on_ready");
    const print = workspace.newBlock("discord_print");
    const andBlock = workspace.newBlock("discord_logic_and");
    const orBlock = workspace.newBlock("discord_logic_or");
    const t1 = workspace.newBlock("discord_text");
    const t2 = workspace.newBlock("discord_text");
    const t3 = workspace.newBlock("discord_text");
    setText(t1, "a");
    setText(t2, "b");
    setText(t3, "c");
    // (a or b) and c
    orBlock.getInput("A")!.connection!.connect(t1.outputConnection!);
    orBlock.getInput("B")!.connection!.connect(t2.outputConnection!);
    andBlock.getInput("A")!.connection!.connect(orBlock.outputConnection!);
    andBlock.getInput("B")!.connection!.connect(t3.outputConnection!);
    print.getInput("TEXT")!.connection!.connect(andBlock.outputConnection!);
    event.getInput("DO")!.connection!.connect(print.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain('print(("a" or "b") and "c")');
  });

  it("ignores loose action blocks left at the module level", () => {
    // A disconnected statement block must not emit invalid module-level code.
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    setText(text, "orphan");
    connect(send, text, "MESSAGE");

    const code = generatePythonCode(workspace);
    expect(code).not.toContain("await");
    expect(code).not.toContain("orphan");
  });

  it("produces balanced brackets and parentheses", () => {
    const event = workspace.newBlock("discord_on_message");
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    const channel = workspace.newBlock("discord_get_channel");
    setText(text, "check");
    connect(send, text, "MESSAGE");
    connect(send, channel, "CHANNEL");
    event.getInput("DO")!.connection!.connect(send.previousConnection!);

    const code = generatePythonCode(workspace);
    const count = (re: RegExp) => (code.match(re) || []).length;
    expect(count(/\(/g)).toBe(count(/\)/g));
    expect(count(/\[/g)).toBe(count(/\]/g));
  });
  it.each(["discord_schedule_task", "discord_schedule_daily"])(
    "activates nested %s only inside the enclosing condition",
    type => {
      const event = workspace.newBlock("discord_on_message");
      const condition = workspace.newBlock("discord_if");
      const schedule = workspace.newBlock(type);
      event.getInput("DO")!.connection!.connect(condition.previousConnection!);
      condition
        .getInput("DO")!
        .connection!.connect(schedule.previousConnection!);
      const code = generatePythonCode(workspace);
      expect(code).toMatch(
        /    if False:\n        if not (scheduled_task|daily_task)\.is_running\(\):\n            \1\.start\(\)/
      );
      expect(code).not.toContain("async def on_ready");
    }
  );

  it("normalizes dynamic daily times like the literal time path", () => {
    const schedule = workspace.newBlock("discord_schedule_daily");
    const time = workspace.newBlock("discord_get_variable");
    time.setFieldValue("daily_time", "VAR");
    schedule.getInput("TIME")!.connection!.connect(time.outputConnection!);
    expect(generatePythonCode(workspace)).toContain(
      "if now == str(daily_time).strip().zfill(5):"
    );
  });

  it("rejects variable names that are not valid Python identifiers", () => {
    const invalidNames = ["my var", "for", "class", "1x", "x-y", "a.b"];
    for (const name of invalidNames) {
      const ws = new Blockly.Workspace();
      const event = ws.newBlock("discord_on_message");
      const setVariable = ws.newBlock("discord_set_variable");
      setVariable.setFieldValue(name, "VAR");
      const text = ws.newBlock("discord_text");
      setText(text, "1");
      connect(setVariable, text, "VALUE");
      event
        .getInput("DO")!
        .connection!.connect(setVariable.previousConnection!);
      expect(
        () => generatePythonCode(ws),
        `expected "${name}" to be rejected`
      ).toThrow(/変数名/);
      ws.dispose();
    }
  });

  it("accepts valid and unicode variable names", () => {
    const names = ["valid_name", "名前"];
    for (const name of names) {
      const ws = new Blockly.Workspace();
      const event = ws.newBlock("discord_on_message");
      const setVariable = ws.newBlock("discord_set_variable");
      setVariable.setFieldValue(name, "VAR");
      const text = ws.newBlock("discord_text");
      setText(text, "hi");
      connect(setVariable, text, "VALUE");
      const getVariable = ws.newBlock("discord_get_variable");
      getVariable.setFieldValue(name, "VAR");
      const print = ws.newBlock("discord_print");
      connect(print, getVariable, "TEXT");
      event
        .getInput("DO")!
        .connection!.connect(setVariable.previousConnection!);
      setVariable.nextConnection!.connect(print.previousConnection!);

      const code = generatePythonCode(ws);
      expect(code).toContain(`${name} = "hi"`);
      expect(code).toContain(`print(${name})`);
      ws.dispose();
    }
  });

  it("rejects identifiers CPython refuses but the base ID properties accept", () => {
    // U+037A fails XID but passes ID_Start; U+24B6 (Ⓐ) normalizes to "A"
    // yet CPython still rejects the original spelling.
    const invalidNames = ["\u037a", "\u24b6", "\u2460"];
    for (const name of invalidNames) {
      for (const kind of ["set", "get"] as const) {
        const ws = new Blockly.Workspace();
        const event = ws.newBlock("discord_on_message");
        const block =
          kind === "set"
            ? ws.newBlock("discord_set_variable")
            : ws.newBlock("discord_get_variable");
        block.setFieldValue(name, "VAR");
        if (kind === "set") {
          const text = ws.newBlock("discord_text");
          setText(text, "1");
          connect(block, text, "VALUE");
          event.getInput("DO")!.connection!.connect(block.previousConnection!);
        } else {
          const print = ws.newBlock("discord_print");
          connect(print, block, "TEXT");
          event.getInput("DO")!.connection!.connect(print.previousConnection!);
        }
        expect(
          () => generatePythonCode(ws),
          `expected ${kind} "${name}" to be rejected`
        ).toThrow(/変数名/);
        ws.dispose();
      }
    }
  });

  it("rejects __debug__ as an assignment target but allows reading it", () => {
    const ws = new Blockly.Workspace();
    const event = ws.newBlock("discord_on_message");
    const setVariable = ws.newBlock("discord_set_variable");
    setVariable.setFieldValue("__debug__", "VAR");
    const text = ws.newBlock("discord_text");
    setText(text, "1");
    connect(setVariable, text, "VALUE");
    event.getInput("DO")!.connection!.connect(setVariable.previousConnection!);
    expect(() => generatePythonCode(ws)).toThrow(/代入/);
    ws.dispose();

    // Reading __debug__ is legal Python, so a get-only workspace must generate.
    const readWs = new Blockly.Workspace();
    const readEvent = readWs.newBlock("discord_on_message");
    const print = readWs.newBlock("discord_print");
    const getVariable = readWs.newBlock("discord_get_variable");
    getVariable.setFieldValue("__debug__", "VAR");
    connect(print, getVariable, "TEXT");
    readEvent.getInput("DO")!.connection!.connect(print.previousConnection!);
    expect(generatePythonCode(readWs)).toContain("print(__debug__)");
    readWs.dispose();
  });

  it("rejects a variable name that shadows a generated global (#14)", () => {
    // `bot = "hi"` inside a handler rebinds the Client locally, so a later
    // `bot.tree`/`bot.run` reference fails with AttributeError at runtime.
    const event = workspace.newBlock("discord_on_ready");
    const setVariable = workspace.newBlock("discord_set_variable");
    setVariable.setFieldValue("bot", "VAR");
    const text = workspace.newBlock("discord_text");
    setText(text, "hi");
    connect(setVariable, text, "VALUE");
    event.getInput("DO")!.connection!.connect(setVariable.previousConnection!);
    expect(() => generatePythonCode(workspace)).toThrow(/変数名「bot」/);
  });

  it("rejects an embed variable name that shadows a generated global (#14)", () => {
    const event = workspace.newBlock("discord_on_ready");
    const create = workspace.newBlock("discord_embed_create");
    create.setFieldValue("discord", "VAR");
    event.getInput("DO")!.connection!.connect(create.previousConnection!);
    expect(() => generatePythonCode(workspace)).toThrow(
      /Embed 変数名「discord」/
    );
  });

  it("still generates for ordinary variable and embed names (#14)", () => {
    const event = workspace.newBlock("discord_on_message");
    const setVariable = workspace.newBlock("discord_set_variable");
    setVariable.setFieldValue("counter", "VAR");
    const number = workspace.newBlock("discord_number");
    setNumber(number, 1);
    connect(setVariable, number, "VALUE");
    const create = workspace.newBlock("discord_embed_create");
    create.setFieldValue("my_embed", "VAR");
    event.getInput("DO")!.connection!.connect(setVariable.previousConnection!);
    setVariable.nextConnection!.connect(create.previousConnection!);
    const code = generatePythonCode(workspace);
    expect(code).toContain("counter = 1");
    expect(code).toContain("my_embed = discord.Embed(");
  });

  it("resolves role names for computed string expressions", () => {
    const event = workspace.newBlock("discord_on_member_join");
    const addRole = workspace.newBlock("discord_add_role");
    const concat = workspace.newBlock("discord_string_concat");
    const a = workspace.newBlock("discord_text");
    const b = workspace.newBlock("discord_text");
    setText(a, "Mem");
    setText(b, "ber");
    connect(concat, a, "A");
    connect(concat, b, "B");
    connect(addRole, concat, "ROLE");
    event.getInput("DO")!.connection!.connect(addRole.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain(
      'await member.add_roles(discord.utils.get(member.guild.roles, name="Mem" + "ber"))'
    );
  });

  it("resolves role names via discord.utils.get on the member's guild", () => {
    const event = workspace.newBlock("discord_on_member_join");
    const addRole = workspace.newBlock("discord_add_role");
    const role = workspace.newBlock("discord_text");
    setText(role, "Member");
    connect(addRole, role, "ROLE");
    event.getInput("DO")!.connection!.connect(addRole.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain(
      'await member.add_roles(discord.utils.get(member.guild.roles, name="Member"))'
    );
    expect(code).not.toContain('add_roles("Member")');
  });

  it("resolves role names for role removal too", () => {
    const event = workspace.newBlock("discord_on_member_join");
    const removeRole = workspace.newBlock("discord_remove_role");
    const role = workspace.newBlock("discord_text");
    setText(role, "Member");
    connect(removeRole, role, "ROLE");
    event.getInput("DO")!.connection!.connect(removeRole.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain(
      'await member.remove_roles(discord.utils.get(member.guild.roles, name="Member"))'
    );
  });

  it("fails generation when a scoped getter is used outside its event", () => {
    const cases: Array<{ event: string; block: string }> = [
      { event: "discord_on_ready", block: "discord_get_channel" },
      { event: "discord_on_ready", block: "discord_get_message" },
      { event: "discord_on_ready", block: "discord_get_author" },
      { event: "discord_on_member_join", block: "discord_get_message_content" },
    ];
    for (const { event, block } of cases) {
      const ws = new Blockly.Workspace();
      const handler = ws.newBlock(event);
      const print = ws.newBlock("discord_print");
      connect(print, ws.newBlock(block), "TEXT");
      handler.getInput("DO")!.connection!.connect(print.previousConnection!);
      expect(
        () => generatePythonCode(ws),
        `expected ${block} in ${event} to be rejected`
      ).toThrow(/利用できません/);
      ws.dispose();
    }
  });

  it("fails generation when a channel action runs outside a channel scope", () => {
    const ws = new Blockly.Workspace();
    const ready = ws.newBlock("discord_on_ready");
    const send = ws.newBlock("discord_send_message");
    const text = ws.newBlock("discord_text");
    setText(text, "hi");
    connect(send, text, "MESSAGE");
    ready.getInput("DO")!.connection!.connect(send.previousConnection!);
    expect(() => generatePythonCode(ws)).toThrow(/利用できません/);
    ws.dispose();
  });

  it("still allows an explicit channel even outside a channel scope", () => {
    const ws = new Blockly.Workspace();
    const ready = ws.newBlock("discord_on_ready");
    const send = ws.newBlock("discord_send_message");
    const text = ws.newBlock("discord_text");
    setText(text, "hi");
    connect(send, text, "MESSAGE");
    // channel_id is a variable the user can define, so this must not throw.
    const channelVar = ws.newBlock("discord_get_variable");
    channelVar.setFieldValue("channel_id", "VAR");
    connect(send, channelVar, "CHANNEL");
    ready.getInput("DO")!.connection!.connect(send.previousConnection!);
    const code = generatePythonCode(ws);
    expect(code).toContain("await channel_id.send");
    ws.dispose();
  });

  it("escapes a lone carriage return in text blocks", () => {
    const event = workspace.newBlock("discord_on_message");
    const send = workspace.newBlock("discord_send_message");
    const text = workspace.newBlock("discord_text");
    const channel = workspace.newBlock("discord_get_channel");
    setText(text, "a\rb");
    connect(send, text, "MESSAGE");
    connect(send, channel, "CHANNEL");
    event.getInput("DO")!.connection!.connect(send.previousConnection!);

    const code = generatePythonCode(workspace);
    expect(code).toContain('"a\\nb"');
    expect(code).not.toContain("\r");
  });

  describe("slash commands", () => {
    function connectStatement(
      parent: Blockly.Block,
      child: Blockly.Block,
      input: string
    ) {
      parent.getInput(input)!.connection!.connect(child.previousConnection!);
    }

    it("generates a tree command with typed, required-first options", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("greet", "NAME");
      cmd.setFieldValue("Greet a user", "DESC");
      const optional = workspace.newBlock("discord_slash_option");
      optional.setFieldValue("times", "NAME");
      optional.setFieldValue("How many", "DESC");
      optional.setFieldValue("int", "TYPE");
      optional.setFieldValue("FALSE", "REQUIRED");
      const required = workspace.newBlock("discord_slash_option");
      required.setFieldValue("user", "NAME");
      required.setFieldValue("The user", "DESC");
      required.setFieldValue("user", "TYPE");
      required.setFieldValue("TRUE", "REQUIRED");
      connectStatement(cmd, optional, "OPTIONS");
      optional.nextConnection!.connect(required.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain("from discord import app_commands");
      expect(code).toContain(
        '@bot.tree.command(name="greet", description="Greet a user")'
      );
      expect(code).toContain(
        '@app_commands.describe(times="How many", user="The user")'
      );
      // Required options must precede optional ones for valid Python.
      expect(code).toContain(
        "async def greet(interaction: discord.Interaction, user: discord.User, times: int = None):"
      );
    });

    it("syncs the command tree once from on_ready", () => {
      workspace.newBlock("discord_slash_command");
      const code = generatePythonCode(workspace);
      expect(code).toContain("async def on_ready():");
      expect(code).toContain("if not getattr(bot, '_tree_synced', False):");
      expect(code).toContain("await bot.tree.sync()");
    });

    it("emits an ephemeral interaction reply inside a slash command", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const reply = workspace.newBlock("discord_interaction_reply");
      const text = workspace.newBlock("discord_text");
      setText(text, "hi");
      connect(reply, text, "MESSAGE");
      reply.setFieldValue("TRUE", "EPHEMERAL");
      connectStatement(cmd, reply, "DO");

      const code = generatePythonCode(workspace);
      expect(code).toContain(
        'await interaction.response.send_message("hi", ephemeral=True)'
      );
    });

    it("reads option values from the handler parameter", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const option = workspace.newBlock("discord_slash_option");
      option.setFieldValue("count", "NAME");
      option.setFieldValue("TRUE", "REQUIRED");
      connectStatement(cmd, option, "OPTIONS");
      const print = workspace.newBlock("discord_print");
      const value = workspace.newBlock("discord_slash_option_value");
      value.setFieldValue("count", "NAME");
      connect(print, value, "TEXT");
      connectStatement(cmd, print, "DO");
      const code = generatePythonCode(workspace);
      expect(code).toContain("print(count)");
      expect(code).not.toContain("interaction.namespace");
    });

    it("sends to a channel option through the resolved callback parameter", () => {
      // discord.py hands a resolved GuildChannel to the parameter; the
      // namespace holds an AppCommandChannel, which has no send().
      const cmd = workspace.newBlock("discord_slash_command");
      const option = workspace.newBlock("discord_slash_option");
      option.setFieldValue("target", "NAME");
      option.setFieldValue("channel", "TYPE");
      option.setFieldValue("TRUE", "REQUIRED");
      connectStatement(cmd, option, "OPTIONS");
      const send = workspace.newBlock("discord_send_message");
      const value = workspace.newBlock("discord_slash_option_value");
      value.setFieldValue("target", "NAME");
      const text = workspace.newBlock("discord_text");
      setText(text, "hi");
      connect(send, value, "CHANNEL");
      connect(send, text, "MESSAGE");
      connectStatement(cmd, send, "DO");
      const code = generatePythonCode(workspace);
      expect(code).toContain('await target.send("hi")');
      expect(code).not.toContain("interaction.namespace");
    });

    it("renames a command whose name is a Python keyword", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("class", "NAME");
      const code = generatePythonCode(workspace);
      expect(code).toContain('@bot.tree.command(name="class"');
      expect(code).toContain(
        "async def class_1(interaction: discord.Interaction):"
      );
    });

    it("rejects option value getters outside the declaring command (#11/#12)", () => {
      // A getter connected to an event handler, not to a slash command, would
      // reference a parameter that does not exist there.
      const event = workspace.newBlock("discord_on_ready");
      const print = workspace.newBlock("discord_print");
      const value = workspace.newBlock("discord_slash_option_value");
      value.setFieldValue("count", "NAME");
      connect(print, value, "TEXT");
      connectStatement(event, print, "DO");
      expect(() => generatePythonCode(workspace)).toThrow(/利用できません/);
    });

    it("rejects an option named interaction, which collides with the handler parameter", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const option = workspace.newBlock("discord_slash_option");
      option.setFieldValue("interaction", "NAME");
      option.setFieldValue("TRUE", "REQUIRED");
      connectStatement(cmd, option, "OPTIONS");
      expect(() => generatePythonCode(workspace)).toThrow(/interaction/);
    });

    it("rejects option names that shadow a generated global (#14)", () => {
      // A `bot` option emits `async def c(..., bot: str)`, so `bot.guilds` in
      // the body refers to the option, not the Client (AttributeError).
      for (const name of ["bot", "discord", "db_set", "asyncio"]) {
        const ws = new Blockly.Workspace();
        const cmd = ws.newBlock("discord_slash_command");
        cmd.setFieldValue("c", "NAME");
        const option = ws.newBlock("discord_slash_option");
        option.setFieldValue(name, "NAME");
        option.setFieldValue("TRUE", "REQUIRED");
        connectStatement(cmd, option, "OPTIONS");
        expect(
          () => generatePythonCode(ws),
          `expected option "${name}" to be rejected`
        ).toThrow(/オプション名/);
        ws.dispose();
      }
    });

    it("still generates for an option name that is not reserved (#14)", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("greet", "NAME");
      const option = workspace.newBlock("discord_slash_option");
      option.setFieldValue("user_name", "NAME");
      option.setFieldValue("TRUE", "REQUIRED");
      connectStatement(cmd, option, "OPTIONS");
      const code = generatePythonCode(workspace);
      expect(code).toContain(
        "async def greet(interaction: discord.Interaction, user_name: str):"
      );
    });

    it("keeps a command named bot from shadowing the bot instance", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("bot", "NAME");
      const code = generatePythonCode(workspace);
      expect(code).toContain(
        "async def bot_1(interaction: discord.Interaction):"
      );
      expect(code).not.toContain("async def bot(interaction");
    });

    it("rejects slash command names Discord would not accept", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("Bad Name", "NAME");
      expect(() => generatePythonCode(workspace)).toThrow(/使用できません/);
    });

    it("rejects option names that are not valid Python identifiers (#11)", () => {
      // A hyphen is a legal Discord name but not a Python parameter name.
      const cases = ["my-opt", "class", "for", "1x", "with space"];
      for (const name of cases) {
        const ws = new Blockly.Workspace();
        const cmd = ws.newBlock("discord_slash_command");
        cmd.setFieldValue("c", "NAME");
        const option = ws.newBlock("discord_slash_option");
        option.setFieldValue(name, "NAME");
        cmd
          .getInput("OPTIONS")!
          .connection!.connect(option.previousConnection!);
        expect(
          () => generatePythonCode(ws),
          `expected option "${name}" to be rejected`
        ).toThrow(/オプション名/);
        ws.dispose();
      }
    });

    it("rejects duplicate option names within one command (#11)", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("c", "NAME");
      const first = workspace.newBlock("discord_slash_option");
      first.setFieldValue("x", "NAME");
      first.setFieldValue("TRUE", "REQUIRED");
      cmd.getInput("OPTIONS")!.connection!.connect(first.previousConnection!);
      const second = workspace.newBlock("discord_slash_option");
      second.setFieldValue("x", "NAME");
      first.nextConnection!.connect(second.previousConnection!);
      expect(() => generatePythonCode(workspace)).toThrow(/重複/);
    });

    it("accepts option names that are valid Python identifiers", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      cmd.setFieldValue("greet", "NAME");
      const option = workspace.newBlock("discord_slash_option");
      option.setFieldValue("user_name", "NAME");
      option.setFieldValue("TRUE", "REQUIRED");
      cmd.getInput("OPTIONS")!.connection!.connect(option.previousConnection!);
      const code = generatePythonCode(workspace);
      expect(code).toContain(
        "async def greet(interaction: discord.Interaction, user_name: str):"
      );
      expect(code).toContain("@app_commands.describe(user_name=");
    });

    it("rejects duplicate slash command names (#12)", () => {
      workspace.newBlock("discord_slash_command").setFieldValue("dup", "NAME");
      workspace.newBlock("discord_slash_command").setFieldValue("dup", "NAME");
      expect(() => generatePythonCode(workspace)).toThrow(
        /同じ名前のスラッシュコマンド/
      );
    });

    it("allows distinct slash command names", () => {
      workspace.newBlock("discord_slash_command").setFieldValue("a", "NAME");
      workspace.newBlock("discord_slash_command").setFieldValue("b", "NAME");
      const code = generatePythonCode(workspace);
      expect(code).toContain('@bot.tree.command(name="a"');
      expect(code).toContain('@bot.tree.command(name="b"');
    });

    it("rejects interaction replies outside an interaction scope", () => {
      const ws = new Blockly.Workspace();
      const ready = ws.newBlock("discord_on_ready");
      const reply = ws.newBlock("discord_interaction_reply");
      const text = ws.newBlock("discord_text");
      setText(text, "hi");
      connect(reply, text, "MESSAGE");
      ready.getInput("DO")!.connection!.connect(reply.previousConnection!);
      expect(() => generatePythonCode(ws)).toThrow(/利用できません/);
      ws.dispose();
    });
  });

  describe("embeds", () => {
    it("builds, augments and sends an embed", () => {
      const event = workspace.newBlock("discord_on_message");
      const create = workspace.newBlock("discord_embed_create");
      create.setFieldValue("embed", "VAR");
      const title = workspace.newBlock("discord_text");
      setText(title, "Title");
      connect(create, title, "TITLE");
      const addField = workspace.newBlock("discord_embed_add_field");
      addField.setFieldValue("embed", "VAR");
      const fieldName = workspace.newBlock("discord_text");
      const fieldValue = workspace.newBlock("discord_text");
      setText(fieldName, "Name");
      setText(fieldValue, "Value");
      connect(addField, fieldName, "NAME");
      connect(addField, fieldValue, "VALUE");
      const setThumb = workspace.newBlock("discord_embed_set");
      setThumb.setFieldValue("embed", "VAR");
      setThumb.setFieldValue("thumbnail", "PROPERTY");
      const url = workspace.newBlock("discord_text");
      setText(url, "https://example.invalid/i.png");
      connect(setThumb, url, "VALUE");
      const send = workspace.newBlock("discord_send_embed_object");
      send.setFieldValue("embed", "VAR");
      connect(send, workspace.newBlock("discord_get_channel"), "CHANNEL");

      event.getInput("DO")!.connection!.connect(create.previousConnection!);
      create.nextConnection!.connect(addField.previousConnection!);
      addField.nextConnection!.connect(setThumb.previousConnection!);
      setThumb.nextConnection!.connect(send.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain(
        'embed = discord.Embed(title="Title", description="", color=0x5865F2)'
      );
      expect(code).toContain(
        'embed.add_field(name="Name", value="Value", inline=True)'
      );
      expect(code).toContain(
        'embed.set_thumbnail(url="https://example.invalid/i.png")'
      );
      expect(code).toContain("await message.channel.send(embed=embed)");
    });

    it("uses the keyword each embed property expects (footer/author)", () => {
      const event = workspace.newBlock("discord_on_message");
      const create = workspace.newBlock("discord_embed_create");
      create.setFieldValue("embed", "VAR");
      const footer = workspace.newBlock("discord_embed_set");
      footer.setFieldValue("embed", "VAR");
      footer.setFieldValue("footer", "PROPERTY");
      const footerText = workspace.newBlock("discord_text");
      setText(footerText, "Footer text");
      connect(footer, footerText, "VALUE");
      const author = workspace.newBlock("discord_embed_set");
      author.setFieldValue("embed", "VAR");
      author.setFieldValue("author", "PROPERTY");
      const authorName = workspace.newBlock("discord_text");
      setText(authorName, "Author name");
      connect(author, authorName, "VALUE");

      event.getInput("DO")!.connection!.connect(create.previousConnection!);
      create.nextConnection!.connect(footer.previousConnection!);
      footer.nextConnection!.connect(author.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain('embed.set_footer(text="Footer text")');
      expect(code).toContain('embed.set_author(name="Author name")');
      expect(code).not.toContain("set_footer(url=");
      expect(code).not.toContain("set_author(url=");
    });

    it("replies with an embed from a slash command", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const create = workspace.newBlock("discord_embed_create");
      create.setFieldValue("embed", "VAR");
      const reply = workspace.newBlock("discord_interaction_reply_embed");
      reply.setFieldValue("embed", "VAR");
      reply.setFieldValue("TRUE", "EPHEMERAL");
      cmd.getInput("DO")!.connection!.connect(create.previousConnection!);
      create.nextConnection!.connect(reply.previousConnection!);
      const code = generatePythonCode(workspace);
      expect(code).toContain(
        "await interaction.response.send_message(embed=embed, ephemeral=True)"
      );
    });
  });

  describe("UI components", () => {
    it("generates a button view class with a callback body", () => {
      const event = workspace.newBlock("discord_on_message");
      const button = workspace.newBlock("discord_button_send");
      button.setFieldValue("primary", "STYLE");
      connect(button, workspace.newBlock("discord_get_channel"), "CHANNEL");
      const label = workspace.newBlock("discord_text");
      setText(label, "Click");
      connect(button, label, "LABEL");
      const clickReply = workspace.newBlock("discord_interaction_reply");
      const clickText = workspace.newBlock("discord_text");
      setText(clickText, "Clicked");
      connect(clickReply, clickText, "MESSAGE");
      button
        .getInput("ON_CLICK")!
        .connection!.connect(clickReply.previousConnection!);
      event.getInput("DO")!.connection!.connect(button.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain("class ButtonView_0(discord.ui.View):");
      expect(code).toContain(
        "self.button = discord.ui.Button(label=label, style=discord.ButtonStyle.primary)"
      );
      expect(code).toContain("self.button.callback = self.on_click");
      expect(code).toContain(
        'await interaction.response.send_message("Clicked")'
      );
      expect(code).toContain('view=ButtonView_0("Click")');
    });

    it("generates a modal class with text inputs and on_submit", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const modal = workspace.newBlock("discord_open_modal");
      const title = workspace.newBlock("discord_text");
      setText(title, "Feedback");
      connect(modal, title, "TITLE");
      const input = workspace.newBlock("discord_modal_text_input");
      input.setFieldValue("answer", "NAME");
      input.setFieldValue("Your answer", "LABEL");
      input.setFieldValue("paragraph", "STYLE");
      input.setFieldValue("FALSE", "REQUIRED");
      const placeholder = workspace.newBlock("discord_text");
      setText(placeholder, "Type here");
      connect(input, placeholder, "PLACEHOLDER");
      modal.getInput("INPUTS")!.connection!.connect(input.previousConnection!);
      const submit = workspace.newBlock("discord_interaction_reply");
      const value = workspace.newBlock("discord_modal_input_value");
      value.setFieldValue("answer", "NAME");
      connect(submit, value, "MESSAGE");
      modal
        .getInput("ON_SUBMIT")!
        .connection!.connect(submit.previousConnection!);
      cmd.getInput("DO")!.connection!.connect(modal.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain("class Modal_0(discord.ui.Modal):");
      expect(code).toContain(
        "def __init__(self, title, answer_placeholder=None):"
      );
      expect(code).toContain(
        'self.answer = discord.ui.TextInput(label="Your answer", style=discord.TextStyle.paragraph, placeholder=answer_placeholder, required=False)'
      );
      expect(code).toContain("self.add_item(self.answer)");
      expect(code).toContain("async def on_submit(self, interaction):");
      expect(code).toContain(
        "await interaction.response.send_message(self.answer.value)"
      );
      expect(code).toContain(
        'await interaction.response.send_modal(Modal_0("Feedback", "Type here"))'
      );
    });

    it("builds a link button manually instead of using the button decorator", () => {
      const event = workspace.newBlock("discord_on_message");
      const button = workspace.newBlock("discord_button_send");
      button.setFieldValue("link", "STYLE");
      connect(button, workspace.newBlock("discord_get_channel"), "CHANNEL");
      const label = workspace.newBlock("discord_text");
      setText(label, "Docs");
      connect(button, label, "LABEL");
      const url = workspace.newBlock("discord_text");
      setText(url, "https://example.invalid");
      connect(button, url, "URL");
      event.getInput("DO")!.connection!.connect(button.previousConnection!);

      const code = generatePythonCode(workspace);
      // The decorator rejects url, so a manual discord.ui.Button must be used.
      expect(code).not.toContain("@discord.ui.button(");
      expect(code).toContain(
        "self.button = discord.ui.Button(label=label, style=discord.ButtonStyle.link, url=url)"
      );
      expect(code).toContain("self.add_item(self.button)");
      expect(code).toContain('ButtonView_0("Docs", "https://example.invalid")');
    });

    it("passes a handler-local button label into the view constructor", () => {
      // `message.content` only exists inside on_message; it must not leak into
      // the module-level class body (which would raise NameError at startup).
      const event = workspace.newBlock("discord_on_message");
      const button = workspace.newBlock("discord_button_send");
      button.setFieldValue("primary", "STYLE");
      connect(button, workspace.newBlock("discord_get_channel"), "CHANNEL");
      const label = workspace.newBlock("discord_get_message_content");
      connect(button, label, "LABEL");
      event.getInput("DO")!.connection!.connect(button.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain("def __init__(self, label):");
      expect(code).toContain("discord.ui.Button(label=label,");
      expect(code).not.toContain("label=message.content");
      expect(code).toContain("ButtonView_0(message.content)");
    });

    it("rejects duplicate modal input names (#12-style collision)", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const modal = workspace.newBlock("discord_open_modal");
      const first = workspace.newBlock("discord_modal_text_input");
      first.setFieldValue("answer", "NAME");
      const second = workspace.newBlock("discord_modal_text_input");
      second.setFieldValue("answer", "NAME");
      modal.getInput("INPUTS")!.connection!.connect(first.previousConnection!);
      first.nextConnection!.connect(second.previousConnection!);
      cmd.getInput("DO")!.connection!.connect(modal.previousConnection!);
      expect(() => generatePythonCode(workspace)).toThrow(/重複/);
    });

    it("rejects a modal input named on_submit", () => {
      const cmd = workspace.newBlock("discord_slash_command");
      const modal = workspace.newBlock("discord_open_modal");
      const input = workspace.newBlock("discord_modal_text_input");
      input.setFieldValue("on_submit", "NAME");
      modal.getInput("INPUTS")!.connection!.connect(input.previousConnection!);
      cmd.getInput("DO")!.connection!.connect(modal.previousConnection!);
      expect(() => generatePythonCode(workspace)).toThrow(/使用できません/);
    });
  });

  describe("database blocks", () => {
    it("emits parameterized sqlite helpers and calls them", () => {
      const event = workspace.newBlock("discord_on_message");
      const set = workspace.newBlock("discord_db_set");
      const key = workspace.newBlock("discord_text");
      const value = workspace.newBlock("discord_text");
      setText(key, "counter");
      setText(value, "1");
      connect(set, key, "KEY");
      connect(set, value, "VALUE");
      const inc = workspace.newBlock("discord_db_increment");
      const incKey = workspace.newBlock("discord_text");
      setText(incKey, "counter");
      connect(inc, incKey, "KEY");
      const del = workspace.newBlock("discord_db_delete");
      const delKey = workspace.newBlock("discord_text");
      setText(delKey, "counter");
      connect(del, delKey, "KEY");
      event.getInput("DO")!.connection!.connect(set.previousConnection!);
      set.nextConnection!.connect(inc.previousConnection!);
      inc.nextConnection!.connect(del.previousConnection!);

      const code = generatePythonCode(workspace);
      expect(code).toContain("import sqlite3");
      expect(code).toContain("db_init()");
      expect(code).toContain('db_set("counter", "1")');
      expect(code).toContain('db_increment("counter", 1)');
      expect(code).toContain('db_delete("counter")');
      // Bind parameters must be used, never f-strings / % formatting.
      expect(code).toContain("VALUES (?, ?)");
      expect(code).toContain("WHERE key = ?");
      expect(code).not.toMatch(/execute\(f"/);
    });

    it("reads values and existence checks as expressions", () => {
      const event = workspace.newBlock("discord_on_message");
      const print = workspace.newBlock("discord_print");
      const get = workspace.newBlock("discord_db_get");
      const key = workspace.newBlock("discord_text");
      const def = workspace.newBlock("discord_number");
      setText(key, "k");
      setNumber(def, 0);
      connect(get, key, "KEY");
      connect(get, def, "DEFAULT");
      connect(print, get, "TEXT");
      event.getInput("DO")!.connection!.connect(print.previousConnection!);
      const code = generatePythonCode(workspace);
      expect(code).toContain('print(db_get("k", 0))');
    });
  });
});
