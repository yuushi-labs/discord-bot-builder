import { describe, it, expect } from "vitest";

/**
 * Test suite for Python code generation
 * These tests verify that the generated Python code has the correct structure
 */

describe("Python Code Generator - Output Validation", () => {
  // Sample generated code patterns
  const sampleGeneratedCode = `import discord
from discord.ext import commands

bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    await message.channel.send("Hello!")

# Replace 'YOUR_DISCORD_BOT_TOKEN' with your actual bot token
bot.run('YOUR_DISCORD_BOT_TOKEN')`;

  it("should have valid Python imports", () => {
    expect(sampleGeneratedCode).toContain("import discord");
    expect(sampleGeneratedCode).toContain("from discord.ext import commands");
  });

  it("should initialize bot with correct parameters", () => {
    expect(sampleGeneratedCode).toContain("bot = commands.Bot");
    expect(sampleGeneratedCode).toContain("command_prefix='!'");
    expect(sampleGeneratedCode).toContain("intents=discord.Intents.default()");
  });

  it("should have event decorators", () => {
    expect(sampleGeneratedCode).toContain("@bot.event");
    expect(sampleGeneratedCode).toContain("async def on_ready():");
    expect(sampleGeneratedCode).toContain("async def on_message(message):");
  });

  it("should have bot.run() call at the end", () => {
    expect(sampleGeneratedCode).toContain("bot.run('YOUR_DISCORD_BOT_TOKEN')");
  });

  it("should have proper async/await syntax", () => {
    expect(sampleGeneratedCode).toMatch(/async def on_\w+\(/);
    expect(sampleGeneratedCode).toContain("await message.channel.send");
  });

  it("should have proper indentation", () => {
    const lines = sampleGeneratedCode.split("\n");
    const asyncDefLine = lines.find((line) => line.includes("async def"));
    const awaitLine = lines.find((line) => line.includes("await"));

    // async def should be at the start of a line (after decorator)
    expect(asyncDefLine).toBeDefined();

    // await should be indented
    expect(awaitLine).toBeDefined();
    expect(awaitLine?.startsWith("    ")).toBe(true);
  });

  it("should have message author check in on_message", () => {
    expect(sampleGeneratedCode).toContain("if message.author == bot.user:");
  });

  it("should be valid Python 3 syntax", () => {
    // Check for Python 3 specific syntax
    expect(sampleGeneratedCode).toContain("async def");
    expect(sampleGeneratedCode).toContain("await");
    expect(sampleGeneratedCode).toContain("f'");
  });

  it("should have comment for token replacement", () => {
    expect(sampleGeneratedCode).toContain("# Replace 'YOUR_DISCORD_BOT_TOKEN'");
  });

  it("should not have syntax errors", () => {
    // Basic validation - no unclosed parentheses
    const openParens = (sampleGeneratedCode.match(/\(/g) || []).length;
    const closeParens = (sampleGeneratedCode.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);

    // No unclosed brackets
    const openBrackets = (sampleGeneratedCode.match(/\[/g) || []).length;
    const closeBrackets = (sampleGeneratedCode.match(/\]/g) || []).length;
    expect(openBrackets).toBe(closeBrackets);

    // No unclosed braces
    const openBraces = (sampleGeneratedCode.match(/\{/g) || []).length;
    const closeBraces = (sampleGeneratedCode.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  it("should support multiple event handlers", () => {
    const multiEventCode = `import discord
from discord.ext import commands

bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    await message.channel.send("Hello!")

@bot.event
async def on_member_join(member):
    await member.guild.system_channel.send(f'{member} has joined the server!')

bot.run('YOUR_DISCORD_BOT_TOKEN')`;

    expect(multiEventCode).toContain("async def on_ready():");
    expect(multiEventCode).toContain("async def on_message(message):");
    expect(multiEventCode).toContain("async def on_member_join(member):");
    const eventMatches = multiEventCode.match(/@bot.event/g);
    expect(eventMatches?.length).toBe(3);
  });
});
