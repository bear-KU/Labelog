import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp, WithFieldValue } from "firebase/firestore";
import { Restaurant } from "@/features/restaurants/types";

export const restaurantConverter: FirestoreDataConverter<Restaurant> = {
  toFirestore(restaurant: WithFieldValue<Restaurant>): DocumentData {
    return {
      ...restaurant,
      createdAt: restaurant.createdAt instanceof Date ? Timestamp.fromDate(restaurant.createdAt) : restaurant.createdAt,
      updatedAt: restaurant.updatedAt instanceof Date ? Timestamp.fromDate(restaurant.updatedAt) : restaurant.updatedAt,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Restaurant {
    const data = snapshot.data({ ...options, serverTimestamps: "estimate" });

    return {
      id: data.id,
      name: data.name,
      address: data.address ?? null,
      genre: data.genre ?? [],
      tags: data.tags ?? [],
      businessHours: data.businessHours ?? null,
      closedDays: data.closedDays ?? null,
      url: data.url ?? null,
      averageRating: data.averageRating ?? null,
      reviewCount: data.reviewCount ?? 0,
      thumbnailPublicId: data.thumbnailPublicId ?? null,
      isDeleted: data.isDeleted ?? false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }
};
