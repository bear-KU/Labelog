export type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  genre: string[];
  tags: string[];
  businessHours: string | null;
  closedDays: string | null;
  url: string | null;
  averageRating: number | null;
  reviewCount: number;
  thumbnailPublicId: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
