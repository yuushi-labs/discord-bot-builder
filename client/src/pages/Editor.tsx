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
import { discordTheme, TOOLBOX_XML } from "@/lib/discordTheme";
import { generatePythonCode } from "@/lib/pythonCodeGenerator";
import { restoreWorkspace } from "@/lib/workspaceRestore";

export default function Editor({ params }: { params: { id: string } }) {
  const id = params.id;
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const revision = useRef(0);

  const projectId = parseInt(id || "0", 10);
  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!user && !isNaN(projectId) }
  );
  const updateMutation = trpc.projects.update.useMutation();
  const utils = trpc.useUtils();
  const exportQuery = trpc.projects.export.useQuery(
    { id: projectId },
    { enabled: false }
  );

  useEffect(() => {
    if (!blocklyDiv.current || !project) return;

    defineDiscordBlocks();

    const workspaceOptions: Blockly.BlocklyOptions = {
      toolbox: TOOLBOX_XML,
      theme: discordTheme,
      grid: { spacing: 20, length: 3, colour: "#3f4147", snap: true },
      zoom: { controls: true, wheel: true, startScale: 1 },
    };

    if (workspace.current) {
      workspace.current.dispose();
    }

    workspace.current = Blockly.inject(blocklyDiv.current, workspaceOptions);
    setProjectName(project.name);
    setLoadError(false);
    setDirty(false);
    revision.current = 0;

    const draftKey = `workspace-draft:${user!.id}:${project.id}`;
    let draft: string | null = null;
    try {
      draft = sessionStorage.getItem(draftKey);
    } catch {
      toast.error(
        "下書き保存を利用できません。ページを離れる前に保存してください。"
      );
    }

    const { restoredDraft, draftError, serverError } = restoreWorkspace(
      workspace.current,
      draft,
      project.blocklyWorkspace
    );
    if (draftError) {
      console.error("Failed to load local draft:", draftError);
      toast.error(
        serverError
          ? "下書きを読み込めませんでした。"
          : "下書きを読み込めませんでした。サーバーの保存データを使用します。"
      );
    }
    if (serverError) {
      console.error("Failed to load server workspace:", serverError);
      setLoadError(true);
      // A failed load must not produce editable drafts or overwrite server data.
      workspace.current.dispose();
      workspace.current = Blockly.inject(blocklyDiv.current, {
        ...workspaceOptions,
        toolbox: undefined,
        readOnly: true,
      });
    }

    if (restoredDraft) {
      setDirty(true);
      revision.current = 1;
      toast.info(
        "未保存の下書きを復元しました。保存して変更を確定してください。"
      );
    }
    const currentWorkspace = workspace.current;
    const onChange = (event: Blockly.Events.Abstract) => {
      if (!event.isUiEvent) {
        revision.current += 1;
        setDirty(true);
        try {
          sessionStorage.setItem(
            draftKey,
            JSON.stringify(
              Blockly.serialization.workspaces.save(currentWorkspace)
            )
          );
        } catch {
          toast.error(
            "下書きを保存できません。ページを離れる前に保存してください。"
          );
        }
      }
    };
    if (!serverError) currentWorkspace.addChangeListener(onChange);
    const observer = new ResizeObserver(() =>
      Blockly.svgResize(currentWorkspace)
    );
    observer.observe(blocklyDiv.current);
    Blockly.svgResize(currentWorkspace);

    return () => {
      observer.disconnect();
      if (!serverError) currentWorkspace.removeChangeListener(onChange);
      if (workspace.current) {
        workspace.current.dispose();
        workspace.current = null;
      }
    };
  }, [project?.id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/", { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isError && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        <div>
          <p className="mb-4">プロジェクトを読み込めませんでした。</p>
          <Button onClick={() => refetch()}>再読み込み</Button>
        </div>
      </div>
    );
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
      const savedRevision = revision.current;
      const workspaceData = Blockly.serialization.workspaces.save(
        workspace.current
      );
      const blocklyWorkspace = JSON.stringify(workspaceData);
      await updateMutation.mutateAsync({ id: projectId, blocklyWorkspace });
      await utils.projects.get.cancel({ id: projectId });
      utils.projects.get.setData({ id: projectId }, previous =>
        previous ? { ...previous, blocklyWorkspace } : previous
      );
      if (revision.current === savedRevision) {
        setDirty(false);
        try {
          sessionStorage.removeItem(
            `workspace-draft:${user!.id}:${project.id}`
          );
        } catch {
          /* The server save succeeded even when local storage is unavailable. */
        }
      }
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
      // The token is not part of the project payload (it is masked there); fetch
      // it on demand from the ownership-checked export endpoint. A failed refetch
      // resolves with isError set and stale data, so check it before exporting.
      const { data: secret, isError } = await exportQuery.refetch();
      if (isError || !secret) {
        throw new Error("プロジェクトが見つかりません");
      }
      const exportCode = generatePythonCode(workspace.current, {
        tokenExpr: JSON.stringify(secret.discordToken),
      });

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
      toast.error(
        error instanceof Error ? error.message : "エクスポートに失敗しました"
      );
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                !dirty ||
                window.confirm("未保存の変更があります。戻りますか？")
              )
                navigate("/dashboard");
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground break-all">
              {projectName}
            </h1>
            <p role="status" className="text-xs text-muted-foreground">
              {dirty ? "未保存の変更があります" : "保存済み"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={updateMutation.isPending || loadError}
          >
            {updateMutation.isPending ? "保存中..." : "保存"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || loadError}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "エクスポート中..." : "エクスポート"}
          </Button>
        </div>
      </div>

      {loadError && (
        <p
          role="alert"
          className="bg-destructive text-destructive-foreground px-4 py-2"
        >
          保存済みのワークスペースを読み込めませんでした。データを保護するため保存とエクスポートを停止しています。
        </p>
      )}
      {/* Blockly Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={blocklyDiv}
          className="w-full h-full"
          style={{ background: "#2a2d31" }}
        />
      </div>
    </div>
  );
}
