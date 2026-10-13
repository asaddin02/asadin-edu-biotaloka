# Kebijakan keamanan / Security policy

## Melaporkan kerentanan / Reporting a vulnerability

Mohon **jangan** membuka issue publik untuk kerentanan keamanan. Gunakan fitur **Private vulnerability reporting / Security advisories** di repositori GitHub proyek ini, atau hubungi pengelola lewat kontak yang tercantum di profil repositori.

Please **do not** open a public issue for security problems. Use GitHub's **private vulnerability reporting / security advisories** for this repository, or contact the maintainers through the details on the repository profile.

Sertakan / Please include:

- langkah untuk mereproduksi / steps to reproduce,
- dampak yang mungkin terjadi / potential impact,
- versi atau commit yang diuji / tested version or commit.

Kami berusaha menanggapi dalam 7 hari. / We aim to respond within 7 days.

## Cakupan / Scope

- Aplikasi web (`index.html`, `js/`, `css/`, `sw.js`)
- Server produksi dan proxy (`server/server.mjs`)

## Praktik keamanan yang sudah diterapkan / Security measures in place

- Content Security Policy ketat: skrip hanya dari origin sendiri, tanpa skrip inline.
- Semua teks dari API di-escape sebelum ditampilkan; tidak ada `eval`.
- Tidak ada akun, cookie, atau data pribadi yang dikirim ke server Biotaloka.
- Proxy hanya meneruskan endpoint baca-saja yang diizinkan, dengan batas laju per klien.
- Server hanya menyajikan folder publik (`/css`, `/js`, `/assets`, `index.html`, `sw.js`, `manifest.webmanifest`, `robots.txt`).
