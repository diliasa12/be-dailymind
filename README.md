# be-dailymind

Backend service for DailyMind, built with **Hono**, **Better Auth**, **Drizzle ORM**, and **PostgreSQL** — running on **Bun**.

---

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Auth**: [Better Auth](https://better-auth.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL (via Docker)

---

## Prerequisites

Pastikan sudah terinstall:

- [Bun](https://bun.sh/) `>= 1.0`
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (untuk drizzle-kit CLI)

---

## Getting Started

### 1. Clone Repository

```bash
git clone <repo-url>
cd be-dailymind
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Setup Environment Variables

Buat file `.env` di root project dan isi variabel berikut:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dailymind

BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Opsional - hanya jika pakai Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Tips:**
> - `BETTER_AUTH_SECRET` bisa di-generate dengan: `openssl rand -base64 32`
> - `BETTER_AUTH_URL` sesuaikan dengan port yang kamu pakai

### 4. Jalankan Database (Docker)

```bash
bun run db:up
```

Perintah ini akan menjalankan container PostgreSQL via Docker Compose.

Untuk menghentikan database:

```bash
bun run db:down
```

### 5. Jalankan Migrasi Database

Generate file migrasi dari schema:

```bash
bun run db:migration:generate
```

Jalankan migrasi ke database:

```bash
bun run db:migrate
```

### 6. Jalankan Server

```bash
bun run dev
```

Server berjalan dengan **hot reload**. Default tersedia di `http://localhost:3000`.

---

## Scripts

| Command | Deskripsi |
|---|---|
| `bun run dev` | Jalankan server development dengan hot reload |
| `bun run db:up` | Jalankan Docker container PostgreSQL |
| `bun run db:down` | Hentikan Docker container PostgreSQL |
| `bun run db:migration:generate` | Generate file migrasi dari schema Drizzle |
| `bun run db:migrate` | Jalankan migrasi ke database |
| `bun run db:studio` | Buka Drizzle Studio (GUI database) |

---

## Project Structure

```
be-dailymind/
├── src/
│   └── index.ts        # Entry point
├── .env                # Environment variables (buat sendiri)
├── docker-compose.yml  # Konfigurasi Docker PostgreSQL
├── drizzle.config.ts   # Konfigurasi Drizzle ORM
└── package.json
```

---

## Troubleshooting

**Database tidak bisa connect?**
- Pastikan Docker sudah berjalan: `docker ps`
- Cek `DATABASE_URL` di `.env` sudah sesuai dengan konfigurasi di `docker-compose.yml`

**Port sudah dipakai?**
- Ganti port di `BETTER_AUTH_URL` dan pastikan Hono server berjalan di port yang sama

**Migrasi gagal?**
- Pastikan database sudah berjalan sebelum menjalankan `db:migrate`
- Cek koneksi dengan: `bun run db:studio`
