"use client";

import { neonAuthClient } from "@/features/auth/client";

export const signInWithGoogle = async () => {
  const { error } = await neonAuthClient.signIn.social({
    provider: "google",
    callbackURL: window.location.origin + "/",
  });

  if (error) {
    throw new Error(error.message || "Failed to sign in with Google");
  }
};

export const signOutFromGoogle = async () => {
  const { error } = await neonAuthClient.signOut();

  if (error) {
    throw new Error(error.message || "Failed to sign out from Google");
  }

  window.location.assign("/login");
};
