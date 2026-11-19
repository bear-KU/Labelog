"use client";

import { useAuthContext } from "@/features/auth/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading, error } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || error) return;

    // ログインしていない場合
    if (!user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }
    
    // 承認待ちの場合
    if (!user.isApproved) {
      if (pathname !== "/pending") {
        router.replace("/pending");
      }
      return;
    }

    // ログインしていて承認されている場合
    if (pathname === "/login" || pathname === "/pending") {
      router.replace("/");
    }
  }, [user, loading, error, pathname, router]);

  // ローディング中は何も表示しない
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p role="alert">{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </Button>
      </main>
    );
  }

  // =========================================================
  // リダイレクト完了までのフリッカを防止するガード
  // =========================================================
  // ログインしておらず，ログイン画面以外にいる場合
  if (!user && pathname !== "/login") return null;

  // 承認されておらず，承認待ち画面以外にいる場合
  if (user && !user.isApproved && pathname !== "/pending") return null;

  // 承認されており，ログイン画面，承認待ち画面にいる場合
  if (user?.isApproved && (pathname === "/login" || pathname === "/pending")) return null;

  return <>{children}</>;
};
