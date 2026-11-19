"use client";

import { useState, useEffect } from "react";

import { AuthState } from "@/features/auth/types";
import { AuthUser } from "@/features/users/types";

async function fetchAuthUser(signal: AbortSignal): Promise<AuthUser | null> {
  let response = await fetch("/api/users/me", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    response = await fetch("/api/users/me", {
      method: "POST",
      cache: "no-store",
      signal,
    });
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve authenticated user: ${response.status}`);
  }

  const user: AuthUser = await response.json();
  return user;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let isFetching = false;

    async function refreshAuth() {
      if (isFetching || controller.signal.aborted) {
        return;
      }

      isFetching = true;

      try {
        const user = await fetchAuthUser(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setState({
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(`Failed to retrieve authenticated user: ${error}`);

        setState({
          user: null,
          loading: false,
          error: "ユーザ情報の取得に失敗しました",
        });
      } finally {
        isFetching = false;
      }
    }

    function handleActive() {
      if (document.visibilityState === "visible") {
        void refreshAuth();
      }
    }

    void refreshAuth();

    window.addEventListener("focus", handleActive);
    document.addEventListener("visibilitychange", handleActive);

    return () => {
      controller.abort();
      window.removeEventListener("focus", handleActive);
      document.removeEventListener("visibilitychange", handleActive);
    };
  }, []);

  return state;
};
