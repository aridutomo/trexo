"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { useTrexo } from "@/lib/store";

/**
 * Reusable logout. Clears the session server-side, resets in-memory store,
 * then navigates to /login on the client. Navigation is client-driven (not a
 * server-action redirect) because a redirect() fired from a plain onClick is
 * unreliable in Next.js — that was the original logout bug.
 */
export function useLogout() {
  const router = useRouter();
  const reset = useTrexo((s) => s.reset);

  return useCallback(async () => {
    try {
      await signOutAction(); // clears session cookie (server, via nextCookies)
    } finally {
      reset(); // drop stale in-memory user/data + allow re-bootstrap on next login
      router.replace("/login");
    }
  }, [router, reset]);
}
