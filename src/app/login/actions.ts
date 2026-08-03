"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthState = { error?: string } | undefined;

// NOTE on cookies: the nextCookies() plugin in src/lib/auth.ts reads/writes
// the session cookie via Next's cookies() API, so these server actions set
// the cookie automatically — no manual header handling needed.

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email.includes("@")) return { error: "Email tidak valid." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  let signedInUser: { is_active?: boolean } | undefined;
  try {
    const res = await auth.api.signInEmail({ body: { email, password } });
    signedInUser = res?.user as { is_active?: boolean } | undefined;
  } catch (err) {
    console.error("[signIn]", err);
    return { error: "Email atau password salah." };
  }

  // better-auth has no built-in is_active gate — enforce it here.
  if (signedInUser && signedInUser.is_active === false) {
    try {
      await auth.api.signOut();
    } catch {
      /* ignore */
    }
    return { error: "Akun Anda dinonaktifkan." };
  }

  redirect("/app/dashboard");
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (name.length < 2) return { error: "Nama minimal 2 karakter." };
  if (!email.includes("@")) return { error: "Email tidak valid." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
  } catch (err) {
    console.error("[signUp]", err);
    return { error: "Pendaftaran gagal. Coba email lain, atau periksa log server." };
  }

  // autoSignIn creates the session + cookie; redirect lands on the dashboard.
  redirect("/app/dashboard");
}

export async function signOutAction() {
  try {
    // signOut has requireHeaders: true — without headers it can't read the
    // session cookie, so the session is never revoked and the cookie stays.
    // That makes the /login proxy bounce the user back to /app/dashboard.
    await auth.api.signOut({ headers: await headers() });
  } catch {
    /* ignore — client navigates to /login regardless */
  }
}
