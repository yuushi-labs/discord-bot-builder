import { beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import * as Blockly from "blockly";
import { defineDiscordBlocks } from "../client/src/lib/blocklyBlocks";
import { generatePythonCode } from "../client/src/lib/pythonCodeGenerator";

beforeAll(() => defineDiscordBlocks());

function connectStatement(
  parent: Blockly.Block,
  input: string,
  child: Blockly.Block
) {
  parent.getInput(input)!.connection!.connect(child.previousConnection!);
}
function connectValue(
  parent: Blockly.Block,
  input: string,
  child: Blockly.Block
) {
  parent.getInput(input)!.connection!.connect(child.outputConnection!);
}
function assertPythonSyntax(code: string) {
  const result = spawnSync(
    process.env.PYTHON || (process.platform === "win32" ? "python" : "python3"),
    ["-c", "import ast, sys; ast.parse(sys.stdin.read())"],
    { input: code, encoding: "utf8" }
  );
  expect(result.status, result.stderr).toBe(0);
}

describe("Blockly Python export", () => {
  it("places connected and nested actions in event handlers and uses the project token", () => {
    const ws = new Blockly.Workspace();
    const ready = ws.newBlock("discord_on_ready");
    const print = ws.newBlock("discord_print");
    const text = ws.newBlock("discord_text");
    text.setFieldValue('a\\b"c', "TEXT");
    connectStatement(ready, "DO", print);
    connectValue(print, "TEXT", text);
    const message = ws.newBlock("discord_on_message");
    const condition = ws.newBlock("discord_if");
    const send = ws.newBlock("discord_send_message");
    const channel = ws.newBlock("discord_get_channel");
    connectStatement(message, "DO", condition);
    connectStatement(condition, "DO", send);
    connectValue(send, "CHANNEL", channel);
    const code = generatePythonCode(ws, { tokenExpr: '"test-token"' });
    expect(code).toContain('async def on_ready():\n    print("a\\\\b\\"c")');
    expect(code).toContain(
      'async def on_message(message):\n    if message.author == bot.user:\n        return\n    if False:\n        await message.channel.send("")'
    );
    expect(code).toContain('bot.run("test-token")');
    expect(code).not.toContain("intents.members = True");
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("generates valid empty event handlers and supports message getters on edits", () => {
    const ws = new Blockly.Workspace();
    ws.newBlock("discord_on_member_join");
    const edit = ws.newBlock("discord_on_message_edit");
    const print = ws.newBlock("discord_print");
    connectStatement(edit, "DO", print);
    connectValue(print, "TEXT", ws.newBlock("discord_get_message_content"));
    const code = generatePythonCode(ws);
    expect(code).toContain("async def on_member_join(member):\n    pass");
    expect(code).toContain("print(after.content)");
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("rejects duplicate handlers and ignores detached blocks", () => {
    const ws = new Blockly.Workspace();
    ws.newBlock("discord_on_ready");
    ws.newBlock("discord_on_ready");
    expect(() => generatePythonCode(ws)).toThrow(/同じイベント/);
    ws.clear();
    ws.newBlock("discord_send_message");
    expect(generatePythonCode(ws)).not.toContain("await");
    ws.dispose();
  });

  it("resolves role names and keeps the generated code valid", () => {
    const ws = new Blockly.Workspace();
    const join = ws.newBlock("discord_on_member_join");
    const addRole = ws.newBlock("discord_add_role");
    const role = ws.newBlock("discord_text");
    role.setFieldValue("Member", "TEXT");
    connectValue(addRole, "ROLE", role);
    connectStatement(join, "DO", addRole);
    const code = generatePythonCode(ws);
    expect(code).toContain(
      'await member.add_roles(discord.utils.get(member.guild.roles, name="Member"))'
    );
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("escapes a lone carriage return without breaking the string", () => {
    const ws = new Blockly.Workspace();
    const message = ws.newBlock("discord_on_message");
    const send = ws.newBlock("discord_send_message");
    const text = ws.newBlock("discord_text");
    text.setFieldValue("a\rb", "TEXT");
    connectValue(send, "CHANNEL", ws.newBlock("discord_get_channel"));
    connectValue(send, "MESSAGE", text);
    connectStatement(message, "DO", send);
    const code = generatePythonCode(ws);
    expect(code).toContain('"a\\nb"');
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("resolves a computed role name and keeps the generated code valid", () => {
    const ws = new Blockly.Workspace();
    const join = ws.newBlock("discord_on_member_join");
    const removeRole = ws.newBlock("discord_remove_role");
    const concat = ws.newBlock("discord_string_concat");
    const a = ws.newBlock("discord_text");
    const b = ws.newBlock("discord_text");
    a.setFieldValue("Mem", "TEXT");
    b.setFieldValue("ber", "TEXT");
    connectValue(concat, "A", a);
    connectValue(concat, "B", b);
    connectValue(removeRole, "ROLE", concat);
    connectStatement(join, "DO", removeRole);
    const code = generatePythonCode(ws);
    expect(code).toContain(
      'await member.remove_roles(discord.utils.get(member.guild.roles, name="Mem" + "ber"))'
    );
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("generates a valid slash command with options, embed, button and modal", () => {
    const ws = new Blockly.Workspace();
    const cmd = ws.newBlock("discord_slash_command");
    cmd.setFieldValue("greet", "NAME");
    cmd.setFieldValue("Greet a user", "DESC");
    const option = ws.newBlock("discord_slash_option");
    option.setFieldValue("user", "NAME");
    option.setFieldValue("The user", "DESC");
    option.setFieldValue("user", "TYPE");
    option.setFieldValue("TRUE", "REQUIRED");
    cmd.getInput("OPTIONS")!.connection!.connect(option.previousConnection!);

    const create = ws.newBlock("discord_embed_create");
    create.setFieldValue("embed", "VAR");
    const title = ws.newBlock("discord_text");
    title.setFieldValue("Hello", "TEXT");
    connectValue(create, "TITLE", title);
    const addField = ws.newBlock("discord_embed_add_field");
    addField.setFieldValue("embed", "VAR");
    const fieldName = ws.newBlock("discord_text");
    fieldName.setFieldValue("Field", "TEXT");
    const fieldValue = ws.newBlock("discord_text");
    fieldValue.setFieldValue("Value", "TEXT");
    connectValue(addField, "NAME", fieldName);
    connectValue(addField, "VALUE", fieldValue);

    const button = ws.newBlock("discord_button_reply_view");
    button.setFieldValue("primary", "STYLE");
    const label = ws.newBlock("discord_text");
    label.setFieldValue("Click", "TEXT");
    connectValue(button, "LABEL", label);
    const clickReply = ws.newBlock("discord_interaction_reply");
    const clickText = ws.newBlock("discord_text");
    clickText.setFieldValue("Clicked", "TEXT");
    connectValue(clickReply, "MESSAGE", clickText);
    button
      .getInput("ON_CLICK")!
      .connection!.connect(clickReply.previousConnection!);

    const modal = ws.newBlock("discord_open_modal");
    const modalTitle = ws.newBlock("discord_text");
    modalTitle.setFieldValue("Feedback", "TEXT");
    connectValue(modal, "TITLE", modalTitle);
    const input = ws.newBlock("discord_modal_text_input");
    input.setFieldValue("answer", "NAME");
    input.setFieldValue("Your answer", "LABEL");
    input.setFieldValue("paragraph", "STYLE");
    modal.getInput("INPUTS")!.connection!.connect(input.previousConnection!);
    const submit = ws.newBlock("discord_interaction_reply");
    const value = ws.newBlock("discord_modal_input_value");
    value.setFieldValue("answer", "NAME");
    connectValue(submit, "MESSAGE", value);
    modal
      .getInput("ON_SUBMIT")!
      .connection!.connect(submit.previousConnection!);

    const replyEmbed = ws.newBlock("discord_interaction_reply_embed");
    replyEmbed.setFieldValue("embed", "VAR");
    replyEmbed.setFieldValue("TRUE", "EPHEMERAL");

    connectStatement(cmd, "DO", create);
    create.nextConnection!.connect(addField.previousConnection!);
    addField.nextConnection!.connect(button.previousConnection!);
    button.nextConnection!.connect(modal.previousConnection!);
    modal.nextConnection!.connect(replyEmbed.previousConnection!);

    const code = generatePythonCode(ws, { tokenExpr: '"test-token"' });
    expect(code).toContain("from discord import app_commands");
    expect(code).toContain('@bot.tree.command(name="greet"');
    expect(code).toContain("await bot.tree.sync()");
    expect(code).toContain("class ButtonView_0(discord.ui.View):");
    expect(code).toContain("class Modal_1(discord.ui.Modal");
    expect(code).toContain(
      'await interaction.response.send_modal(Modal_1("Feedback"))'
    );
    assertPythonSyntax(code);
    ws.dispose();
  });

  it("generates valid sqlite-backed code with bound parameters", () => {
    const ws = new Blockly.Workspace();
    const message = ws.newBlock("discord_on_message");
    const set = ws.newBlock("discord_db_set");
    const key = ws.newBlock("discord_text");
    key.setFieldValue("points", "TEXT");
    const value = ws.newBlock("discord_number");
    value.setFieldValue(1, "NUM");
    connectValue(set, "KEY", key);
    connectValue(set, "VALUE", value);
    const inc = ws.newBlock("discord_db_increment");
    const incKey = ws.newBlock("discord_text");
    incKey.setFieldValue("points", "TEXT");
    connectValue(inc, "KEY", incKey);
    connectStatement(message, "DO", set);
    set.nextConnection!.connect(inc.previousConnection!);

    const code = generatePythonCode(ws, { tokenExpr: '"test-token"' });
    expect(code).toContain("import sqlite3");
    expect(code).toContain('db_set("points", 1)');
    expect(code).toContain('db_increment("points", 1)');
    // A value coming from a user must never be interpolated into the SQL text.
    expect(code).not.toMatch(/execute\([^)]*(%|\+)/);
    assertPythonSyntax(code);
    ws.dispose();
  });
});
