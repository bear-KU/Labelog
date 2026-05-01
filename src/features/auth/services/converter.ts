import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from "firebase/firestore";
import { User } from "@/features/users/types";

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
      return {
        ...user,
        birthday: user.birthday ? Timestamp.fromDate(user.birthday) : null,
        createdAt: Timestamp.fromDate(user.createdAt),
        updatedAt: Timestamp.fromDate(user.updatedAt),
      };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options);
    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      gender: data.gender ?? null,
      role: data.role,
      isApproved: data.isApproved,
      birthday: data.birthday ? data.birthday.toDate() : null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    };
  }
};
