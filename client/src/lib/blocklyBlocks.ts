import * as Blockly from "blockly";

/**
 * Discord Bot Builder - Blockly Custom Blocks Definition
 * Defines all custom blocks for Discord bot development.
 *
 * Code generation for these blocks lives in `pythonCodeGenerator.ts`.
 */

export function defineDiscordBlocks() {
  /**
   * Discord-brand palette. Blockly accepts a hex string for `setColour`, which
   * lets the toolbox, blocks and category headers share one modern look.
   */
  const C = {
    blurple: "#5865F2",
    green: "#57F287",
    yellow: "#FEE75C",
    fuchsia: "#EB459E",
    red: "#ED4245",
    gray: "#4F545C",
    teal: "#1ABC9C",
  };

  // ==================== EVENT BLOCKS ====================

  Blockly.Blocks["discord_on_ready"] = {
    init: function () {
      this.appendDummyInput().appendField("ボット起動時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("ボットが起動したときに実行");
    },
  };

  Blockly.Blocks["discord_on_message"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ受信時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("メッセージを受信したときに実行");
    },
  };

  Blockly.Blocks["discord_on_message_edit"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ編集時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("メッセージが編集されたときに実行");
    },
  };

  Blockly.Blocks["discord_on_message_delete"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ削除時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("メッセージが削除されたときに実行");
    },
  };

  Blockly.Blocks["discord_on_member_join"] = {
    init: function () {
      this.appendDummyInput().appendField("メンバー参加時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("メンバーがサーバーに参加したときに実行");
    },
  };

  Blockly.Blocks["discord_on_member_remove"] = {
    init: function () {
      this.appendDummyInput().appendField("メンバー退出時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
      this.setTooltip("メンバーがサーバーから退出したときに実行");
    },
  };

  Blockly.Blocks["discord_on_reaction_add"] = {
    init: function () {
      this.appendDummyInput().appendField("リアクション追加時");
      this.appendStatementInput("DO").setCheck(null);
      this.setColour(C.blurple);
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
      this.setColour(C.green);
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
      this.setColour(C.green);
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
      this.setColour(C.green);
      this.setTooltip("メッセージを編集");
    },
  };

  Blockly.Blocks["discord_delete_message"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("メッセージを削除");
    },
  };

  Blockly.Blocks["discord_add_reaction"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.appendValueInput("EMOJI").setCheck(null).appendField("絵文字");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("メッセージにリアクションを追加");
    },
  };

  Blockly.Blocks["discord_add_role"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("ROLE").setCheck(null).appendField("ロール");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("メンバーにロールを付与");
    },
  };

  Blockly.Blocks["discord_remove_role"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("ROLE").setCheck(null).appendField("ロール");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("メンバーからロールを削除");
    },
  };

  Blockly.Blocks["discord_ban_member"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("REASON").setCheck(null).appendField("理由");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("メンバーをBAN");
    },
  };

  Blockly.Blocks["discord_kick_member"] = {
    init: function () {
      this.appendValueInput("MEMBER").setCheck(null).appendField("メンバー");
      this.appendValueInput("REASON").setCheck(null).appendField("理由");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
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
      this.setColour(C.yellow);
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
      this.setColour(C.yellow);
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
      this.setColour(C.yellow);
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
      this.setColour(C.yellow);
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
      this.setColour(C.yellow);
      this.setTooltip("比較演算");
    },
  };

  Blockly.Blocks["discord_logic_and"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("かつ");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(C.yellow);
      this.setTooltip("論理積");
    },
  };

  Blockly.Blocks["discord_logic_or"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("または");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(C.yellow);
      this.setTooltip("論理和");
    },
  };

  Blockly.Blocks["discord_logic_not"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("でない");
      this.setOutput(true, null);
      this.setColour(C.yellow);
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
      this.setColour(C.fuchsia);
      this.setTooltip("変数に値を設定");
    },
  };

  Blockly.Blocks["discord_get_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR");
      this.setOutput(true, null);
      this.setColour(C.fuchsia);
      this.setTooltip("変数の値を取得");
    },
  };

  // ==================== UTILITY BLOCKS ====================

  Blockly.Blocks["discord_print"] = {
    init: function () {
      this.appendValueInput("TEXT").setCheck(null).appendField("出力");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.gray);
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
      this.setColour(C.green);
      this.setTooltip("テキスト");
    },
  };

  Blockly.Blocks["discord_number"] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), "NUM");
      this.setOutput(true, null);
      this.setColour(C.green);
      this.setTooltip("数値");
    },
  };

  Blockly.Blocks["discord_string_concat"] = {
    init: function () {
      this.appendValueInput("A").setCheck(null).appendField("テキスト");
      this.appendValueInput("B").setCheck(null).appendField("と");
      this.setOutput(true, null);
      this.setColour(C.green);
      this.setTooltip("2つのテキストを連結");
    },
  };

  Blockly.Blocks["discord_get_message"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ");
      this.setOutput(true, null);
      this.setColour(C.teal);
    },
  };

  Blockly.Blocks["discord_get_author"] = {
    init: function () {
      this.appendDummyInput().appendField("送信者");
      this.setOutput(true, null);
      this.setColour(C.teal);
    },
  };

  Blockly.Blocks["discord_get_channel"] = {
    init: function () {
      this.appendDummyInput().appendField("チャンネル");
      this.setOutput(true, null);
      this.setColour(C.teal);
    },
  };

  Blockly.Blocks["discord_get_guild"] = {
    init: function () {
      this.appendDummyInput().appendField("サーバー");
      this.setOutput(true, null);
      this.setColour(C.teal);
    },
  };

  Blockly.Blocks["discord_get_message_content"] = {
    init: function () {
      this.appendDummyInput().appendField("メッセージ内容");
      this.setOutput(true, null);
      this.setColour(C.teal);
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
      this.setColour(C.green);
      this.setTooltip("条件が真ならメッセージを送信");
    },
  };

  Blockly.Blocks["discord_get_all_servers"] = {
    init: function () {
      this.appendDummyInput().appendField("全サーバー");
      this.setOutput(true, null);
      this.setColour(C.teal);
      this.setTooltip("ボットが参加している全サーバーを取得");
    },
  };

  Blockly.Blocks["discord_get_server_by_name"] = {
    init: function () {
      this.appendValueInput("NAME").setCheck(null).appendField("サーバー名");
      this.setOutput(true, null);
      this.setColour(C.teal);
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
      this.setColour(C.green);
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
      this.setColour(C.yellow);
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
      this.setColour(C.yellow);
      this.setTooltip("毎日指定した時刻に実行");
    },
  };

  Blockly.Blocks["discord_wait"] = {
    init: function () {
      this.appendValueInput("SECONDS").setCheck(null).appendField("待機（秒）");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.gray);
      this.setTooltip("指定した秒数待機");
    },
  };

  // ==================== SLASH COMMAND BLOCKS ====================

  Blockly.Blocks["discord_slash_command"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("スラッシュコマンド /")
        .appendField(new Blockly.FieldTextInput("command"), "NAME")
        .appendField("説明")
        .appendField(new Blockly.FieldTextInput("コマンドの説明"), "DESC");
      this.appendStatementInput("OPTIONS")
        .setCheck("discord_slash_option")
        .appendField("オプション");
      this.appendStatementInput("DO").setCheck(null).appendField("実行内容");
      this.setColour(C.blurple);
      this.setTooltip(
        "スラッシュコマンドを定義します（@bot.tree.command）。名前は小文字英数字とハイフン。"
      );
    },
  };

  Blockly.Blocks["discord_slash_option"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("オプション")
        .appendField(new Blockly.FieldTextInput("option"), "NAME")
        .appendField("説明")
        .appendField(new Blockly.FieldTextInput("オプションの説明"), "DESC")
        .appendField("型")
        .appendField(
          new Blockly.FieldDropdown([
            ["文字列", "str"],
            ["整数", "int"],
            ["数値", "float"],
            ["真偽値", "bool"],
            ["ユーザー", "user"],
            ["メンバー", "member"],
            ["チャンネル", "channel"],
            ["ロール", "role"],
          ]),
          "TYPE"
        );
      this.appendDummyInput()
        .appendField("必須")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "REQUIRED");
      this.setPreviousStatement(true, "discord_slash_option");
      this.setNextStatement(true, "discord_slash_option");
      this.setColour(C.blurple);
      this.setTooltip("スラッシュコマンドの引数を定義します。");
    },
  };

  Blockly.Blocks["discord_slash_option_value"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("オプションの値")
        .appendField(new Blockly.FieldTextInput("option"), "NAME");
      this.setOutput(true, null);
      this.setColour(C.blurple);
      this.setTooltip("スラッシュコマンドで受け取ったオプションの値を取得します。");
    },
  };

  Blockly.Blocks["discord_interaction_reply"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("応答");
      this.appendDummyInput()
        .appendField("自分だけに表示")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "EPHEMERAL");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.blurple);
      this.setTooltip(
        "スラッシュコマンド／ボタンに応答します（interaction.response.send_message）。"
      );
    },
  };

  Blockly.Blocks["discord_interaction_get_user"] = {
    init: function () {
      this.appendDummyInput().appendField("操作したユーザー");
      this.setOutput(true, null);
      this.setColour(C.blurple);
      this.setTooltip("インタラクションを実行したユーザーを取得します。");
    },
  };

  Blockly.Blocks["discord_interaction_get_channel"] = {
    init: function () {
      this.appendDummyInput().appendField("インタラクションのチャンネル");
      this.setOutput(true, null);
      this.setColour(C.blurple);
      this.setTooltip("インタラクションが発生したチャンネルを取得します。");
    },
  };

  // ==================== EMBED BLOCKS ====================

  Blockly.Blocks["discord_embed_create"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Embed 変数")
        .appendField(new Blockly.FieldTextInput("embed"), "VAR")
        .appendField("を作成");
      this.appendValueInput("TITLE").setCheck(null).appendField("タイトル");
      this.appendValueInput("DESCRIPTION").setCheck(null).appendField("説明");
      this.appendValueInput("COLOR").setCheck(null).appendField("色");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip(
        "discord.Embed を作成し、名前付きの Embed 変数に保存します。"
      );
    },
  };

  Blockly.Blocks["discord_embed_add_field"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Embed 変数")
        .appendField(new Blockly.FieldTextInput("embed"), "VAR")
        .appendField("にフィールド");
      this.appendValueInput("NAME").setCheck(null).appendField("名前");
      this.appendValueInput("VALUE").setCheck(null).appendField("値");
      this.appendDummyInput()
        .appendField("インライン")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "INLINE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("Embed にフィールドを追加します（add_field）。");
    },
  };

  Blockly.Blocks["discord_embed_set"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Embed 変数")
        .appendField(new Blockly.FieldTextInput("embed"), "VAR")
        .appendField("の")
        .appendField(
          new Blockly.FieldDropdown([
            ["サムネイル", "thumbnail"],
            ["画像", "image"],
            ["フッター", "footer"],
            ["投稿者", "author"],
          ]),
          "PROPERTY"
        );
      this.appendValueInput("VALUE").setCheck(null).appendField("を設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("Embed のサムネイル／画像／フッター／投稿者を設定します。");
    },
  };

  Blockly.Blocks["discord_send_embed_object"] = {
    init: function () {
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendDummyInput()
        .appendField("に Embed 変数")
        .appendField(new Blockly.FieldTextInput("embed"), "VAR")
        .appendField("を送信");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("作成した Embed をチャンネルに送信します。");
    },
  };

  Blockly.Blocks["discord_interaction_reply_embed"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Embed 変数")
        .appendField(new Blockly.FieldTextInput("embed"), "VAR")
        .appendField("を応答");
      this.appendDummyInput()
        .appendField("自分だけに表示")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "EPHEMERAL");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.green);
      this.setTooltip("Embed をインタラクションに応答として送信します。");
    },
  };

  // ==================== UI COMPONENT BLOCKS ====================

  Blockly.Blocks["discord_button_send"] = {
    init: function () {
      this.appendValueInput("CHANNEL").setCheck(null).appendField("チャンネル");
      this.appendValueInput("MESSAGE").setCheck(null).appendField("メッセージ");
      this.appendValueInput("LABEL").setCheck(null).appendField("ボタン");
      this.appendDummyInput()
        .appendField("スタイル")
        .appendField(
          new Blockly.FieldDropdown([
            ["Primary", "primary"],
            ["Secondary", "secondary"],
            ["Success", "success"],
            ["Danger", "danger"],
            ["Link", "link"],
          ]),
          "STYLE"
        );
      this.appendValueInput("EMOJI").setCheck(null).appendField("絵文字");
      this.appendValueInput("URL").setCheck(null).appendField("URL(Link)");
      this.appendStatementInput("ON_CLICK")
        .setCheck(null)
        .appendField("クリックされたら");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.fuchsia);
      this.setTooltip(
        "ボタン付きメッセージを送信します（discord.ui.View + Button）。クリック時の処理を定義できます。"
      );
    },
  };

  Blockly.Blocks["discord_button_reply_view"] = {
    init: function () {
      this.appendValueInput("MESSAGE").setCheck(null).appendField("ボタン付きで応答");
      this.appendDummyInput()
        .appendField("自分だけに表示")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "EPHEMERAL");
      this.appendValueInput("LABEL").setCheck(null).appendField("ボタン");
      this.appendDummyInput()
        .appendField("スタイル")
        .appendField(
          new Blockly.FieldDropdown([
            ["Primary", "primary"],
            ["Secondary", "secondary"],
            ["Success", "success"],
            ["Danger", "danger"],
            ["Link", "link"],
          ]),
          "STYLE"
        );
      this.appendValueInput("EMOJI").setCheck(null).appendField("絵文字");
      this.appendValueInput("URL").setCheck(null).appendField("URL(Link)");
      this.appendStatementInput("ON_CLICK")
        .setCheck(null)
        .appendField("クリックされたら");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.fuchsia);
      this.setTooltip(
        "ボタン付きでインタラクションに応答します（編集可能なビュー）。"
      );
    },
  };

  Blockly.Blocks["discord_open_modal"] = {
    init: function () {
      this.appendValueInput("TITLE").setCheck(null).appendField("モーダル");
      this.appendStatementInput("INPUTS")
        .setCheck("discord_modal_input")
        .appendField("入力欄");
      this.appendStatementInput("ON_SUBMIT")
        .setCheck(null)
        .appendField("送信されたら");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.fuchsia);
      this.setTooltip(
        "ポップアップ入力フォーム（discord.ui.Modal）を表示します。送信時の処理を定義できます。"
      );
    },
  };

  Blockly.Blocks["discord_modal_text_input"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("入力欄")
        .appendField(new Blockly.FieldTextInput("answer"), "NAME")
        .appendField("ラベル")
        .appendField(new Blockly.FieldTextInput("回答"), "LABEL")
        .appendField("種類")
        .appendField(
          new Blockly.FieldDropdown([
            ["短文", "short"],
            ["複数行", "paragraph"],
          ]),
          "STYLE"
        );
      this.appendValueInput("PLACEHOLDER")
        .setCheck(null)
        .appendField("プレースホルダー");
      this.appendDummyInput()
        .appendField("必須")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "REQUIRED");
      this.setPreviousStatement(true, "discord_modal_input");
      this.setNextStatement(true, "discord_modal_input");
      this.setColour(C.fuchsia);
      this.setTooltip("モーダルのテキスト入力欄を定義します。");
    },
  };

  Blockly.Blocks["discord_modal_input_value"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("モーダル入力値")
        .appendField(new Blockly.FieldTextInput("answer"), "NAME");
      this.setOutput(true, null);
      this.setColour(C.fuchsia);
      this.setTooltip("モーダルの送信値（self.<入力欄>.value）を取得します。");
    },
  };

  // ==================== DATABASE BLOCKS ====================

  Blockly.Blocks["discord_db_set"] = {
    init: function () {
      this.appendValueInput("KEY").setCheck(null).appendField("[DB] キー");
      this.appendValueInput("VALUE").setCheck(null).appendField("に値");
      this.appendDummyInput().appendField("を保存");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.teal);
      this.setTooltip(
        "SQLite（bot_data.db）にキーと値を保存します。値は文字列化して保存されます。"
      );
    },
  };

  Blockly.Blocks["discord_db_get"] = {
    init: function () {
      this.appendValueInput("KEY").setCheck(null).appendField("[DB] キー");
      this.appendValueInput("DEFAULT")
        .setCheck(null)
        .appendField("の値を取得（既定値");
      this.appendDummyInput().appendField("）");
      this.setOutput(true, null);
      this.setColour(C.teal);
      this.setTooltip(
        "SQLite からキーの値を取得します。存在しない場合は既定値を返します。"
      );
    },
  };

  Blockly.Blocks["discord_db_increment"] = {
    init: function () {
      this.appendValueInput("KEY").setCheck(null).appendField("[DB] キー");
      this.appendValueInput("AMOUNT").setCheck(null).appendField("の数値を");
      this.appendDummyInput().appendField("増減");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.teal);
      this.setTooltip("キーの数値を加算（負の値で減算）します。");
    },
  };

  Blockly.Blocks["discord_db_delete"] = {
    init: function () {
      this.appendValueInput("KEY").setCheck(null).appendField("[DB] キー");
      this.appendDummyInput().appendField("を削除");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C.teal);
      this.setTooltip("SQLite からキーを削除します。");
    },
  };

  Blockly.Blocks["discord_db_exists"] = {
    init: function () {
      this.appendValueInput("KEY").setCheck(null).appendField("[DB] キー");
      this.appendDummyInput().appendField("が存在する");
      this.setOutput(true, null);
      this.setColour(C.teal);
      this.setTooltip("キーが存在するか確認します。");
    },
  };
}
