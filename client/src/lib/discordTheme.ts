import * as Blockly from "blockly";

/**
 * Discord-inspired Blockly theme. Blocks already carry explicit Discord colours,
 * so this only styles the surrounding chrome (workspace, toolbox, flyout).
 */
export const discordTheme = Blockly.Theme.defineTheme("discord", {
  name: "discord",
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: "#313338",
    toolboxBackgroundColour: "#1e1f22",
    toolboxForegroundColour: "#dbdee1",
    flyoutBackgroundColour: "#2b2d31",
    flyoutForegroundColour: "#dbdee1",
    flyoutOpacity: 1,
    scrollbarColour: "#5865F2",
    scrollbarOpacity: 0.6,
    insertionMarkerColour: "#ffffff",
    insertionMarkerOpacity: 0.3,
    cursorColour: "#ffffff",
    markerColour: "#5865F2",
  },
  fontStyle: { family: "'Noto Sans JP', sans-serif", size: 11 },
});

/**
 * Toolbox layout for the editor. Categories follow the BotGhost-style grouping
 * requested for the modern builder (Events, Slash Commands, Embeds, UI, DB, ...).
 */
export const TOOLBOX_XML = `
  <xml>
    <category name="⚡ イベント" colour="#5865F2">
      <block type="discord_on_ready"></block>
      <block type="discord_on_message"></block>
      <block type="discord_on_message_edit"></block>
      <block type="discord_on_message_delete"></block>
      <block type="discord_on_member_join"></block>
      <block type="discord_on_member_remove"></block>
      <block type="discord_on_reaction_add"></block>
    </category>
    <category name="⚡ スラッシュコマンド" colour="#5865F2">
      <block type="discord_slash_command"></block>
      <block type="discord_slash_option"></block>
      <block type="discord_slash_option_value"></block>
      <block type="discord_interaction_reply"></block>
      <block type="discord_interaction_get_user"></block>
      <block type="discord_interaction_get_channel"></block>
    </category>
    <category name="📄 Embed" colour="#57F287">
      <block type="discord_embed_create"></block>
      <block type="discord_embed_add_field"></block>
      <block type="discord_embed_set"></block>
      <block type="discord_send_embed"></block>
      <block type="discord_send_embed_object"></block>
      <block type="discord_interaction_reply_embed"></block>
    </category>
    <category name="🎛️ UI コンポーネント" colour="#EB459E">
      <block type="discord_button_send"></block>
      <block type="discord_button_reply_view"></block>
      <block type="discord_open_modal"></block>
      <block type="discord_modal_text_input"></block>
      <block type="discord_modal_input_value"></block>
    </category>
    <category name="🗄️ データベース" colour="#1ABC9C">
      <block type="discord_db_set"></block>
      <block type="discord_db_get"></block>
      <block type="discord_db_increment"></block>
      <block type="discord_db_delete"></block>
      <block type="discord_db_exists"></block>
    </category>
    <category name="▶️ アクション" colour="#57F287">
      <block type="discord_send_message"></block>
      <block type="discord_edit_message"></block>
      <block type="discord_delete_message"></block>
      <block type="discord_add_reaction"></block>
      <block type="discord_add_role"></block>
      <block type="discord_remove_role"></block>
      <block type="discord_ban_member"></block>
      <block type="discord_kick_member"></block>
      <block type="discord_broadcast_to_servers"></block>
    </category>
    <category name="🔀 ロジック" colour="#FEE75C">
      <block type="discord_if"></block>
      <block type="discord_if_else"></block>
      <block type="discord_for_loop"></block>
      <block type="discord_while_loop"></block>
      <block type="discord_comparison"></block>
      <block type="discord_logic_and"></block>
      <block type="discord_logic_or"></block>
      <block type="discord_logic_not"></block>
      <block type="discord_schedule_task"></block>
      <block type="discord_schedule_daily"></block>
    </category>
    <category name="📦 変数" colour="#EB459E">
      <block type="discord_set_variable"></block>
      <block type="discord_get_variable"></block>
      <block type="discord_text"></block>
      <block type="discord_number"></block>
      <block type="discord_string_concat"></block>
    </category>
    <category name="🧩 取得・その他" colour="#1ABC9C">
      <block type="discord_get_message"></block>
      <block type="discord_get_author"></block>
      <block type="discord_get_channel"></block>
      <block type="discord_get_guild"></block>
      <block type="discord_get_message_content"></block>
      <block type="discord_get_all_servers"></block>
      <block type="discord_get_server_by_name"></block>
      <block type="discord_conditional_message"></block>
      <block type="discord_print"></block>
      <block type="discord_wait"></block>
    </category>
  </xml>
`;
