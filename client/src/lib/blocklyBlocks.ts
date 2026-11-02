import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Blockly Custom Blocks Definition
 * Defines all custom blocks for Discord bot development.
 *
 * Code generation for these blocks lives in `pythonCodeGenerator.ts`.
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
      this.appendValueInput("NEW_CONTENT")
        .setCheck(null)
        .appendField("新しい内容");
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
      this.appendStatementInput("ELSE")
        .setCheck(null)
        .appendField("そうでなければ");
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
      this.appendValueInput("CONDITION")
        .setCheck(null)
        .appendField("〜の間繰り返す");
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
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["==", "EQ"],
          ["!=", "NEQ"],
          [">", "GT"],
          ["<", "LT"],
          [">=", "GTE"],
          ["<=", "LTE"],
        ]),
        "OP"
      );
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
        .appendField("を");
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
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), "NUM");
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

  // ==================== ADVANCED BLOCKS ====================

  Blockly.Blocks["discord_conditional_message"] = {
    init: function () {
      this.appendValueInput("CONDITION").setCheck(null).appendField("もし");
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("条件が真ならメッセージを送信");
    },
  };

  Blockly.Blocks["discord_get_all_servers"] = {
    init: function () {
      this.appendDummyInput().appendField("全サーバー");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("ボットが参加している全サーバーを取得");
    },
  };

  Blockly.Blocks["discord_get_server_by_name"] = {
    init: function () {
      this.appendValueInput("NAME").setCheck(null).appendField("サーバー名");
      this.setOutput(true, null);
      this.setColour(65);
      this.setTooltip("名前でサーバーを取得");
    },
  };

  Blockly.Blocks["discord_broadcast_to_servers"] = {
    init: function () {
      this.appendValueInput("MESSAGE")
        .setCheck(null)
        .appendField("全サーバーに");
      this.appendDummyInput().appendField("メッセージを送信");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("ボットが参加している全サーバーにメッセージを送信");
    },
  };

  Blockly.Blocks["discord_schedule_task"] = {
    init: function () {
      this.appendValueInput("INTERVAL")
        .setCheck(null)
        .appendField("間隔（秒）");
      this.appendStatementInput("DO").setCheck(null).appendField("実行内容");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("指定した間隔で定期実行");
    },
  };

  Blockly.Blocks["discord_schedule_daily"] = {
    init: function () {
      this.appendValueInput("TIME")
        .setCheck(null)
        .appendField("実行時刻（HH:MM）");
      this.appendStatementInput("DO").setCheck(null).appendField("実行内容");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip("毎日指定した時刻に実行");
    },
  };

  Blockly.Blocks["discord_wait"] = {
    init: function () {
      this.appendValueInput("SECONDS").setCheck(null).appendField("待機（秒）");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("指定した秒数待機");
    },
  };
}
