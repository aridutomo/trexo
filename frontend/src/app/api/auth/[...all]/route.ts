import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all route handler — this is the better-auth HTTP endpoint
// (/api/auth/*). Used by authClient and the server-action API internally.
export const { GET, POST } = toNextJsHandler(auth);
