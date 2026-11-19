import { neonAuth } from "@/features/auth/server";

export const { GET, POST } = neonAuth.handler();
