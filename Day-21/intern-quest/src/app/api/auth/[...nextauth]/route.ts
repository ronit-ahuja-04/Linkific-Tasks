// NextAuth's own endpoints: sign-in, callback (GitHub returns here), sign-out, session, CSRF token
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
