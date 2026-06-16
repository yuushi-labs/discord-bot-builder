import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Blockly Custom Blocks Definition
 * Defines all custom blocks for Discord bot development
 */

export function defineDiscordBlocks() {
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
      this.setTooltip("メンバーをバン");
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

  // ==================== CONDITION BLOCKS ====================

  Blockly.Blocks["discord_if"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("もし");
      this.appendStatementInput("DO").setCheck(null).appendField("ならば");
      this.setColour(210);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("条件分岐");
    },
  };

  Blockly.Blocks["discord_if_else"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("もし");
      this.appendStatementInput("DO").setCheck(null).appendField("ならば");
      this.appendStatementInput("ELSE").setCheck(null).appendField("そうでなければ");
      this.setColour(210);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("条件分岐（else 付き）");
    },
  };

  Blockly.Blocks["discord_for_loop"] = {
    init: function () {
      this.appendValueInput("LIST").setCheck(null).appendField("リスト");
      this.appendStatementInput("DO").setCheck(null).appendField("の各要素に対して");
      this.setColour(210);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("リストをループ");
    },
  };

  Blockly.Blocks["discord_while_loop"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("～の間");
      this.appendStatementInput("DO").setCheck(null).appendField("実行");
      this.setColour(210);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("条件が真の間ループ");
    },
  };

  Blockly.Blocks["discord_comparison"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null);
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["==", "=="],
          ["!=", "!="],
          [">", ">"],
          ["<", "<"],
          [">=", ">="],
          ["<=", "<="],
        ]),
        "OP"
      );
      this.appendValueInput("B").setCheck(null);
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("2つの値を比較");
    },
  };

  Blockly.Blocks["discord_logic_and"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("かつ");
      this.appendValueInput("B").setCheck(null);
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理積（AND）");
    },
  };

  Blockly.Blocks["discord_logic_or"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("または");
      this.appendValueInput("B").setCheck(null);
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理和（OR）");
    },
  };

  Blockly.Blocks["discord_logic_not"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("ではない");
      this.setOutput(true, null);
      this.setColour(210);
      this.setTooltip("論理否定（NOT）");
    },
  };

  // ==================== VARIABLE BLOCKS ====================

  Blockly.Blocks["discord_set_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("var"), "NAME")
        .appendField("に");
      this.appendValueInput("VALUE").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(330);
      this.setTooltip("変数に値を代入");
    },
  };

  Blockly.Blocks["discord_get_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("var"), "NAME");
      this.setOutput(true, null);
      this.setColour(330);
      this.setTooltip("変数の値を取得");
    },
  };

  // ==================== GETTER BLOCKS ====================

  Blockly.Blocks["discord_get_message"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("現在のメッセージを取得");
    },
  };

  Blockly.Blocks["discord_get_author"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージの送信者");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("メッセージの送信者を取得");
    },
  };

  Blockly.Blocks["discord_get_channel"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージのチャンネル");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("メッセージが送信されたチャンネルを取得");
    },
  };

  Blockly.Blocks["discord_get_guild"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージのサーバー");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("メッセージが送信されたサーバーを取得");
    },
  };

  Blockly.Blocks["discord_get_message_content"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージの内容");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("メッセージの内容を取得");
    },
  };

  // ==================== UTILITY BLOCKS ====================

  Blockly.Blocks["discord_print"] = {
    init: function () {
      this.appendValueInput("TEXT").setCheck(null).appendField("コンソール出力");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("コンソールにテキストを出力");
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

  // ==================== CODE GENERATORS ====================

  Blockly.JavaScript["discord_on_ready"] = function () {
    const statements = Blockly.JavaScript.statementToCode(this, "DO");
    return `@bot.event\nasync def on_ready():\n${statements}\n`;
  };

  Blockly.JavaScript["discord_on_message"] = function () {
    const statements = Blockly.JavaScript.statementToCode(this, "DO");
    return `@bot.event\nasync def on_message(message):\n    if message.author == bot.user:\n        return\n${statements}\n`;
  };

  Blockly.JavaScript["discord_send_message"] = function () {
    const channel = Blockly.JavaScript.valueToCode(this, "CHANNEL", Blockly.JavaScript.ORDER_ATOMIC);
    const message = Blockly.JavaScript.valueToCode(this, "MESSAGE", Blockly.JavaScript.ORDER_ATOMIC);
    return `await ${channel}.send(${message})\n`;
  };

  Blockly.JavaScript["discord_print"] = function () {
    const text = Blockly.JavaScript.valueToCode(this, "TEXT", Blockly.JavaScript.ORDER_ATOMIC);
    return `print(${text})\n`;
  };

  Blockly.JavaScript["discord_text"] = function () {
    const text = this.getFieldValue("TEXT");
    return [`"${text}"`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_number"] = function () {
    const num = this.getFieldValue("NUM");
    return [num, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_string_concat"] = function () {
    const a = Blockly.JavaScript.valueToCode(this, "A", Blockly.JavaScript.ORDER_ATOMIC);
    const b = Blockly.JavaScript.valueToCode(this, "B", Blockly.JavaScript.ORDER_ATOMIC);
    return [`${a} + ${b}`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_if"] = function () {
    const condition = Blockly.JavaScript.valueToCode(this, "CONDITION", Blockly.JavaScript.ORDER_ATOMIC);
    const statements = Blockly.JavaScript.statementToCode(this, "DO");
    return `if ${condition}:\n${statements}\n`;
  };

  Blockly.JavaScript["discord_comparison"] = function () {
    const a = Blockly.JavaScript.valueToCode(this, "A", Blockly.JavaScript.ORDER_ATOMIC);
    const op = this.getFieldValue("OP");
    const b = Blockly.JavaScript.valueToCode(this, "B", Blockly.JavaScript.ORDER_ATOMIC);
    return [`${a} ${op} ${b}`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_get_message_content"] = function () {
    return ["message.content", Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_get_author"] = function () {
    return ["message.author", Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_get_channel"] = function () {
    return ["message.channel", Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ==================== ADVANCED BLOCKS ====================

  // 条件付きメッセージ送信ブロック
  Blockly.Blocks["discord_conditional_message"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("条件");
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("条件が真の場合、メッセージを送信");
    },
  };

  // 複数サーバー対応ブロック
  Blockly.Blocks["discord_get_all_servers"] = {
    init: function () {
      this.appendDummyInput().appendField("全サーバー取得");
      this.setOutput(true, null);
      this.setColour(290);
      this.setTooltip("ボットが参加している全サーバーを取得");
    },
  };

  Blockly.Blocks["discord_get_server_by_name"] = {
    init: function () {
      this.appendValueInput("NAME").setCheck(null).appendField("サーバー名");
      this.setOutput(true, null);
      this.setColour(290);
      this.setTooltip("名前でサーバーを検索");
    },
  };

  Blockly.Blocks["discord_broadcast_to_servers"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("全サーバーにメッセージ送信");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("全サーバーの指定チャンネルにメッセージを送信");
    },
  };

  // スケジュール実行ブロック
  Blockly.Blocks["discord_schedule_task"] = {
    init: function () {
      this.appendValueInput("INTERVAL").setCheck(null).appendField("間隔（秒）");
      this.appendStatementInput("DO").setCheck(null).appendField("実行内容");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("指定間隔で定期的にタスクを実行");
    },
  };

  Blockly.Blocks["discord_schedule_daily"] = {
    init: function () {
      this.appendValueInput("TIME").setCheck(null).appendField("実行時刻（HH:MM）");
      this.appendStatementInput("DO").setCheck(null).appendField("実行内容");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("毎日指定時刻にタスクを実行");
    },
  };

  Blockly.Blocks["discord_wait"] = {
    init: function () {
      this.appendValueInput("SECONDS").setCheck(null).appendField("待機（秒）");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("指定秒数待機");
    },
  };

  // ==================== ADVANCED BLOCK CODE GENERATORS ====================

  Blockly.JavaScript["discord_conditional_message"] = function () {
    const condition = Blockly.JavaScript.valueToCode(this, "CONDITION", Blockly.JavaScript.ORDER_ATOMIC);
    const channel = Blockly.JavaScript.valueToCode(this, "CHANNEL", Blockly.JavaScript.ORDER_ATOMIC);
    const message = Blockly.JavaScript.valueToCode(this, "MESSAGE", Blockly.JavaScript.ORDER_ATOMIC);
    return `if ${condition}:\n    await ${channel}.send(${message})\n`;
  };

  Blockly.JavaScript["discord_get_all_servers"] = function () {
    return ["bot.guilds", Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_get_server_by_name"] = function () {
    const name = Blockly.JavaScript.valueToCode(this, "NAME", Blockly.JavaScript.ORDER_ATOMIC);
    return [`discord.utils.get(bot.guilds, name=${name})`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["discord_broadcast_to_servers"] = function () {
    const message = Blockly.JavaScript.valueToCode(this, "MESSAGE", Blockly.JavaScript.ORDER_ATOMIC);
    return `for guild in bot.guilds:\n    if guild.system_channel:\n        await guild.system_channel.send(${message})\n`;
  };

  Blockly.JavaScript["discord_schedule_task"] = function () {
    const interval = Blockly.JavaScript.valueToCode(this, "INTERVAL", Blockly.JavaScript.ORDER_ATOMIC);
    const statements = Blockly.JavaScript.statementToCode(this, "DO");
    return `@tasks.loop(seconds=${interval})\nasync def scheduled_task():\n${statements}\nscheduled_task.start()\n`;
  };

  Blockly.JavaScript["discord_schedule_daily"] = function () {
    const time = Blockly.JavaScript.valueToCode(this, "TIME", Blockly.JavaScript.ORDER_ATOMIC);
    const statements = Blockly.JavaScript.statementToCode(this, "DO");
    return `@tasks.loop(hours=24)\nasync def daily_task():\n    now = datetime.now().strftime('%H:%M')\n    if now == ${time}:\n${statements}\ndaily_task.start()\n`;
  };

  Blockly.JavaScript["discord_wait"] = function () {
    const seconds = Blockly.JavaScript.valueToCode(this, "SECONDS", Blockly.JavaScript.ORDER_ATOMIC);
    return `await asyncio.sleep(${seconds})\n`;
  };
}
