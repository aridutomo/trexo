import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// better-auth connects to Supabase Postgres DIRECTLY over the pg pooler
// (the connection string, NOT the REST API). GAS uses the REST API separately.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's transaction pooler (port 6543) doesn't support prepared
  // statements, so disable them. Harmless on the session pooler / direct.
  // @ts-expect-error — `prepare` is a real pg runtime option that the
  // @types/pg definitions don't declare. If a future pg version adds it,
  // this directive will flag itself as unused so you can remove it.
  prepare: false,
});

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
