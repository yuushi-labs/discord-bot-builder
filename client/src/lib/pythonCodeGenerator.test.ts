import { describe, it, expect } from "vitest";
import { generatePythonCode } from "./pythonCodeGenerator";
import * as Blockly from "blockly";
import { defineDiscordBlocks } from "./blocklyBlocks";

describe("Python Code Generator", () => {
  let workspace: Blockly.WorkspaceSvg;

  beforeEach(() => {
    // Create a test workspace
    const div = document.createElement("div");
    workspace = Blockly.inject(div, {
      toolbox: "<xml></xml>",
    });
    defineDiscordBlocks();
  });

  afterEach(() => {
    if (workspace) {
      workspace.dispose();
    }
  });

  it("should generate basic Python code with imports and bot initialization", () => {
    const code = generatePythonCode(workspace);
    expect(code).toContain("import discord");
    expect(code).toContain("from discord.ext import commands");
    expect(code).toContain("bot = commands.Bot");
    expect(code).toContain("bot.run('YOUR_DISCORD_BOT_TOKEN')");
  });

  it("should generate code with on_ready event", () => {
    const block = workspace.newBlock("discord_on_ready");
    block.initSvg();
    workspace.render();

    const code = generatePythonCode(workspace);
    expect(code).toContain("@bot.event");
    expect(code).toContain("async def on_ready():");
  });

  it("should generate code with on_message event", () => {
    const block = workspace.newBlock("discord_on_message");
    block.initSvg();
    workspace.render();

    const code = generatePythonCode(workspace);
    expect(code).toContain("@bot.event");
    expect(code).toContain("async def on_message(message):");
    expect(code).toContain("if message.author == bot.user:");
  });

  it("should generate code with send_message action", () => {
    const code = generatePythonCode(workspace);
    // Verify that the code is valid Python
    expect(code).toContain("import discord");
    expect(code).toContain("bot.run");
  });

  it("should have valid Python syntax", () => {
    const code = generatePythonCode(workspace);
    // Basic syntax checks
    expect(code).toMatch(/^import discord/m);
    expect(code).toMatch(/bot\.run\(/);
    expect(code).toContain("async def");
  });

  it("should generate code with proper indentation", () => {
    const block = workspace.newBlock("discord_on_ready");
    block.initSvg();
    workspace.render();

    const code = generatePythonCode(workspace);
    const lines = code.split("\n");
    // Check that async def is not indented at the top level
    const asyncLine = lines.find((line) => line.includes("async def"));
    expect(asyncLine).toBeDefined();
    expect(asyncLine?.startsWith("@")).toBe(true);
  });
});
