# Penjaga Lentera

RPG pixel 2D berbasis Phaser, TypeScript, dan Vite. Jelajahi Desa Embun dan Hutan Bisik, bicara dengan lima NPC, kumpulkan tiga kristal, lawan slime, dan nyalakan lentera untuk menyelesaikan chapter pertama.

## Menjalankan

Memerlukan Node.js 22.18+.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
```

Output produksi berada di `dist/` dan dapat dihosting sebagai situs statis.

## Kontrol

- WASD / panah: bergerak
- Shift: berlari
- 1–6: pilih kapak, beliung, sabit, cangkul, pancing, atau penyiram
- F: gunakan alat pada pohon, batu, semak, atau petak ladang
- E / Enter: interaksi dan lanjut dialog
- Space: serangan ke arah hadap (dua pukulan, atau satu setelah upgrade bengkel)
- H: gunakan ramuan daun untuk memulihkan dua nyawa
- I: buka/tutup inventory; dunia berhenti ketika terbuka
- Esc: jeda dan simpan; tutup percakapan
- Tab / Enter: navigasi tombol menu

Save otomatis ketika progres berubah, berpindah area, jeda, dan meninggalkan halaman. Continue membaca satu slot lokal. Save rusak ditolak. Kalah memulangkan pemain ke desa tanpa kehilangan kristal. Nenek Sari memulihkan nyawa saat quest berlangsung.

## Cakupan versi ini

Satu quest utama dengan ending, desa, pusat kampung, hutan, dua belas interior, delapan warga, tiga kristal, tiga tipe musuh, peti dan ramuan, upgrade pedang, buku lore, tempat tidur, papan petunjuk, api unggun, serta kegiatan berladang, menebang pohon, memecah batu, membersihkan semak, dan memancing. Kolam menghasilkan ikan berbobot 0,2–5,0 kg atau sampah; ikan yang lebih berat bernilai lebih mahal dan dapat dijual kepada Lila. Hasil kerja dan perubahan map tersimpan otomatis.

Tambahan loop harian: enam petak ladang, rumah pemain dan toko, tiga tanaman (lobak/wortel/labu), empat tahap pertumbuhan, tanah basah/kering, belanja benih dan bekal, serta jual panen. Gunakan cangkul untuk menggemburkan lalu menanam benih pilihan, penyiram untuk menyiram, dan cangkul/penyiram untuk panen. Tanaman hanya tumbuh ketika tanah basah; tanah mengering pada pergantian hari.

Papan quest di dekat pusat desa menawarkan empat permintaan harian; kiriman kayu/daun diserahkan langsung ke Raka/Sari. Bengkel menawarkan tiga tingkat peningkatan alat, pedang, tas, dan stamina dengan biaya koin + kayu + batu. Hutan timur berisi slime, kelelawar, penjaga batu, dan peti bernilai lebih besar. Sumber daya, musuh, peti dan permintaan selesai diperbarui setiap hari. Tidur memulai hari berikutnya pukul 06:00 dan memulihkan nyawa serta stamina. Warga bergerak pada siang hari dan pulang saat malam; pencahayaan berubah perlahan.

Pilihan dialog bercabang dan kontrol sentuh belum tersedia.

## Pusat Kampung Embun

Ikuti jalan utama ke **barat/kiri Desa Embun** untuk memasuki map baru. Jalan timurnya kembali ke desa dan ladang. Enam bangunan mempunyai fasad, interior, serta aktivitas: Pasar Tani (belanja/jual), Dapur Bersama (memasak), Peternakan Ayam, Klinik Embun (pemulihan 15 koin), Balai Warga (permintaan harian), dan Tukang Kayu (upgrade). Dekati pintu, tekan E, lalu dekati perabot utama dan tekan E lagi.

Tiga warga baru memberikan petunjuk di alun-alun. Kotak pengiriman di dekat pasar menerima semua panen, ikan, dan telur dari tas; pembayaran masuk otomatis saat hari berganti dan tampil pada pemberitahuan hari baru. Harga telur 15 koin; panen dan ikan mengikuti harga jual biasa.

Ayam menghasilkan satu telur besok bila diberi satu pakan hari ini. Pakan awal tiga, selanjutnya 3 koin per pakan. Elus sekali sehari; keakraban 5/10 meningkatkan hasil menjadi dua telur. Telur menunggu di sarang sampai diambil, termasuk ketika tas penuh. Sup memakai satu sayuran (lobak dahulu, lalu wortel/labu), telur dadar memakai satu telur; memasak membutuhkan tiga tenaga. Masakan memulihkan 45 tenaga dan dapat dimakan melalui jurnal di mana saja. Waktu berhenti selama menu aktivitas terbuka.

Save lama otomatis memperoleh data aktivitas baru tanpa menghapus quest atau inventory. `npm test` memeriksa migrasi, batas tas, pakan harian, hasil telur, resep, klinik, dan pembayaran sekali per kiriman. Tes browser juga memeriksa kedua jalur map, keenam interior baru, akses menu, dan pencahayaan malam pusat kampung.

## Visual pixel

Aset bitmap di `src/pixel-art.ts` memakai koordinat integer dan warna solid. Karakter menggunakan atlas 24×32 dengan empat frame untuk masing-masing dari empat arah. Terrain menggunakan tilemap 16×16; air dan api menggunakan pergantian frame. Perabot, bayangan, dan alat memakai bentuk bertangga. Sebelas fasad rumah memakai potongan atlas Serene Village dari LimeZu, dirender tanpa smoothing pada skala 2×; atribusi lengkap ada di jurnal dalam game dan di bawah.

Kredit aset rumah: **LimeZu, Serene Village - revamped - RPG Tileset [16x16]**, [halaman aset](https://limezu.itch.io/serenevillagerevamped), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Atlas disertakan utuh; sebelas fasad dipilih dengan crop frame dan diperbesar 2×.

Resolusi dasar maksimal 480×320, menyesuaikan area yang tersedia pada layar kecil. Canvas ditampilkan dengan kelipatan bulat dan kamera 1×; posisi fisika tetap presisi, posisi render dibulatkan. Posisi rumah dan format save tidak berubah.

Setelah menjalankan `npm run dev`, buka:

- `/pixel-art-check.html`: memeriksa 144 frame karakter dan transparansi pixel, menampilkan atlas serta pratinjau layar 390 px.
- `/pixel-game-check.html`: pemeriksaan otomatis kamera, enam interior dan pintu keluar, kapak, pancing, tanam–siram–panen–jual, dan variasi musuh/peti. Halaman ini mengembalikan save awal setelah selesai; jalankan tanpa memainkan tab game lain bersamaan.

Kedua halaman pemeriksaan hanya untuk server pengembangan dan tidak dimasukkan ke build produksi.

## Pemeriksaan manual

1. Mulai game, tekan E di dekat Nenek Sari, lanjutkan percakapan hingga quest aktif.
2. Ikuti jalan ke kanan hingga pindah ke hutan; kumpulkan kristal di utara, timur, dan selatan menggunakan E.
3. Hadapi slime dengan Space; pastikan damage, kekalahan, dan respawn menjaga progres.
4. Kembali ke desa, bicara dengan Sari, dan lihat ending serta lencana.
5. Esc, muat ulang halaman, Continue; periksa map, nyawa, inventory, dan quest.
6. Masuki keempat rumah dengan E; uji tempat tidur, buku, landasan, kuali, lalu keluar kembali.
7. Pilih alat dengan 1–4 lalu tekan F di dekat pohon, batu, semak, dan petak ladang; pastikan alat yang salah ditolak dan hasil kerja masuk ke HUD.
8. Pilih pancing dengan 5, tekan F di riak kolam, lalu jual ikan yang didapat kepada Lila; periksa berat, harga, sampah, dan jumlah koin.

## Siklus waktu dan gerakan

Pagi dimulai 06:00, siang 12:00, senja 17:00, dan malam 19:00. Pencahayaan berubah bertahap; interior tetap lebih terang. Kokok ayam sintetis bergaya pixel berbunyi sekali pada perubahan fase dan pergantian hari, mengikuti pengaturan suara serta volume suasana.

Tidur dan tengah malam memakai fade keluar–masuk dengan kontrol terkunci selama transisi. Pengaturan sistem reduced motion mempersingkat fade. Tidur memulihkan kondisi pada pukul 06:00; melewati tengah malam tetap melanjutkan malam, tanpa pemulihan gratis. Gerakan diagonal memiliki kecepatan yang sama dengan arah lurus, mempertahankan pose hadap, dan memakai siluet MC samping tersendiri. Shift mempercepat langkah animasi.

Regresi tambahan di `/pixel-game-check.html`: fase audio, fade tidur/tengah malam, pemulihan kontrol, dan pose/kecepatan diagonal. `npm test` memeriksa batas fase, kesinambungan pencahayaan, dan progres saat hari berganti.

Warga memiliki sprite depan, belakang, dan profil samping dengan aksesori sesuai arah. Ratih, Damar, dan Nina mempunyai palet dan sprite tersendiri. Langkah mengikuti jarak gerak; saat berhenti warga mempertahankan arah hadap terakhir.

Jam dunia, pencahayaan, dan rutinitas warga tetap berjalan selama serangan, penggunaan alat, dan memancing. Kontrol MC terkunci sampai animasi selesai; pause, jurnal, layanan, dan dialog tetap menghentikan dunia.
