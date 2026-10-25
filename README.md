# AnimeHub

## Jalankan lokal
1. `npm install`
2. Salin `.env.example` ke `.env.local`, isi URL & anon key Supabase, service role key, `CRON_SECRET`.
3. Supabase SQL Editor: jalankan `supabase/migrations/0001_init.sql`. Jadikan diri admin: `update profiles set role='admin' where id='<uuid-anda>';`
4. `npm run dev`

## Supabase Auth
- Authentication > Providers > Email aktif, "Confirm email" ON. Ubah template email "Confirm signup" agar memuat `{{ .Token }}` untuk OTP.
- URL Configuration: Site URL = domain Anda; Redirect URLs tambah `https://DOMAIN/auth/callback` dan `http://localhost:3000/auth/callback`.
- Pasang CAPTCHA (Auth > Attack Protection) bila perlu.

## Google OAuth
Google Cloud Console > APIs & Services > Credentials > OAuth client (Web). Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`. Masukkan Client ID & Secret di Supabase > Auth > Providers > Google.

## Vercel
Import repo, isi semua env var. `vercel.json` menjadwalkan `/api/cron/sync` tiap 6 jam; Vercel mengirim header `Authorization: Bearer $CRON_SECRET` otomatis. Paket Hobby membatasi cron ke 1x/hari.

## Status jujur
Belum diuji (lingkungan tanpa jaringan: npm install/build/tes tidak dijalankan). Jalankan `npm run typecheck && npm run build` dan perbaiki bila ada error.
- Berfungsi (secara desain): AniList/Jikan, home, detail, pencarian, jadwal, auth, subscribe/favorit, riwayat, notifikasi (+cron), pengaturan, player HTML5/HLS/iframe.
- Perlu konfigurasi: Supabase, Google OAuth, CRON_SECRET.
- Samehadaku/Otakudesu: tidak ada API resmi; endpoint tidak di-hardcode dan tidak diverifikasi. Adapter nonaktif sampai `*_API_BASE` diisi dan skema respons disesuaikan.
- Sumber video: tidak ada yang disediakan. Isi tabel `video_sources` dengan sumber yang Anda berhak putar (MP4/HLS/iframe https).
- Belum ada: CRUD admin UI, upload avatar/background (bucket & policy sudah ada di migration), push browser, rekomendasi personal, skip OP/ED, tes otomatis.
