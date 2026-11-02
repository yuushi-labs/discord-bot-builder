import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download } from "lucide-react";
import * as Blockly from "blockly";
import { defineDiscordBlocks } from "@/lib/blocklyBlocks";
import { generatePythonCode } from "@/lib/pythonCodeGenerator";

export default function Editor({ params }: { params: { id: string } }) {
  const id = params.id;
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const projectId = parseInt(id || "0", 10);
  const { data: project, isLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!user && !isNaN(projectId) }
  );
  const updateMutation = trpc.projects.update.useMutation();

  useEffect(() => {
    if (!blocklyDiv.current || !project) return;

    defineDiscordBlocks();

    const toolboxXml = `
      <xml>
        <category name="イベント" colour="230">
          <block type="discord_on_ready"></block>
          <block type="discord_on_message"></block>
          <block type="discord_on_message_edit"></block>
          <block type="discord_on_message_delete"></block>
          <block type="discord_on_member_join"></block>
          <block type="discord_on_member_remove"></block>
          <block type="discord_on_reaction_add"></block>
        </category>
        <category name="アクション" colour="160">
          <block type="discord_send_message"></block>
          <block type="discord_send_embed"></block>
          <block type="discord_edit_message"></block>
          <block type="discord_delete_message"></block>
          <block type="discord_add_reaction"></block>
          <block type="discord_add_role"></block>
          <block type="discord_remove_role"></block>
          <block type="discord_ban_member"></block>
          <block type="discord_kick_member"></block>
        </category>
        <category name="条件・ループ" colour="210">
          <block type="discord_if"></block>
          <block type="discord_if_else"></block>
          <block type="discord_for_loop"></block>
          <block type="discord_while_loop"></block>
          <block type="discord_comparison"></block>
          <block type="discord_logic_and"></block>
          <block type="discord_logic_or"></block>
          <block type="discord_logic_not"></block>
        </category>
        <category name="取得" colour="65">
          <block type="discord_get_message"></block>
          <block type="discord_get_author"></block>
          <block type="discord_get_channel"></block>
          <block type="discord_get_guild"></block>
          <block type="discord_get_message_content"></block>
        </category>
        <category name="変数" colour="330">
          <block type="discord_set_variable"></block>
          <block type="discord_get_variable"></block>
        </category>
        <category name="テキスト" colour="160">
          <block type="discord_text"></block>
          <block type="discord_number"></block>
          <block type="discord_string_concat"></block>
        </category>
        <category name="ユーティリティ" colour="45">
          <block type="discord_print"></block>
          <block type="discord_wait"></block>
        </category>
        <category name="応用" colour="290">
          <block type="discord_conditional_message"></block>
          <block type="discord_get_all_servers"></block>
          <block type="discord_get_server_by_name"></block>
          <block type="discord_broadcast_to_servers"></block>
          <block type="discord_schedule_task"></block>
          <block type="discord_schedule_daily"></block>
        </category>
      </xml>
    `;

    const workspaceOptions: Blockly.BlocklyOptions = {
      toolbox: new DOMParser().parseFromString(toolboxXml, "text/xml")
        .documentElement,
      grid: { spacing: 20, length: 3, colour: "#ccc", snap: true },
      zoom: { controls: true, wheel: true, startScale: 1 },
    };

    if (workspace.current) {
      workspace.current.dispose();
    }

    workspace.current = Blockly.inject(blocklyDiv.current, workspaceOptions);
    setProjectName(project.name);

    if (project.blocklyWorkspace) {
      try {
        Blockly.serialization.workspaces.load(
          JSON.parse(project.blocklyWorkspace),
          workspace.current
        );
      } catch (error) {
        console.error("Failed to load workspace:", error);
      }
    }

    return () => {
      if (workspace.current) {
        workspace.current.dispose();
        workspace.current = null;
      }
    };
  }, [project]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    navigate("/", { replace: true });
    return null;
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            プロジェクトが見つかりません
          </p>
          <Button onClick={() => navigate("/dashboard", { replace: true })}>
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!workspace.current) return;

    try {
      const workspaceData = Blockly.serialization.workspaces.save(
        workspace.current
      );
      await updateMutation.mutateAsync({
        id: projectId,
        blocklyWorkspace: JSON.stringify(workspaceData),
      });
      toast.success("ワークスペースを保存しました");
    } catch (error) {
      toast.error("保存に失敗しました");
      console.error(error);
    }
  };

  const handleExport = async () => {
    if (!workspace.current) return;

    setIsExporting(true);
    try {
      const code = generatePythonCode(workspace.current, {
        tokenExpr: "DISCORD_TOKEN",
      });

      const exportCode = `DISCORD_TOKEN = ${JSON.stringify(project.discordToken || "")}\n\n${code}`;

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(exportCode)
      );
      element.setAttribute("download", `${projectName}.py`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("Python コードをエクスポートしました");
    } catch (error) {
      toast.error("エクスポートに失敗しました");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard", { replace: false })}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <h1 className="text-xl font-bold text-foreground">{projectName}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            保存
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "エクスポート中..." : "エクスポート"}
          </Button>
        </div>
      </div>

      {/* Blockly Editor */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={blocklyDiv}
          className="w-full h-full"
          style={{ background: "#2a2d31" }}
        />
      </div>
    </div>
  );
}
