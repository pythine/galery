# Gallery Memory — Netlify

Versi ini menggunakan:
- GitHub untuk source code
- Netlify untuk hosting
- Netlify Functions untuk API
- Netlify Blobs untuk menyimpan foto secara persisten

## 1. Upload ke GitHub
Upload semua isi folder ini ke repository GitHub.

## 2. Import ke Netlify
Netlify Dashboard → Add new project → Import an existing project → GitHub → pilih repository.

Build settings:
- Build command: kosongkan
- Publish directory: .
- Functions directory: netlify/functions

netlify.toml sudah disediakan sehingga biasanya Netlify mendeteksi pengaturan tersebut.

## 3. Buat password admin untuk hapus foto
Di Netlify:
Project configuration → Environment variables

Tambahkan:
Name: ADMIN_PASSWORD
Value: buat password rahasia milikmu sendiri

Setelah menambah/mengubah environment variable, lakukan deploy ulang.

## 4. Upload foto
Pengunjung dapat memilih foto → preview → Simpan Foto.
Foto akan disimpan di Netlify Blobs, bukan di browser dan bukan di folder lokal komputer.

## 5. Hapus foto
Tombol 🗑️ meminta password admin. Jangan membagikan password tersebut.

Catatan:
- Maksimum 5 MB per foto pada versi ini.
- Maksimum 20 foto per sekali upload.
- Netlify Blobs cocok untuk file upload sederhana seperti galeri foto.
