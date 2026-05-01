"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AuthState } from "@/features/auth/types";
import { userConverter } from "@/features/auth/services/converter";

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid).withConverter(userConverter);


        unsubscribeSnapshot = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setState({
                user: docSnap.data(),
                loading: false,
                error: null,
              });
            } else {
              setState({
                user: null,
                loading: false,
                error: null,
              });
            }
          },
          (e) => {
            console.error(e);
            setState({
              user: null,
              loading: false,
              error: "ユーザ情報の取得に失敗しました",
            });
          }
        );
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        });

        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return state;
};
