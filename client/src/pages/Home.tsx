import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation */}
        <nav className="bg-card border-b border-border px-4 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Discord Bot Builder</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const logout = useAuth().logout;
                  logout?.();
                }}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              ようこそ、{user.name}さん
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Discord ボットをビジュアルプログラミングで構築しましょう
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/dashboard", { replace: false })}
              className="gap-2"
            >
              <Loader2 className="w-5 h-5" />
              ダッシュボードへ
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Discord Bot Builder</h1>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <h2 className="text-5xl font-bold text-foreground mb-4">
            Discord ボットをノーコードで構築
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Blockly のビジュアルプログラミングを使って、複雑なコードを書かずに Discord ボットを作成できます
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login", { replace: false })}
            className="gap-2"
          >
            ログインして始める
          </Button>
        </div>
      </main>
    </div>
  );
}
