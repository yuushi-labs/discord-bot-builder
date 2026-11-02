import { beforeAll, describe, expect, it } from "vitest";
import * as Blockly from "blockly";
import { defineDiscordBlocks } from "./blocklyBlocks";
import { restoreWorkspace } from "./workspaceRestore";

beforeAll(() => defineDiscordBlocks());

function saved(type: string) {
  const source = new Blockly.Workspace();
  source.newBlock(type);
  const data = JSON.stringify(Blockly.serialization.workspaces.save(source));
  source.dispose();
  return data;
}

describe("workspace restoration", () => {
  it("restores a valid draft in preference to the server copy", () => {
    const workspace = new Blockly.Workspace();
    const result = restoreWorkspace(
      workspace,
      saved("discord_on_ready"),
      saved("discord_on_message")
    );
    expect(result.restoredDraft).toBe(true);
    expect(workspace.getAllBlocks(false).map(b => b.type)).toEqual([
      "discord_on_ready",
    ]);
    workspace.dispose();
  });

  it.each(["{broken", ""])(
    "falls back to the saved copy after invalid draft JSON",
    draft => {
      const workspace = new Blockly.Workspace();
      const result = restoreWorkspace(
        workspace,
        draft,
        saved("discord_on_message")
      );
      expect(result.restoredDraft).toBe(false);
      expect(result.draftError).toBeInstanceOf(Error);
      expect(result.serverError).toBeUndefined();
      expect(workspace.getAllBlocks(false).map(b => b.type)).toEqual([
        "discord_on_message",
      ]);
      workspace.dispose();
    }
  );

  it("clears a partially loaded draft before loading the server copy", () => {
    const workspace = new Blockly.Workspace();
    const draft = JSON.stringify({
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: "discord_on_ready", id: "partial" },
          { type: "not_a_block", id: "invalid" },
        ],
      },
    });
    const result = restoreWorkspace(
      workspace,
      draft,
      saved("discord_on_message")
    );
    expect(result.draftError).toBeDefined();
    expect(result.serverError).toBeUndefined();
    expect(workspace.getAllBlocks(false).map(b => b.type)).toEqual([
      "discord_on_message",
    ]);
    workspace.dispose();
  });

  it("reports a server copy failure even after a draft failure", () => {
    const workspace = new Blockly.Workspace();
    const result = restoreWorkspace(workspace, "{bad draft", "{bad server");
    expect(result.restoredDraft).toBe(false);
    expect(result.draftError).toBeInstanceOf(Error);
    expect(result.serverError).toBeInstanceOf(Error);
    expect(Blockly.Events.isEnabled()).toBe(true);
    workspace.dispose();
  });
  it("clears partially loaded blocks when the server copy is invalid", () => {
    const workspace = new Blockly.Workspace();
    const serverCopy = JSON.stringify({
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: "discord_on_ready", id: "partial" },
          { type: "not_a_block", id: "invalid" },
        ],
      },
    });
    const result = restoreWorkspace(workspace, null, serverCopy);
    expect(result.serverError).toBeDefined();
    expect(workspace.getAllBlocks(false)).toEqual([]);
    expect(Blockly.Events.isEnabled()).toBe(true);
    workspace.dispose();
  });
});
