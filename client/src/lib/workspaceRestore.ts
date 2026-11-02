import * as Blockly from "blockly";

/** Restore a usable draft, otherwise fall back to the last server copy. */
export function restoreWorkspace(
  workspace: Blockly.Workspace,
  draft: string | null,
  serverCopy: string | null | undefined
): { restoredDraft: boolean; draftError?: unknown; serverError?: unknown } {
  let draftError: unknown;
  Blockly.Events.disable();
  try {
    if (draft !== null) {
      try {
        Blockly.serialization.workspaces.load(JSON.parse(draft), workspace);
        return { restoredDraft: true };
      } catch (error) {
        draftError = error;
        // A failed load can have created blocks before it threw.
        workspace.clear();
      }
    }
    if (serverCopy) {
      try {
        Blockly.serialization.workspaces.load(
          JSON.parse(serverCopy),
          workspace
        );
      } catch (error) {
        return { restoredDraft: false, draftError, serverError: error };
      }
    }
    return { restoredDraft: false, draftError };
  } finally {
    Blockly.Events.enable();
  }
}
