import { redirect } from "next/navigation";

// Root → dashboard. If there's no session cookie, the middleware on /app/*
// bounces the request to /login.
export default function Home() {
  redirect("/app/dashboard");
}
