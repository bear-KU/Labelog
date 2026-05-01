import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "@/features/users/types";
import { userConverter } from "@/features/auth/services/converter";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const userDocRef = doc(db, "users", firebaseUser.uid).withConverter(userConverter);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const newUser = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "名無し",
        email: firebaseUser.email || "",
        gender: null,
        birthDate: null,
        isApproved: false,
        role: "member" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUser);
    }

    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error("Error signing out from Google:", error);
    throw error;
  }
};
