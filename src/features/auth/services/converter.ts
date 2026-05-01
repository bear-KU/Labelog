import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp, WithFieldValue } from "firebase/firestore";
import { User } from "@/features/users/types";

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: WithFieldValue<User>): DocumentData {
      return {
        ...user,
        birthDate: user.birthDate instanceof Date ? Timestamp.fromDate(user.birthDate) : user.birthDate,
        createdAt: user.createdAt instanceof Date ? Timestamp.fromDate(user.createdAt) : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? Timestamp.fromDate(user.updatedAt) : user.updatedAt,
      };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data({ ...options, serverTimestamps: "estimate" });

    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      gender: data.gender ?? null,
      role: data.role ?? "member",
      isApproved: data.isApproved ?? false,
      birthDate: data.birthDate instanceof Timestamp ? data.birthDate.toDate() : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }
};
