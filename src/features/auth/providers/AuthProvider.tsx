"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { AuthState } from "@/features/auth/types";

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuth();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
