"use client";

import { signOutFromGoogle } from "@/features/auth";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  const handleLogout = async () => {
    try {
      await signOutFromGoogle();
    } catch (error) {
      console.error("Failed to sign out from Google:", error);
      alert("ログアウトに失敗しました．");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border p-8 shadow-lg">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">承認待ち</h1>
          <p className="text-muted-foreground">
            管理者の承認をお待ちください．承認が完了するとアプリを利用できます．
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          ログアウト
        </Button>
      </div>
    </main>
  );
}
