import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleDiscordLogin = () => {
    try {
      window.location.href = getLoginUrl();
    } catch (error) {
      console.error("[Auth] Unable to build login URL", error);
      toast.error("Discord Client ID が設定されていません", {
        description: ".env の VITE_DISCORD_CLIENT_ID を設定してください。",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Discord Bot Builder
        </h1>
        <p className="text-muted-foreground">
          Blockly でビジュアルプログラミング。コード不要で Discord ボットを構築
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">ログイン</CardTitle>
          <CardDescription>
            Discord アカウントでログインしてボット構築を始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white gap-2 h-12"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8851-1.5152.074.074 0 00-.0787.0366c-.211.3667-.4429.8465-.6068 1.2243a18.9927 18.9927 0 00-5.6888 0c-.1638-.3778-.3957-.8576-.6068-1.2243a.077.077 0 00-.0785-.0366m-4.3554 6.541a.077.077 0 00-.0379.1276c.3891.5592.9496 1.1122 1.6643 1.5859a.19.19 0 00.2037-.0726c.1482-.2468.2802-.5064.3923-.7776a.073.073 0 00-.0397-.0852c-.5231-.1994-1.0066-.4686-1.4276-.8025a.077.077 0 00-.0042.1276m5.4664 5.2446a.077.077 0 00.0296-.1526c-.746-.559-1.534-1.094-2.603-1.636a.075.075 0 00-.0842.0254c-.121.1897-.229.3923-.3220.5923a.075.075 0 00.0066.0875c1.143.537 2.187 1.075 2.9475 1.632a.077.077 0 00.1025-.0276zM11.4979 15.8534c.6915 0 1.256-.5925 1.256-1.3159 0-.7234-.5645-1.3159-1.256-1.3159-.6915 0-1.256.5925-1.256 1.3159 0 .7234.5645 1.3159 1.256 1.3159zm4.9087 0c.6915 0 1.256-.5925 1.256-1.3159 0-.7234-.5645-1.3159-1.256-1.3159-.6915 0-1.256.5925-1.256 1.3159 0 .7234.5645 1.3159 1.256 1.3159z" />
            </svg>
            Discord でログイン
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">または</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Discord アカウントがない場合は、
            <a
              href="https://discord.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              こちらから登録
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-8 text-center max-w-md">
        ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
      </p>
    </div>
  );
}
