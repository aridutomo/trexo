-- 000004_better_auth_tables.up.sql
-- Tabel autentikasi better-auth (user / session / account / verification).
--
-- Skema ini biasanya dibuat oleh `npx @better-auth/cli migrate` di sisi frontend
-- (Next.js). Namun di VPS tabelnya sempat terhapus & tidak bisa direstore, jadi
-- kita duplikat strukturnya PERSIS (schema saja, TANPA data) sebagai migrasi
-- golang-migrate. Karena migrasi di-embed & dijalankan otomatis saat backend
-- start, sekali rebuild + redeploy tabelnya otomatis ikut dibuat di VPS.
--
-- CREATE TABLE IF NOT EXISTS membuat ini idempotent:
--   - VPS (DB kosong / tabel terhapus) -> tabel dibuat ulang.
--   - Lokal (tabel sudah ada)          -> no-op, lalu versi ditandai 4 (aman).
--
-- Kolom camelCase (emailVerified, userId, expiresAt, ...) beserta tipe datanya
-- HARUS identik dengan output better-auth; jangan diubah tanpa regenerate lewat
-- `npx @better-auth/cli migrate`. user tambahan (avatar_color, phone_number,
-- is_active) = additionalFields di frontend/src/lib/auth.ts.
--
-- Catatan: user_id / owner_id / assignee_id di tabel bisnis (ms_*) adalah
-- soft-FK varchar(36) -> user.id, BUKAN FK constraint fisik, jadi pembuatan
-- tabel ini tidak menyebabkan konflik FK dengan tabel bisnis.

SET NAMES utf8mb4;

-- user ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`            varchar(36)  NOT NULL,
  `name`          varchar(255) NOT NULL,
  `email`         varchar(255) NOT NULL,
  `emailVerified` tinyint(1)   NOT NULL,
  `image`         text,
  `createdAt`     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `avatar_color`  text,
  `phone_number`  text,
  `is_active`     tinyint(1)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- session ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `session` (
  `id`         varchar(36)  NOT NULL,
  `expiresAt`  timestamp(3) NOT NULL,
  `token`      varchar(255) NOT NULL,
  `createdAt`  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  timestamp(3) NOT NULL,
  `ipAddress`  text,
  `userAgent`  text,
  `userId`     varchar(36)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `session_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- account ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `account` (
  `id`                    varchar(36)  NOT NULL,
  `accountId`             text NOT NULL,
  `providerId`            text NOT NULL,
  `userId`                varchar(36)  NOT NULL,
  `accessToken`           text,
  `refreshToken`          text,
  `idToken`               text,
  `accessTokenExpiresAt`  timestamp(3) NULL DEFAULT NULL,
  `refreshTokenExpiresAt` timestamp(3) NULL DEFAULT NULL,
  `scope`                 text,
  `password`              text,
  `createdAt`             timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             timestamp(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- verification -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verification` (
  `id`          varchar(36)  NOT NULL,
  `identifier`  varchar(255) NOT NULL,
  `value`       text NOT NULL,
  `expiresAt`   timestamp(3) NOT NULL,
  `createdAt`   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `verification_identifier_idx` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
