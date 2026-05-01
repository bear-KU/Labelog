export type Gender = "male" | "female" | "other";

export type UserRole = "admin" | "member";

export type User = {
  uid: string;
  name: string;
  email: string;
  gender: Gender | null;
  birthDate: Date | null;
  isApproved: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
