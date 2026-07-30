# Implementation Plan: Todo Life Dashboard

## Overview

Implementasi dilakukan secara inkremental pada tiga file: `index.html`, `css/style.css`, dan `js/app.js`. Setiap langkah membangun di atas langkah sebelumnya, dimulai dari shell aplikasi, kemudian komponen per komponen, hingga semua bagian terhubung dan teruji.

---

## Tasks

- [x] 1. Buat struktur file dan shell aplikasi
  - Buat file `index.html` dengan markup lengkap: nav 4 item, dan 4 section (`greeting`, `timer`, `todo`, `links`) yang tersembunyi secara default
  - Buat file `css/style.css` dengan CSS custom properties untuk dark mode palette, reset base, layout nav + main content, dan class `.section` / `.section--active`
  - Buat file `js/app.js` dengan blok `DOMContentLoaded`, definisi `AppState`, konstanta `TASKS_KEY` dan `LINKS_KEY`, serta fungsi `showSection(sectionId)` dan registrasi event nav
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2_

  - [x] 1.1 Implementasi markup HTML, CSS shell, dan fungsi `showSection`
    - Buat `index.html`, `css/style.css` (dark mode variables, layout, nav, section visibility), dan inisialisasi `js/app.js` dengan `AppState` dan `showSection`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1_

  - [ ]* 1.2 Tulis property test untuk section exclusivity (Property 1)
    - **Property 1: Section exclusivity**
    - Untuk setiap indeks nav yang valid (0–3), setelah `showSection` dipanggil, tepat satu section memiliki class `section--active`
    - **Validates: Requirements 1.3**

- [x] 2. Implementasi Greeting Section
  - Tambahkan fungsi `getGreeting(hour)`, `formatDate(date)`, `formatTime(date)`, dan `updateGreeting()` ke `js/app.js`
  - Pasang `setInterval` untuk memperbarui greeting setiap detik
  - Tambahkan CSS untuk tampilan clock dan greeting di `css/style.css`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.1 Implementasi `getGreeting`, `formatDate`, `formatTime`, dan `updateGreeting`
    - Tulis keempat fungsi di `js/app.js` dan jalankan `updateGreeting()` serta interval di `DOMContentLoaded`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.2 Tulis property test untuk greeting correctness (Property 2)
    - **Property 2: Greeting correctness for all hours**
    - Untuk setiap integer 0–23, `getGreeting(hour)` mengembalikan string yang tepat sesuai rentang waktu
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**

- [x] 3. Implementasi Focus Timer
  - Tambahkan fungsi `formatCountdown(seconds)`, `startTimer()`, `stopTimer()`, `resetTimer()`, `onTimerComplete()`, dan `playBeep()` ke `js/app.js`
  - Implementasikan alur permission notifikasi di `startTimer()`
  - Tambahkan CSS untuk display timer dan tombol kontrol di `css/style.css`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 3.1 Implementasi `formatCountdown` dan tampilan timer
    - Tulis fungsi `formatCountdown` dan sambungkan ke DOM timer
    - _Requirements: 3.1, 3.3_

  - [ ]* 3.2 Tulis property test untuk countdown formatting (Property 3)
    - **Property 3: Countdown formatting**
    - Untuk setiap integer 0–1500, `formatCountdown` mengembalikan string `MM:SS` dengan zero-padding yang benar
    - **Validates: Requirements 3.3**

  - [x] 3.3 Implementasi `startTimer`, `stopTimer`, `resetTimer`, dan logika notifikasi/audio
    - Tulis keempat fungsi, integrasikan `playBeep()` (Web Audio API) dan Notification API
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 3.4 Tulis property test untuk timer reset idempotence (Property 4)
    - **Property 4: Timer reset idempotence**
    - Untuk state timer apa pun (running/stopped, sisa waktu apa pun), `resetTimer()` selalu menghasilkan `remaining === 1500` dan `isRunning === false`
    - **Validates: Requirements 3.5**

- [x] 4. Checkpoint — Pastikan semua test lulus dan tidak ada error konsol
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi Persistence Module
  - Tambahkan fungsi `persistState()` dan `loadState()` ke `js/app.js`
  - Panggil `loadState()` di awal `DOMContentLoaded`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.1 Implementasi `persistState` dan `loadState`
    - Tulis kedua fungsi dengan try/catch dan fallback ke array kosong
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 5.2 Tulis property test untuk task persistence round-trip (Property 11)
    - **Property 11: Task persistence round-trip**
    - Untuk array Task apa pun, `persistState()` → `loadState()` menghasilkan array yang identik
    - **Validates: Requirements 4.10, 6.4**

  - [ ]* 5.3 Tulis property test untuk link persistence round-trip (Property 15)
    - **Property 15: Link persistence round-trip**
    - Untuk array LinkCard apa pun, `persistState()` → `loadState()` menghasilkan array yang identik
    - **Validates: Requirements 5.7, 6.4**

  - [ ]* 5.4 Tulis property test untuk malformed storage resilience (Property 16)
    - **Property 16: Malformed storage resilience**
    - Untuk string non-JSON apa pun di `tld_tasks`/`tld_links`, `loadState()` menghasilkan array kosong tanpa melempar exception
    - **Validates: Requirements 6.5**

- [x] 6. Implementasi To-Do List Component
  - Tambahkan fungsi `addTask`, `deleteTask`, `toggleTask`, `editTask`, `renderTasks`, `renderTaskItem` ke `js/app.js`
  - Registrasikan event delegation pada `#task-list`
  - Tambahkan CSS untuk task list, item, completed state, dan edit mode di `css/style.css`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 6.1 Implementasi `addTask` dan `renderTasks` / `renderTaskItem`
    - Tulis `addTask` (validasi non-empty, buat Task, panggil `persistState`), `renderTasks`, dan `renderTaskItem`
    - _Requirements: 4.1, 4.2, 4.3, 4.10_

  - [ ]* 6.2 Tulis property test untuk task addition round-trip (Property 5)
    - **Property 5: Task addition round-trip**
    - Untuk setiap non-empty label, setelah `addTask(label)`, task ada di `AppState.tasks` dan di `localStorage`
    - **Validates: Requirements 4.2, 6.2**

  - [ ]* 6.3 Tulis property test untuk empty label rejection (Property 6)
    - **Property 6: Empty label rejection**
    - Untuk string whitespace-only apa pun, `addTask(label)` tidak mengubah panjang `AppState.tasks`
    - **Validates: Requirements 4.3**

  - [x] 6.4 Implementasi `toggleTask`, `deleteTask`, dan `editTask`
    - Tulis ketiga fungsi dengan validasi dan panggilan `persistState`
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 6.5 Tulis property test untuk task completion toggle idempotence (Property 7)
    - **Property 7: Task completion toggle idempotence**
    - Memanggil `toggleTask(id)` dua kali berturut-turut mengembalikan `completed` ke nilai awal
    - **Validates: Requirements 4.4**

  - [ ]* 6.6 Tulis property test untuk completed task rendering (Property 8)
    - **Property 8: Completed task rendering**
    - Untuk setiap task dengan `completed === true`, DOM yang dihasilkan `renderTaskItem` memiliki class yang menandai completion
    - **Validates: Requirements 4.5**

  - [ ]* 6.7 Tulis property test untuk task deletion (Property 9)
    - **Property 9: Task deletion**
    - Untuk list berisi n task, `deleteTask(id)` menghasilkan list n−1 tanpa id tersebut, dan `localStorage` mencerminkan perubahan
    - **Validates: Requirements 4.6, 6.2**

  - [ ]* 6.8 Tulis property test untuk task label update (Property 10)
    - **Property 10: Task label update**
    - Untuk task dan new label non-empty apa pun, `editTask(id, newLabel)` memperbarui label di `AppState.tasks` dan `localStorage` tanpa mengubah task lain
    - **Validates: Requirements 4.8**

- [x] 7. Implementasi Quick Links Component
  - Tambahkan fungsi `addLink`, `deleteLink`, `renderLinks`, `renderLinkCard` ke `js/app.js`
  - Registrasikan event delegation pada kontainer links
  - Tambahkan CSS untuk grid links dan link card di `css/style.css`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 7.1 Implementasi `addLink`, `renderLinks`, dan `renderLinkCard`
    - Tulis `addLink` (validasi kedua field non-empty, buat LinkCard, panggil `persistState`), `renderLinks`, dan `renderLinkCard`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

  - [ ]* 7.2 Tulis property test untuk link addition round-trip (Property 12)
    - **Property 12: Link addition round-trip**
    - Untuk pasangan (name, url) non-empty apa pun, setelah `addLink(name, url)`, card ada di `AppState.links` dan di `localStorage`
    - **Validates: Requirements 5.3, 6.3**

  - [ ]* 7.3 Tulis property test untuk link form validation (Property 13)
    - **Property 13: Link form validation**
    - Untuk pasangan (name, url) di mana setidaknya satu kosong/whitespace, `addLink` tidak mengubah panjang `AppState.links`
    - **Validates: Requirements 5.4**

  - [x] 7.4 Implementasi `deleteLink` dan event delegation
    - Tulis `deleteLink` dan pasang event delegation untuk delete dan klik card (buka URL di tab baru)
    - _Requirements: 5.5, 5.6_

  - [ ]* 7.5 Tulis property test untuk link deletion (Property 14)
    - **Property 14: Link deletion**
    - Untuk list berisi n LinkCard, `deleteLink(id)` menghasilkan list n−1 tanpa id tersebut, dan `localStorage` mencerminkan perubahan
    - **Validates: Requirements 5.6, 6.3**

- [x] 8. Checkpoint — Pastikan semua test lulus dan tidak ada error konsol
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 9. Responsiveness, error handling, dan finishing
  - Tambahkan media queries ke `css/style.css` untuk viewport 320px, 768px, dan 1280px tanpa horizontal scroll
  - Verifikasi semua guard: `'Notification' in window`, `window.AudioContext || window.webkitAudioContext`, localStorage unavailable
  - Pastikan tidak ada network request yang dibuat dan tidak ada console error selama operasi normal
  - _Requirements: 1.6, 1.7, 3.9, 3.10, 6.5, 7.3, 7.4, 7.5_

  - [x] 9.1 Tambahkan responsive CSS dan verifikasi error handling
    - Tulis media queries dan pastikan semua code path error tertangani dengan baik
    - _Requirements: 1.6, 1.7, 6.5, 7.3, 7.4, 7.5_

- [x] 10. Final checkpoint — Pastikan semua test lulus dan aplikasi berjalan sempurna
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

---

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental
- Property test memvalidasi properti kebenaran universal (gunakan `fast-check` atau library sejenis)
- Unit test memvalidasi contoh spesifik dan edge case
- Seluruh kode ditulis dalam Vanilla JavaScript (ES6+), HTML5, dan CSS3 — tanpa framework atau bundler

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5", "6.6", "6.7", "6.8", "7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 9, "tasks": ["7.5", "9.1"] }
  ]
}
```
