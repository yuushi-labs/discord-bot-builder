import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Python Code Generator
 * Converts Blockly blocks to discord.py compatible Python code
 */

interface CodeContext {
  indent: number;
  code: string[];
  variables: Set<string>;
  events: string[];
}

const INDENT_SIZE = 4;

function getIndent(level: number): string {
  return " ".repeat(level * INDENT_SIZE);
}

function addLine(ctx: CodeContext, line: string): void {
  ctx.code.push(getIndent(ctx.indent) + line);
}

function increaseIndent(ctx: CodeContext): void {
  ctx.indent++;
}

function decreaseIndent(ctx: CodeContext): void {
  ctx.indent = Math.max(0, ctx.indent - 1);
}

function blockToCode(block: Blockly.Block, ctx: CodeContext): string {
  const type = block.type;

  switch (type) {
    // Event blocks
    case "discord_on_ready":
      return generateOnReady(block, ctx);
    case "discord_on_message":
      return generateOnMessage(block, ctx);
    case "discord_on_message_edit":
      return generateOnMessageEdit(block, ctx);
    case "discord_on_message_delete":
      return generateOnMessageDelete(block, ctx);
    case "discord_on_member_join":
      return generateOnMemberJoin(block, ctx);
    case "discord_on_member_remove":
      return generateOnMemberRemove(block, ctx);
    case "discord_conditional_message":
      return generateConditionalMessage(block, ctx);
    case "discord_get_all_servers":
      return generateGetAllServers(block, ctx);
    case "discord_get_server_by_name":
      return generateGetServerByName(block, ctx);
    case "discord_broadcast_to_servers":
      return generateBroadcastToServers(block, ctx);
    case "discord_schedule_task":
      return generateScheduleTask(block, ctx);
    case "discord_schedule_daily":
      return generateScheduleDaily(block, ctx);
    case "discord_wait":
      return generateWait(block, ctx);
    case "discord_on_reaction_add":
      return generateOnReactionAdd(block, ctx);

    // Action blocks
    case "discord_send_message":
      return generateSendMessage(block, ctx);
    case "discord_send_embed":
      return generateSendEmbed(block, ctx);
    case "discord_edit_message":
      return generateEditMessage(block, ctx);
    case "discord_delete_message":
      return generateDeleteMessage(block, ctx);
    case "discord_add_reaction":
      return generateAddReaction(block, ctx);
    case "discord_add_role":
      return generateAddRole(block, ctx);
    case "discord_remove_role":
      return generateRemoveRole(block, ctx);
    case "discord_ban_member":
      return generateBanMember(block, ctx);
    case "discord_kick_member":
      return generateKickMember(block, ctx);

    // Control flow blocks
    case "discord_if":
      return generateIf(block, ctx);
    case "discord_if_else":
      return generateIfElse(block, ctx);
    case "discord_for_loop":
      return generateForLoop(block, ctx);
    case "discord_while_loop":
      return generateWhileLoop(block, ctx);

    // Variable blocks
    case "discord_set_variable":
      return generateSetVariable(block, ctx);
    case "discord_get_variable":
      return generateGetVariable(block, ctx);

    // Utility blocks
    case "discord_print":
      return generatePrint(block, ctx);
    case "discord_text":
      return generateText(block);
    case "discord_number":
      return generateNumber(block);
    case "discord_string_concat":
      return generateStringConcat(block, ctx);

    // Comparison and logic blocks
    case "discord_comparison":
      return generateComparison(block, ctx);
    case "discord_logic_and":
      return generateLogicAnd(block, ctx);
    case "discord_logic_or":
      return generateLogicOr(block, ctx);
    case "discord_logic_not":
      return generateLogicNot(block, ctx);

    // Getter blocks
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

    default:
      return "";
  }
}

// Event generators
function generateOnReady(block: Blockly.Block, ctx: CodeContext): string {
  ctx.events.push("@bot.event\nasync def on_ready():\n    print(f'{bot.user} has connected to Discord!')");
  return "";
}

function generateOnMessage(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_message(message):\n    if message.author == bot.user:\n        return\n${statements}`;
  ctx.events.push(code);
  return "";
}

function generateOnMessageEdit(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_message_edit(before, after):\n${statements}`;
  ctx.events.push(code);
  return "";
}

function generateOnMessageDelete(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_message_delete(message):\n${statements}`;
  ctx.events.push(code);
  return "";
}

function generateOnMemberJoin(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_member_join(member):\n${statements}`;
  ctx.events.push(code);
  return "";
}

function generateOnMemberRemove(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_member_remove(member):\n${statements}`;
  ctx.events.push(code);
  return "";
}

function generateOnReactionAdd(block: Blockly.Block, ctx: CodeContext): string {
  const statements = getStatements(block, "DO", ctx);
  const code = `@bot.event\nasync def on_reaction_add(reaction, user):\n${statements}`;
  ctx.events.push(code);
  return "";
}

// Action generators
function generateSendMessage(block: Blockly.Block, ctx: CodeContext): string {
  const channel = getInputValue(block, "CHANNEL", ctx);
  const message = getInputValue(block, "MESSAGE", ctx);
  addLine(ctx, `await ${channel}.send(${message})`);
  return "";
}

function generateSendEmbed(block: Blockly.Block, ctx: CodeContext): string {
  const channel = getInputValue(block, "CHANNEL", ctx);
  const title = getInputValue(block, "TITLE", ctx);
  const description = getInputValue(block, "DESCRIPTION", ctx);
  const color = getInputValue(block, "COLOR", ctx);
  addLine(ctx, `embed = discord.Embed(title=${title}, description=${description}, color=${color})`);
  addLine(ctx, `await ${channel}.send(embed=embed)`);
  return "";
}

function generateEditMessage(block: Blockly.Block, ctx: CodeContext): string {
  const message = getInputValue(block, "MESSAGE", ctx);
  const content = getInputValue(block, "NEW_CONTENT", ctx);
  addLine(ctx, `await ${message}.edit(content=${content})`);
  return "";
}

function generateDeleteMessage(block: Blockly.Block, ctx: CodeContext): string {
  const message = getInputValue(block, "MESSAGE", ctx);
  addLine(ctx, `await ${message}.delete()`);
  return "";
}

function generateAddReaction(block: Blockly.Block, ctx: CodeContext): string {
  const message = getInputValue(block, "MESSAGE", ctx);
  const emoji = getInputValue(block, "EMOJI", ctx);
  addLine(ctx, `await ${message}.add_reaction(${emoji})`);
  return "";
}

function generateAddRole(block: Blockly.Block, ctx: CodeContext): string {
  const member = getInputValue(block, "MEMBER", ctx);
  const role = getInputValue(block, "ROLE", ctx);
  addLine(ctx, `await ${member}.add_roles(${role})`);
  return "";
}

function generateRemoveRole(block: Blockly.Block, ctx: CodeContext): string {
  const member = getInputValue(block, "MEMBER", ctx);
  const role = getInputValue(block, "ROLE", ctx);
  addLine(ctx, `await ${member}.remove_roles(${role})`);
  return "";
}

function generateBanMember(block: Blockly.Block, ctx: CodeContext): string {
  const member = getInputValue(block, "MEMBER", ctx);
  const reason = getInputValue(block, "REASON", ctx);
  addLine(ctx, `await ${member}.ban(reason=${reason})`);
  return "";
}

function generateKickMember(block: Blockly.Block, ctx: CodeContext): string {
  const member = getInputValue(block, "MEMBER", ctx);
  const reason = getInputValue(block, "REASON", ctx);
  addLine(ctx, `await ${member}.kick(reason=${reason})`);
  return "";
}

// Control flow generators
function generateIf(block: Blockly.Block, ctx: CodeContext): string {
  const condition = getInputValue(block, "CONDITION", ctx);
  addLine(ctx, `if ${condition}:`);
  increaseIndent(ctx);
  getStatements(block, "DO", ctx);
  decreaseIndent(ctx);
  return "";
}

function generateIfElse(block: Blockly.Block, ctx: CodeContext): string {
  const condition = getInputValue(block, "CONDITION", ctx);
  addLine(ctx, `if ${condition}:`);
  increaseIndent(ctx);
  getStatements(block, "DO", ctx);
  decreaseIndent(ctx);
  addLine(ctx, `else:`);
  increaseIndent(ctx);
  getStatements(block, "ELSE", ctx);
  decreaseIndent(ctx);
  return "";
}

function generateForLoop(block: Blockly.Block, ctx: CodeContext): string {
  const list = getInputValue(block, "LIST", ctx);
  addLine(ctx, `for item in ${list}:`);
  increaseIndent(ctx);
  getStatements(block, "DO", ctx);
  decreaseIndent(ctx);
  return "";
}

function generateWhileLoop(block: Blockly.Block, ctx: CodeContext): string {
  const condition = getInputValue(block, "CONDITION", ctx);
  addLine(ctx, `while ${condition}:`);
  increaseIndent(ctx);
  getStatements(block, "DO", ctx);
  decreaseIndent(ctx);
  return "";
}

// Variable generators
function generateSetVariable(block: Blockly.Block, ctx: CodeContext): string {
  const varName = block.getFieldValue("NAME");
  const value = getInputValue(block, "VALUE", ctx);
  ctx.variables.add(varName);
  addLine(ctx, `${varName} = ${value}`);
  return "";
}

function generateGetVariable(block: Blockly.Block, ctx: CodeContext): string {
  const varName = block.getFieldValue("NAME");
  return varName;
}

// Utility generators
function generatePrint(block: Blockly.Block, ctx: CodeContext): string {
  const text = getInputValue(block, "TEXT", ctx);
  addLine(ctx, `print(${text})`);
  return "";
}

function generateText(block: Blockly.Block): string {
  const text = block.getFieldValue("TEXT");
  return `"${text.replace(/"/g, '\\"')}"`;
}

function generateNumber(block: Blockly.Block): string {
  return block.getFieldValue("NUM");
}

function generateStringConcat(block: Blockly.Block, ctx: CodeContext): string {
  const a = getInputValue(block, "A", ctx);
  const b = getInputValue(block, "B", ctx);
  return `${a} + ${b}`;
}

// Comparison and logic generators
function generateComparison(block: Blockly.Block, ctx: CodeContext): string {
  const a = getInputValue(block, "A", ctx);
  const op = block.getFieldValue("OP");
  const b = getInputValue(block, "B", ctx);
  return `${a} ${op} ${b}`;
}

function generateLogicAnd(block: Blockly.Block, ctx: CodeContext): string {
  const a = getInputValue(block, "A", ctx);
  const b = getInputValue(block, "B", ctx);
  return `${a} and ${b}`;
}

function generateLogicOr(block: Blockly.Block, ctx: CodeContext): string {
  const a = getInputValue(block, "A", ctx);
  const b = getInputValue(block, "B", ctx);
  return `${a} or ${b}`;
}

function generateLogicNot(block: Blockly.Block, ctx: CodeContext): string {
  const a = getInputValue(block, "A", ctx);
  return `not ${a}`;
}

// Helper functions
function getInputValue(block: Blockly.Block, inputName: string, ctx: CodeContext): string {
  const input = block.getInput(inputName);
  if (!input || !input.connection || !input.connection.targetBlock()) {
    return '""';
  }
  const targetBlock = input.connection.targetBlock();
  if (!targetBlock) {
    return '""';
  }
  return blockToCode(targetBlock, ctx);
}

function getStatements(block: Blockly.Block, statementName: string, ctx: CodeContext): string {
  const input = block.getInput(statementName);
  if (!input || !input.connection || !input.connection.targetBlock()) {
    addLine(ctx, "pass");
    return "";
  }

  let currentBlock = input.connection.targetBlock();
  while (currentBlock) {
    blockToCode(currentBlock, ctx);
    const nextBlock = currentBlock.getNextBlock();
    currentBlock = nextBlock || null;
  }
  return "";
}

/**
 * Generate complete Python code from Blockly workspace
 */
export function generatePythonCode(workspace: Blockly.WorkspaceSvg): string {
  const ctx: CodeContext = {
    indent: 0,
    code: [],
    variables: new Set(),
    events: [],
  };

  // Add imports
  ctx.code.push("import discord");
  ctx.code.push("from discord.ext import commands");
  ctx.code.push("");

  // Add bot initialization
  ctx.code.push("bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())");
  ctx.code.push("");

  // Get all top-level blocks
  const blocks = workspace.getTopBlocks(false);

  // Generate code for all blocks
  for (const block of blocks) {
    blockToCode(block, ctx);
  }

  // Add events
  if (ctx.events.length > 0) {
    ctx.code.push("");
    ctx.code.push(...ctx.events);
  }

  // Add bot.run at the end
  ctx.code.push("");
  ctx.code.push("# Replace 'YOUR_DISCORD_BOT_TOKEN' with your actual bot token");
  ctx.code.push("bot.run('YOUR_DISCORD_BOT_TOKEN')");

  return ctx.code.join("\n");
}

// ==================== ADVANCED BLOCK GENERATORS ====================

function generateConditionalMessage(block: Blockly.Block, ctx: CodeContext): string {
  const conditionBlock = block.getInputTargetBlock("CONDITION");
  const condition = conditionBlock ? blockToCode(conditionBlock, ctx) : "True";
  const channelBlock = block.getInputTargetBlock("CHANNEL");
  const channel = channelBlock ? blockToCode(channelBlock, ctx) : "message.channel";
  const messageBlock = block.getInputTargetBlock("MESSAGE");
  const message = messageBlock ? blockToCode(messageBlock, ctx) : "''";
  
  addLine(ctx, `if ${condition}:`);
  increaseIndent(ctx);
  addLine(ctx, `await ${channel}.send(${message})`);
  decreaseIndent(ctx);
  
  return "";
}

function generateGetAllServers(block: Blockly.Block, ctx: CodeContext): string {
  return "bot.guilds";
}

function generateGetServerByName(block: Blockly.Block, ctx: CodeContext): string {
  const nameBlock = block.getInputTargetBlock("NAME");
  const name = nameBlock ? blockToCode(nameBlock, ctx) : "''";
  return `discord.utils.get(bot.guilds, name=${name})`;
}

function generateBroadcastToServers(block: Blockly.Block, ctx: CodeContext): string {
  const messageBlock = block.getInputTargetBlock("MESSAGE");
  const message = messageBlock ? blockToCode(messageBlock, ctx) : "''";
  
  addLine(ctx, `for guild in bot.guilds:`);
  increaseIndent(ctx);
  addLine(ctx, `if guild.system_channel:`);
  increaseIndent(ctx);
  addLine(ctx, `await guild.system_channel.send(${message})`);
  decreaseIndent(ctx);
  decreaseIndent(ctx);
  
  return "";
}

function generateScheduleTask(block: Blockly.Block, ctx: CodeContext): string {
  const intervalBlock = block.getInputTargetBlock("INTERVAL");
  const interval = intervalBlock ? blockToCode(intervalBlock, ctx) : "60";
  const statements = block.getInputTargetBlock("DO");
  
  addLine(ctx, `@tasks.loop(seconds=${interval})`);
  addLine(ctx, `async def scheduled_task():`);
  increaseIndent(ctx);
  
  if (statements) {
    blockToCode(statements, ctx);
  } else {
    addLine(ctx, `pass`);
  }
  
  decreaseIndent(ctx);
  addLine(ctx, `scheduled_task.start()`);
  
  // Add import for tasks
  if (!ctx.code.some(line => line.includes("from discord.ext import tasks"))) {
    ctx.code.splice(1, 0, "from discord.ext import tasks");
  }
  
  return "";
}

function generateScheduleDaily(block: Blockly.Block, ctx: CodeContext): string {
  const timeBlock = block.getInputTargetBlock("TIME");
  const time = timeBlock ? blockToCode(timeBlock, ctx) : "'00:00'";
  const statements = block.getInputTargetBlock("DO");
  
  addLine(ctx, `@tasks.loop(hours=24)`);
  addLine(ctx, `async def daily_task():`);
  increaseIndent(ctx);
  addLine(ctx, `now = datetime.now().strftime('%H:%M')`);
  addLine(ctx, `if now == ${time}:`);
  increaseIndent(ctx);
  
  if (statements) {
    blockToCode(statements, ctx);
  } else {
    addLine(ctx, `pass`);
  }
  
  decreaseIndent(ctx);
  decreaseIndent(ctx);
  addLine(ctx, `daily_task.start()`);
  
  // Add imports
  if (!ctx.code.some(line => line.includes("from discord.ext import tasks"))) {
    ctx.code.splice(1, 0, "from discord.ext import tasks");
  }
  if (!ctx.code.some(line => line.includes("from datetime import datetime"))) {
    ctx.code.splice(1, 0, "from datetime import datetime");
  }
  
  return "";
}

function generateWait(block: Blockly.Block, ctx: CodeContext): string {
  const secondsBlock = block.getInputTargetBlock("SECONDS");
  const seconds = secondsBlock ? blockToCode(secondsBlock, ctx) : "1";
  addLine(ctx, `await asyncio.sleep(${seconds})`);
  
  // Add import for asyncio
  if (!ctx.code.some(line => line.includes("import asyncio"))) {
    ctx.code.splice(1, 0, "import asyncio");
  }
  
  return "";
}
