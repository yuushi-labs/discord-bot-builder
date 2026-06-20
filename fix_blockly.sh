#!/usr/bin/env bash
set -e

python3 << 'PY'
from pathlib import Path

p = Path("client/src/lib/blocklyBlocks.ts")
text = p.read_text(encoding="utf-8")

if 'Blockly.Blocks["discord_get_message"]' in text:
    print("already patched")
    raise SystemExit()

insert = '''
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

'''

marker = '  // ==================== CODE GENERATORS ===================='
text = text.replace(marker, insert + marker)

p.write_text(text, encoding="utf-8")
print("patched")
PY
