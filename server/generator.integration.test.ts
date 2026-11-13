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
});
