-- 000004_better_auth_tables.down.sql
-- Drop tabel better-auth. PERHATIAN: ini menghapus SELURUH data user, sesi,
-- akun, dan token verifikasi. Drop dalam urutan tergantung dulu (verification,
-- account, session, user) — walau di sini tidak ada FK fisik antar tabel auth.

DROP TABLE IF EXISTS `verification`;
DROP TABLE IF EXISTS `account`;
DROP TABLE IF EXISTS `session`;
DROP TABLE IF EXISTS `user`;
