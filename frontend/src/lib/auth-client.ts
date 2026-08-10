import { createAuthClient } from "better-auth/react";

// Browser-side auth client. Used for the useSession() hook in client
// components. Sign-in / sign-up / sign-out go through server actions
// (src/app/login/actions.ts), so those are NOT re-exported here to avoid
// confusion — but they are available on authClient if ever needed.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { useSession } = authClient;
