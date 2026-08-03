// Ids.gs — prefixed random business keys (mirror src/lib/utils.ts uid()).
// better-auth owns the "u_" user prefix; we generate ws_/prj_/t_/s_/c_ here.
// Each key is also backed by an int8 PK + a UNIQUE constraint, so a collision
// (astronomically unlikely) would surface as a Supabase error, not silent dupes.

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genId(prefix) {
  const len = 16;
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ID_ALPHABET.charAt(Math.floor(Math.random() * ID_ALPHABET.length));
  }
  return prefix + "_" + out;
}
