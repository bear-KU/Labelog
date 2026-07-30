import {db} from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { restaurantConverter } from "@/features/restaurants/services/converter";
import type { Restaurant } from "@/features/restaurants/types";

const restaurantsRef = collection(db, "restaurants").withConverter(restaurantConverter);

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const q = query(restaurantsRef, where("isDeleted", "==", false), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const getRestaurant = async (id: string): Promise<Restaurant | null> => {
  const docRef = doc(restaurantsRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const createRestaurant = async (
  data: Omit<Restaurant, "id" | "averageRating" | "reviewCount" | "isDeleted" | "createdAt" | "updatedAt">
): Promise<string> => {
  const newDocRef = doc(restaurantsRef);

  await setDoc(newDocRef, {
    ...data,
    id: newDocRef.id,
    averageRating: null,
    reviewCount: 0,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newDocRef.id;
};

export const updateRestaurant = async (
 id: string,
 data: Partial<Omit<Restaurant, "id" | "createdAt">> 
): Promise<void> => {
  const docRef = doc(restaurantsRef, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteRestaurant = async (id: string): Promise<void> => {
  const docRef = doc(restaurantsRef, id);
  await updateDoc(docRef, {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
};
