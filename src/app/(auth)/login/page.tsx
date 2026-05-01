"use client";

import { signInWithGoogle } from "@/features/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
      alert("ログインに失敗しました．");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Labelog にログイン</h1>
        </div>

        <Button onClick={handleLogin} variant="outline" className="w-full h-12 text-base">
          Google でログイン
        </Button>
      </div>
    </main>
  )
}
