import { neonAuth } from "@/features/auth/server";

export default neonAuth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
