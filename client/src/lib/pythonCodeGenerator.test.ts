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
});
