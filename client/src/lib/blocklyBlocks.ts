import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

/**
 * Discord Bot Builder - Blockly Custom Blocks Definition
 * Defines all custom blocks for Discord bot development
 */

export function defineDiscordBlocks() {
  const JS = javascriptGenerator;

  // ==================== EVENT BLOCKS ====================
  
  Blockly.Blocks["discord_on_ready"] = {
    init: function () {
      this.appendDummyInput().appendField("ボット起動時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("ボットが起動したときに実行");
    },
  };

  Blockly.Blocks["discord_on_message"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ受信時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メッセージを受信したときに実行");
    },
  };

  Blockly.Blocks["discord_on_message_edit"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ編集時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メッセージが編集されたときに実行");
    },
  };

  Blockly.Blocks["discord_on_message_delete"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ削除時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メッセージが削除されたときに実行");
    },
  };

  Blockly.Blocks["discord_on_member_join"] = {
    init: function () {
      this.appendDummyInput().appendField("メンバー参加時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メンバーがサーバーに参加したときに実行");
    },
  };

  Blockly.Blocks["discord_on_member_remove"] = {
    init: function () {
      this.appendDummyInput().appendField("メンバー退出時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メンバーがサーバーから退出したときに実行");
    },
  };

  Blockly.Blocks["discord_on_reaction_add"] = {
    init: function () {
      this.appendDummyInput().appendField("リアクション追加時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(230);
      this.setTooltip("メッセージにリアクションが追加されたときに実行");
    },
  };

  // ==================== ACTION BLOCKS ====================

  Blockly.Blocks["discord_send_message"] = {
    init: function () {
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("チャンネルにメッセージを送信");
    },
  };

  Blockly.Blocks["discord_send_embed"] = {
    init: function () {
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendValueInput("TITLE").setCheck(null).appendField("タイトル");
      this.appendValueInput("DESCRIPTION").setCheck(null).appendField("説明");
      this.appendValueInput("COLOR").setCheck(null).appendField("色");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("チャンネルに埋め込みメッセージを送信");
    },
  };

  Blockly.Blocks["discord_edit_message"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.appendValueInput("NEW_CONTENT").setCheck(null).appendField("新しい内容");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メッセージを編集");
    },
  };

  Blockly.Blocks["discord_delete_message"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メッセージを削除");
    },
  };

  Blockly.Blocks["discord_add_reaction"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.appendValueInput("EMOJI").setCheck(null).appendField("絵文字");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メッセージにリアクションを追加");
    },
  };

  Blockly.Blocks["discord_add_role"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("ROLE").setCheck(null).appendField("ロール");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メンバーにロールを付与");
    },
  };

  Blockly.Blocks["discord_remove_role"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("ROLE").setCheck(null).appendField("ロール");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メンバーからロールを削除");
    },
  };

  Blockly.Blocks["discord_ban_member"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("REASON").setCheck(null).appendField("理由");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メンバーをBAN");
    },
  };

  Blockly.Blocks["discord_kick_member"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("REASON").setCheck(null).appendField("理由");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("メンバーをキック");
    },
  };

  // ==================== CONTROL FLOW BLOCKS ====================

  Blockly.Blocks["discord_if"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("もし");
      this.appendStatementInput("DO").setCheck(null).appendField("なら");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("条件が真なら実行");
    },
  };

  Blockly.Blocks["discord_if_else"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("もし");
      this.appendStatementInput("DO").setCheck(null).appendField("なら");
      this.appendStatementInput("ELSE").setCheck(null).appendField("そうでなければ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("条件分岐");
    },
  };

  Blockly.Blocks["discord_for_loop"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("繰り返し")
        .appendField(new Blockly.FieldNumber(10, 1, 100, 1), "COUNT")
        .appendField("回");
      this.appendStatementInput("DO").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("指定回数繰り返す");
    },
  };

  Blockly.Blocks["discord_while_loop"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("〜の間繰り返す");
      this.appendStatementInput("DO").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("条件が真の間繰り返す");
    },
  };

  Blockly.Blocks["discord_comparison"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("左辺");
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([
        ["==", "EQ"],
        ["!=", "NEQ"],
        [">", "GT"],
        ["<", "LT"],
        [">=", "GTE"],
        ["<=", "LTE"],
      ]), "OP");
      this.appendValueInput("B").setCheck(null).appendField("右辺");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("比較演算");
    },
  };

  Blockly.Blocks["discord_logic_and"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("かつ");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理積");
    },
  };

  Blockly.Blocks["discord_logic_or"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("または");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理和");
    },
  };

  Blockly.Blocks["discord_logic_not"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("でない");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理否定");
    },
  };

  // ==================== VARIABLE BLOCKS ====================

  Blockly.Blocks["discord_set_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("を")
      ;
      this.appendValueInput("VALUE").setCheck(null);
      this.appendDummyInput().appendField("に設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(330);
      this.setTooltip("変数に値を設定");
    },
  };

  Blockly.Blocks["discord_get_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR");
      this.setOutput(true, null);
      this.setColour(330);
      this.setTooltip("変数の値を取得");
    },
  };

  // ==================== UTILITY BLOCKS ====================

  Blockly.Blocks["discord_print"] = {
    init: function () {
      this.appendValueInput("TEXT").setCheck(null).appendField("出力");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("デバッグ出力");
    },
  };

  Blockly.Blocks["discord_text"] = {
    init: function () {
      this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput("テキスト"), "TEXT")
        .appendField('"');
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("テキスト");
    },
  };

  Blockly.Blocks["discord_number"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "NUM");
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("数値");
    },
  };

  Blockly.Blocks["discord_string_concat"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("テキスト");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("2つのテキストを連結");
    },
  };


  Blockly.Blocks["discord_get_message"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ");
      this.setOutput(true, null);
      this.setColour(65);
    },
  };

  Blockly.Blocks["discord_get_author"] = {
    init: function () {
      this.appendDummyInput().appendField("送信者");
      this.setOutput(true, null);
      this.setColour(65);
    },
  };

  Blockly.Blocks["discord_get_channel"] = {
    init: function () {
      this.appendDummyInput().appendField("チャンネル");
      this.setOutput(true, null);
      this.setColour(65);
    },
  };

  Blockly.Blocks["discord_get_guild"] = {
    init: function () {
      this.appendDummyInput().appendField("サーバー");
      this.setOutput(true, null);
      this.setColour(65);
    },
  };

  Blockly.Blocks["discord_get_message_content"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ内容");
      this.setOutput(true, null);
      this.setColour(65);
    },
  };

  // ==================== CODE GENERATORS ====================

  JS.forBlock["discord_on_ready"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_ready():\n${statements}\n`;
  };

  JS.forBlock["discord_on_message"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_message(message):\n    if message.author == bot.user:\n        return\n${statements}\n`;
  };

  JS.forBlock["discord_send_message"] = function (block, generator) {
    const channel = generator.valueToCode(block, "CHANNEL", Order.ATOMIC);
    const message = generator.valueToCode(block, "MESSAGE", Order.ATOMIC);
    return `await ${channel}.send(${message})\n`;
  };

  JS.forBlock["discord_print"] = function (block, generator) {
    const text = generator.valueToCode(block, "TEXT", Order.ATOMIC);
    return `print(${text})\n`;
  };

  JS.forBlock["discord_text"] = function (block) {
    const text = block.getFieldValue("TEXT");
    return [`"${text}"`, Order.ATOMIC];
  };

  JS.forBlock["discord_number"] = function (block) {
    const num = block.getFieldValue("NUM");
    return [num.toString(), Order.ATOMIC];
  };

  JS.forBlock["discord_string_concat"] = function (block, generator) {
    const a = generator.valueToCode(block, "A", Order.ATOMIC) || "''";
    const b = generator.valueToCode(block, "B", Order.ATOMIC) || "''";
    return [`${a} + ${b}`, Order.ADDITION];
  };

  JS.forBlock["discord_comparison"] = function (block, generator) {
    const a = generator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = generator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    const op = block.getFieldValue("OP");
    const operators: Record<string, string> = {
      EQ: "==",
      NEQ: "!=",
      GT: ">",
      LT: "<",
      GTE: ">=",
      LTE: "<=",
    };
    return [`${a} ${operators[op]} ${b}`, Order.RELATIONAL];
  };

  JS.forBlock["discord_logic_and"] = function (block, generator) {
    const a = generator.valueToCode(block, "A", Order.LOGICAL_AND) || "False";
    const b = generator.valueToCode(block, "B", Order.LOGICAL_AND) || "False";
    return [`${a} and ${b}`, Order.LOGICAL_AND];
  };

  JS.forBlock["discord_logic_or"] = function (block, generator) {
    const a = generator.valueToCode(block, "A", Order.LOGICAL_OR) || "False";
    const b = generator.valueToCode(block, "B", Order.LOGICAL_OR) || "False";
    return [`${a} or ${b}`, Order.LOGICAL_OR];
  };

  JS.forBlock["discord_logic_not"] = function (block, generator) {
    const a = generator.valueToCode(block, "A", Order.LOGICAL_NOT) || "False";
    return [`not ${a}`, Order.LOGICAL_NOT];
  };

  JS.forBlock["discord_set_variable"] = function (block, generator) {
    const variable = block.getFieldValue("VAR");
    const value = generator.valueToCode(block, "VALUE", Order.ASSIGNMENT) || "None";
    return `${variable} = ${value}\n`;
  };

  JS.forBlock["discord_get_variable"] = function (block) {
    const variable = block.getFieldValue("VAR");
    return [variable, Order.ATOMIC];
  };

  JS.forBlock["discord_if"] = function (block, generator) {
    const condition = generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
    const statements = generator.statementToCode(block, "DO");
    return `if ${condition}:\n${statements || "    pass\n"}`;
  };

  JS.forBlock["discord_if_else"] = function (block, generator) {
    const condition = generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
    const doStatements = generator.statementToCode(block, "DO");
    const elseStatements = generator.statementToCode(block, "ELSE");
    return `if ${condition}:\n${doStatements || "    pass\n"}else:\n${elseStatements || "    pass\n"}`;
  };

  JS.forBlock["discord_for_loop"] = function (block, generator) {
    const count = block.getFieldValue("COUNT") || 10;
    const statements = generator.statementToCode(block, "DO");
    return `for i in range(${count}):\n${statements || "    pass\n"}`;
  };

  JS.forBlock["discord_while_loop"] = function (block, generator) {
    const condition = generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
    const statements = generator.statementToCode(block, "DO");
    return `while ${condition}:\n${statements || "    pass\n"}`;
  };

  JS.forBlock["discord_on_message_edit"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_message_edit(before, after):\n${statements}\n`;
  };

  JS.forBlock["discord_on_message_delete"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_message_delete(message):\n${statements}\n`;
  };

  JS.forBlock["discord_on_member_join"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_member_join(member):\n${statements}\n`;
  };

  JS.forBlock["discord_on_member_remove"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_member_remove(member):\n${statements}\n`;
  };

  JS.forBlock["discord_on_reaction_add"] = function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `@bot.event\nasync def on_reaction_add(reaction, user):\n${statements}\n`;
  };
}
