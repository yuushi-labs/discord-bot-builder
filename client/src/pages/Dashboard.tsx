import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", discordToken: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: projects,
    isLoading,
    isError,
    refetch,
  } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });
  const createMutation = trpc.projects.create.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.discordToken.trim()) {
      toast.error("プロジェクト名と Discord Token を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        discordToken: formData.discordToken.trim(),
      });
      toast.success("プロジェクトを作成しました");
      setFormData({ name: "", discordToken: "" });
      setIsCreateOpen(false);
      refetch();
    } catch (error) {
      toast.error("プロジェクト作成に失敗しました");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm("このプロジェクトを削除してもよろしいですか？")) return;

    try {
      await deleteMutation.mutateAsync({ id: projectId });
      toast.success("プロジェクトを削除しました");
      refetch();
    } catch (error) {
      toast.error("プロジェクト削除に失敗しました");
      console.error(error);
    }
  };

  const handleEditProject = (projectId: number) => {
    navigate(`/editor/${projectId}`, { replace: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              ボットプロジェクト
            </h1>
            <p className="text-muted-foreground mt-2">
              {user?.name || "ユーザー"}さんのプロジェクト一覧
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新規プロジェクト
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>新規プロジェクト作成</DialogTitle>
                <DialogDescription>
                  新しいボットプロジェクトを作成します
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">プロジェクト名</Label>
                  <Input
                    id="project-name"
                    placeholder="例: My Awesome Bot"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord-token">Discord Bot Token</Label>
                  <Input
                    id="discord-token"
                    type="password"
                    placeholder="Discord Developer Portal から取得したトークン"
                    value={formData.discordToken}
                    onChange={e =>
                      setFormData({ ...formData, discordToken: e.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "作成中..." : "作成"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isError && projects !== undefined && (
          <div role="alert" className="mb-4 flex items-center gap-3">
            <p>更新に失敗しました。前回取得した一覧を表示しています。</p>
            <Button variant="outline" onClick={() => refetch()}>
              再読み込み
            </Button>
          </div>
        )}
        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : isError && projects === undefined ? (
          <Card>
            <CardContent className="py-12 text-center" role="alert">
              <p className="mb-4">プロジェクト一覧を読み込めませんでした。</p>
              <Button variant="outline" onClick={() => refetch()}>
                再読み込み
              </Button>
            </CardContent>
          </Card>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card
                key={project.id}
                className="bg-card border-border hover:border-accent/50 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-foreground">
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    作成日:{" "}
                    {new Date(project.createdAt).toLocaleDateString("ja-JP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={() => handleEditProject(project.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                      onClick={() => handleDelete(project.id)}
                      aria-label={`${project.name} を削除`}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                プロジェクトがまだ作成されていません
              </p>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                最初のプロジェクトを作成
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
