# Penjaga Lentera

**RPG pixel-art 2D berbasis web** tentang menjelajah Desa Embun, membantu warga, mengumpulkan kristal, dan menyalakan lentera kuno di Hutan Bisik.

Dibuat sebagai proyek portofolio untuk menunjukkan gameplay loop RPG yang berjalan di browser: eksplorasi map, interaksi NPC, pertarungan, aktivitas bertani, memancing, ekonomi sederhana, siklus siang–malam, serta penyimpanan progres.

## Highlight

- Dunia dengan desa utama, pusat kampung, hutan, dan interior bangunan yang bisa dimasuki.
- Quest utama dengan tiga kristal, dialog NPC, musuh, peti, upgrade pedang, dan ending.
- Aktivitas harian bergaya life-sim: menanam, menyiram, memanen, menebang, menambang, membersihkan semak, memancing, memasak, beternak ayam, dan berdagang.
- Waktu dunia tetap berjalan saat MC menyerang atau memakai alat. Fase pagi, siang, senja, dan malam memiliki pencahayaan, rutinitas warga, transisi tidur, dan suara ayam berkokok.
- Sprite pixel-art untuk MC, warga, alat, senjata, bangunan, perabot, musuh, dan lingkungan.
- Save lokal yang tervalidasi, migrasi save lama, batas inventory, regenerasi harian, dan sistem audio dengan pengaturan volume.

## Teknologi

- TypeScript
- Phaser 3
- Vite
- Web Audio API
- Node.js 22.18+

## Menjalankan secara lokal

```sh
npm install
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173/`.

Perintah validasi:

```sh
npm test
npm run build
```

`npm run build` menghasilkan folder `dist/` yang siap di-host sebagai situs statis.

## Kontrol

| Tombol | Aksi |
| --- | --- |
| WASD / panah | Bergerak |
| Shift | Berlari |
| 1–6 | Pilih kapak, beliung, sabit, cangkul, pancing, atau penyiram |
| F | Gunakan alat |
| E / Enter | Interaksi dan lanjut dialog |
| Space | Menyerang ke arah hadap |
| H | Memakai ramuan |
| I | Membuka inventory |
| Esc | Jeda dan simpan |
| Tab / Enter | Navigasi menu |

## Pemeriksaan cepat

Setelah server development berjalan, dua halaman berikut membantu memeriksa visual dan gameplay tanpa mengganggu save utama:

- `/pixel-art-check.html` memeriksa atlas karakter, transparansi pixel, dan pratinjau layar kecil.
- `/pixel-game-check.html` memeriksa kamera, map, interior, aktivitas, musuh, peti, audio, fase waktu, transisi tidur, dan gerakan diagonal.

## Struktur singkat

```text
src/main.ts             Scene Phaser, input, map, NPC, combat, aktivitas
src/state.ts            State game, save, waktu, ekonomi, quest, migrasi
src/pixel-art.ts        Atlas dan renderer pixel-art prosedural
src/audio.ts            Audio bus, efek suara, musik, dan kokok ayam
src/state.test.ts       Tes state dan aturan gameplay
public/assets/          Aset visual eksternal
public/audio/           Musik latar
```

## Aset dan atribusi

Fasad rumah menggunakan **Serene Village – revamped – RPG Tileset [16x16]** oleh LimeZu:

- [Halaman aset](https://limezu.itch.io/serenevillagerevamped)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Atribusi juga tersedia di jurnal dalam game. Pastikan hak distribusi musik di `public/audio/music/village.mp3` sesuai sebelum membuat repository ini publik atau mendistribusikan build.

## Status proyek

Versi ini berfokus pada chapter pertama dan loop harian inti. Dialog bercabang dan kontrol sentuh belum tersedia.
