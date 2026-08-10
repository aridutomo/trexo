import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createPool } from "mysql2/promise";

// better-auth connects to the shared MySQL database DIRECTLY (the connection
// string). The Golang backend reads the `session` table from this same DB.
// timezone:"Z" is required by better-auth for consistent UTC storage; charset
// utf8mb4 supports emoji. We parse DATABASE_URL so it stays a single env var
// (mysql://user:pass@host:port/db).
function mysqlPoolFromURL(url: string) {
  const u = new URL(url);
  return createPool({
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    timezone: "Z",
    charset: "utf8mb4",
  });
}

const pool = mysqlPoolFromURL(process.env.DATABASE_URL as string);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // create a session immediately after sign-up
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Trexo-specific columns added to the "user" table.
  user: {
    additionalFields: {
      avatar_color: {
        type: "string",
        required: false,
        defaultValue: "#1e88e5",
        input: true, // settable at sign-up
      },
      phone_number: {
        type: "string",
        required: false,
        input: true,
      },
      is_active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false, // users cannot set their own active flag
      },
    },
  },

  // IMPORTANT: must be the LAST plugin. Lets server actions (signInEmail /
  // signOut) read/write the session cookie via Next's cookies() API.
  plugins: [nextCookies()],
});
