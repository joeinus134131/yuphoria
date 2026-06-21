# Evaluasi & Panduan Perbaikan Proyek Yuphoria (Senior Vue.js Developer Perspective)

Dokumen ini berisi hasil analisis mendalam terhadap proyek Yuphoria Photobooth. Berdasarkan standar arsitektur modern Vue 3 (Composition API), optimasi performa web, dan aksesibilitas (WCAG), berikut adalah evaluasi komprehensif beserta solusi perbaikannya.

---

## Ringkasan Evaluasi & Rekomendasi Utama

| No | Area | Masalah Utama | Dampak | Prioritas | Solusi Rekomendasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Performance** | Watcher kompilasi video berjalan otomatis di background saat kustomisasi (tiap stiker bergeser/teks diketik). | CPU spike tinggi, UI stutter/lag di perangkat mobile. | **Tinggi (Critical)** | Ubah ke **On-Demand Compilation** saat tombol unduh ditekan. |
| **2** | **Stability** | Tidak ada mekanisme pembatalan (*cancellation*) untuk canvas recording yang sedang berjalan. | Race conditions, memori bocor, glitch visual jika sesi di-reset tengah jalan. | **Tinggi** | Terapkan **Compilation ID / Token** untuk mematikan loop lama. |
| **3** | **Efficiency** | Alur konversi Canvas -> base64 -> Uint8Array -> charCode loop -> base64 sangat berbelit. | Pemborosan memori, potensi *stack overflow* pada file besar. | **Sedang** | Gunakan **Native Asynchronous APIs** (`toBlob`, `ArrayBuffer`, `FileReader`). |
| **4** | **Accessibility** | Event `@click.prevent` pada label pilihan warna memblokir input radio; button kustomisasi tidak memiliki aria state. | Pengguna keyboard/screen reader tidak bisa mengubah kustomisasi. | **Tinggi** | Bind `v-model` pada radio asli; lengkapi `aria-pressed` & `aria-checked`. |
| **5** | **DX / Types** | Kode JavaScript polos tanpa dokumentasi tipe data parameter. | Rawan bug saat refactoring data (misal stiker/settings). | **Rendah** | Tambahkan dokumentasi **JSDoc Types**. |

---

## Analisis & Panduan Perbaikan Kode

### 1. Masalah Performa: Kompilasi Background yang Berlebihan
Di [StripPreview.vue](file:///Users/user/yuphoria/src/components/StripPreview.vue), watcher berikut berjalan secara mendalam (`deep: true`):
```javascript
watch([capturedPhotos, settings, stickers], () => {
  if (capturedPhotos.value.length === totalPhotosNeeded.value) {
    clearTimeout(compileTimeout);
    compileTimeout = setTimeout(() => {
      compileMotionPhotoVideo();
    }, 800);
  }
}, { deep: true, immediate: true });
```
Karena mendeteksi seluruh perubahan stiker (termasuk koordinat `x` & `y` saat digeser) dan ketukan karakter pada input teks, browser akan terus-menerus mencoba merender video berdurasi 4 detik secara real-time.

#### Saran Perbaikan:
Hapus watch background ini secara total. Jalankan kompilasi secara asinkron tepat saat pengguna menekan tombol "Unduh Strip" dengan visual feedback berupa loading/processing spinner.

---

### 2. Masalah Stabilitas: Penanganan Race Conditions pada Canvas Recording
Fungsi `compile4StripVideo` berjalan dalam interval `requestAnimationFrame` selama 4 detik. Jika pengguna menekan tombol **"Ulangi"** (retake) saat kompilasi berjalan, interval ini tidak dihentikan dan terus merender di memory, yang berpotensi bentrok dengan sesi rendering berikutnya.

#### Saran Perbaikan:
Masukkan parameter `compilationId` ke dalam fungsi rekaman dan periksa kesesuaian ID di setiap frame:
```javascript
// Di dalam loop drawFrame()
const drawFrame = () => {
  if (compilationId !== currentCompilationId.value) {
    cleanup(); // Hentikan segera jika sudah dibatalkan
    return;
  }
  // ... sisa logika rendering
}
```

---

### 3. Masalah Efisiensi: Optimasi Alur Konversi Buffer
Alur ekspor saat ini sangat membebani memori karena melakukan *round-trip* konversi base64 dan decoding manual secara berulang.

#### Saran Perbaikan:
Gunakan browser APIs yang bersih dan non-blocking:

```javascript
// 1. Dapatkan jpegBuffer secara asinkron dari canvas
const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.90));
const jpegBuffer = new Uint8Array(await blob.arrayBuffer());

// 2. Hubungkan dengan videoBuffer (Motion Photo)
const finalBuffer = createMotionPhotoSync(jpegBuffer, compiledVideoBuffer.value, compiledVideoMimeType.value);

// 3. Konversi hasil akhir ke Base64 secara asinkron untuk postMessage
const finalBlob = new Blob([finalBuffer], { type: 'image/jpeg' });
const reader = new FileReader();
reader.readAsDataURL(finalBlob);
reader.onloadend = () => {
  const dataUrl = reader.result;
  // trigger unduh dan postMessage dengan aman
};
```

---

### 4. Masalah Aksesibilitas: Keyboard Navigation & Screen Readers
Pada [CustomizerPanel.vue](file:///Users/user/yuphoria/src/components/CustomizerPanel.vue), pembungkus label warna menangkap klik dan menghentikan behavior default:
```vue
<label class="color-option" @click.prevent="setColor(name)">
  <input type="radio" :checked="settings.frameColor === name">
  ...
</label>
```
Hal ini merusak navigasi keyboard. Pengguna tidak bisa memilih warna menggunakan tombol arah (Arrow keys) atau Space/Enter.

#### Saran Perbaikan:
Ganti dengan model native input binding:
```vue
<label class="color-option" :for="'color-' + name">
  <input 
    type="radio" 
    :id="'color-' + name" 
    :value="name" 
    v-model="settings.frameColor"
    @change="announceColor"
  >
  <span class="color-circle" ...></span>
</label>
```

Tambahkan pula status ARIA untuk elemen button terpilih:
```vue
<!-- Contoh untuk tombol layout -->
<button 
  v-for="lay in layouts" 
  :key="lay.value"
  class="setup-btn"
  :aria-pressed="settings.layout === lay.value ? 'true' : 'false'"
  @click="setLayout(lay.value)"
>
```

---

## Cara Mengeksekusi Perbaikan

Saya telah menyiapkan implementasi kode yang sudah dioptimasi berdasarkan rekomendasi di atas. Anda bisa menginstruksikan saya untuk langsung mengganti kode pada file bersangkutan, atau menggunakan instruksi git diff di bawah jika Anda ingin mereview perubahannya terlebih dahulu.

### File yang Perlu Diupdate:
1. `src/components/StripPreview.vue` -> Optimasi kompilasi on-demand, penanganan file asinkron, dan pencegahan race conditions.
2. `src/components/CustomizerPanel.vue` -> Perbaikan keyboard accessibility (a11y) pada pilihan warna dan elemen tombol kustomisasi.
