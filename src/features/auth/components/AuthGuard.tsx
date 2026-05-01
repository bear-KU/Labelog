"use client";

import { useAuthContext } from "@/features/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // ログインしていない場合
    if (!user) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      return;
    }
    
    // 承認待ちの場合
    if (!user.isApproved) {
      if (pathname !== "/pending") {
        router.push("/pending");
      }
      return;
    }

    // ログインしていて承認されている場合
    if (pathname === "/login" || pathname === "/pending") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  // ローディング中は何も表示しない
  if (loading) {
    return null;
  }

  // =========================================================
  // リダイレクト完了までのフリッカを防止するガード
  // =========================================================
  // ログインしておらず，ログイン画面以外にいる場合
  if (!user && pathname !== "/login") return null;

  // 承認されておらず，承認待ち画面以外にいる場合
  if (user && !user.isApproved && pathname !== "/pending") return null;

  // 承認されており，ログイン画面，承認待ち画面にいる場合
  if (user && user.isApproved && (pathname === "/login" || pathname === "/pending")) return null;

  return <>{children}</>;
};
