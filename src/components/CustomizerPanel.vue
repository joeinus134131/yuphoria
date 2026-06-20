<template>
  <div class="glass-card panel-card" id="customizer-form">
    <div class="tabs-header">
      <button 
        v-for="tab in tabItems" 
        :key="tab.value"
        class="tab-btn" 
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="tab-content">
      <!-- FILTERS TAB -->
      <div v-if="activeTab === 'filters'" class="tab-pane animate-fade-in">
        <fieldset class="form-group">
          <legend class="form-legend">Pilih Filter Kamera</legend>
          <div class="filter-grid" id="filters-container">
            <label v-for="(val, name) in filterMapLabels" :key="name" class="filter-option" :for="'filter-' + name">
              <input type="radio" :id="'filter-' + name" :value="name" v-model="settings.filter" @change="announceFilter">
              <span class="filter-preview" :class="'filter-' + name + '-preview'" aria-hidden="true"></span>
              <span class="filter-label">{{ val }}</span>
            </label>
          </div>
        </fieldset>
      </div>

      <!-- THEMES TAB -->
      <div v-if="activeTab === 'themes'" class="tab-pane animate-fade-in">
        <fieldset class="form-group">
          <legend class="form-legend">Pilih Tema Strip</legend>
          <div class="theme-grid">
            <button 
              v-for="(t, key) in themes" 
              :key="key"
              class="theme-btn"
              :class="{ active: settings.theme === key, 'theme-locked-btn': isThemeLocked(key) }"
              :style="{ background: t.bg, color: t.color, borderColor: t.borderColor }"
              @click="setTheme(key)"
            >
              {{ t.name }}
              <span v-if="isThemeLocked(key)" class="premium-lock" title="Fitur Premium">🔒</span>
              <span v-else-if="t.decorations.length > 0" class="theme-badge">{{ t.decorations[0] }}</span>
            </button>
          </div>
        </fieldset>

        <!-- Dynamic Frame Color (visible only if theme is 'classic' or 'minimal') -->
        <fieldset v-if="settings.theme === 'classic' || settings.theme === 'minimal'" class="form-group margin-top-lg">
          <legend class="form-legend">Pilih Warna Frame</legend>
          <div class="color-grid" id="colors-container">
            <label 
              v-for="(colorConf, name) in frameColors" 
              :key="name" 
              class="color-option" 
              :for="'color-' + name" 
              :title="name"
              @click.prevent="setColor(name)"
            >
              <input 
                type="radio" 
                :id="'color-' + name" 
                :value="name" 
                :checked="settings.frameColor === name"
              >
              <span class="color-circle" :class="{ 'cyberpunk-gradient-bg': colorConf.isGradient }" :style="!colorConf.isGradient ? { backgroundColor: colorConf.bg } : {}" aria-hidden="true"></span>
              <span v-if="isColorLocked(name)" class="premium-lock-color">🔒</span>
              <span class="sr-only">{{ name }}</span>
            </label>
          </div>
        </fieldset>
      </div>

      <!-- STICKERS TAB -->
      <div v-if="activeTab === 'stickers'" class="tab-pane animate-fade-in">
        <fieldset class="form-group">
          <legend class="form-legend">Klik Stiker untuk Menambahkan</legend>
          <p class="section-desc">Posisikan, putar, dan ubah ukuran stiker langsung pada strip foto di sebelah kanan.</p>
          <div class="stickers-grid">
            <button 
              v-for="emoji in availableEmojis" 
              :key="emoji"
              class="sticker-picker-btn"
              @click="addStickerToStrip(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
          <button v-if="stickers.length > 0" class="secondary-btn clear-stickers-btn" @click="clearStickers">
            Hapus Semua Stiker
          </button>
        </fieldset>
      </div>

      <!-- TEXT & MESSAGE TAB -->
      <div v-if="activeTab === 'text'" class="tab-pane animate-fade-in">
        <div class="form-group">
          <label for="custom-label-input" class="form-label">Teks Label Frame</label>
          <input type="text" id="custom-label-input" class="text-input" placeholder="Tulis pesan memori di sini…" autocomplete="off" maxlength="32" v-model="settings.customLabel">
          <span class="input-helper">Maksimal 32 karakter untuk bagian bawah strip.</span>
        </div>

        <div class="form-group margin-top-md">
          <label for="secret-message-input" class="form-label">Pesan Rahasia (Balik Strip) 💌</label>
          <textarea id="secret-message-input" class="text-input textarea-input" rows="3" placeholder="Tulis pesan rahasia di balik cetakan foto…" v-model="settings.secretMessage"></textarea>
          <span class="input-helper">Pesan ini akan terlihat di bagian belakang saat Anda membalik strip foto.</span>
        </div>

        <fieldset class="form-group margin-top-md">
          <legend class="sr-only">Pilihan Tata Letak & Tanggal</legend>
          <div class="checkbox-group">
            <label class="switch-container" for="show-date-checkbox">
              <input type="checkbox" id="show-date-checkbox" v-model="settings.showDate">
              <span class="switch-slider" aria-hidden="true"></span>
              <span class="switch-text">Tampilkan tanggal saat ini</span>
            </label>
          </div>
        </fieldset>
      </div>

      <!-- SETUP TAB -->
      <div v-if="activeTab === 'setup'" class="tab-pane animate-fade-in">
        <fieldset class="form-group">
          <legend class="form-legend">Tata Letak Strip (Layout)</legend>
          <div class="setup-grid">
            <button 
              v-for="lay in layouts" 
              :key="lay.value"
              class="setup-btn"
              :class="{ active: settings.layout === lay.value }"
              @click="setLayout(lay.value)"
            >
              <span class="setup-icon" v-html="lay.icon"></span>
              <span class="setup-label">{{ lay.label }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="form-group margin-top-md">
          <legend class="form-legend">Jumlah Foto per Strip</legend>
          <div class="btn-segmented">
            <button 
              v-for="num in photoCountOptions" 
              :key="num.value"
              class="segmented-btn"
              :class="{ active: settings.photosPerStrip === num.value }"
              @click="setPhotosPerStrip(num.value)"
            >
              {{ num.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="form-group margin-top-md">
          <legend class="form-legend">Waktu Hitung Mundur (Countdown)</legend>
          <div class="btn-segmented">
            <button 
              v-for="sec in countdownOptions" 
              :key="sec.value"
              class="segmented-btn"
              :class="{ active: settings.countdown === sec.value }"
              @click="setCountdown(sec.value)"
            >
              {{ sec.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="form-group margin-top-md">
          <legend class="form-legend">Jarak Antar Foto (Spacing)</legend>
          <div class="btn-segmented">
            <button 
              v-for="sp in spacingOptions" 
              :key="sp.value"
              class="segmented-btn"
              :class="{ active: settings.spacing === sp.value }"
              @click="setSpacing(sp.value)"
            >
              {{ sp.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="form-group margin-top-md">
          <legend class="form-legend">Ukuran Border Frame</legend>
          <div class="btn-segmented">
            <button 
              v-for="bd in borderOptions" 
              :key="bd.value"
              class="segmented-btn"
              :class="{ active: settings.borderSize === bd.value }"
              @click="setBorderSize(bd.value)"
            >
              {{ bd.label }}
            </button>
          </div>
        </fieldset>
      </div>
    </div>

    <!-- Dialog for unlocking premium features -->
    <div v-if="showPrompt" class="unlock-overlay">
      <div class="unlock-dialog">
        <div class="unlock-emoji">✦</div>
        <h4>Tema Premium Terkunci</h4>
        <p>Masuk atau daftarkan akun gratis sekarang untuk membuka semua tema estetik & frame gradient secara gratis selamanya!</p>
        <div class="unlock-actions">
          <button class="btn-unlock-confirm" @click="requestAuth">Masuk / Daftar Gratis</button>
          <button class="btn-unlock-cancel" @click="showPrompt = false">Kembali</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePhotobooth } from '../composables/usePhotobooth';

const { 
  settings, 
  stickers, 
  themes, 
  frameColors, 
  isLoggedIn,
  addSticker, 
  clearStickers, 
  announceToScreenReader 
} = usePhotobooth();

const activeTab = ref('filters');

const premiumThemes = ['neon', 'y2k', 'cottage', 'spooky'];
const premiumColors = ['cyber'];

const showPrompt = ref(false);

const isThemeLocked = (themeKey) => {
  return premiumThemes.includes(themeKey) && !isLoggedIn.value;
};

const isColorLocked = (colorName) => {
  return premiumColors.includes(colorName) && !isLoggedIn.value;
};

const requestAuth = () => {
  window.parent.postMessage({ type: 'yuphoria:open-auth', tab: 'register' }, '*');
  showPrompt.value = false;
};

const tabItems = [
  { value: 'filters', label: 'Filter' },
  { value: 'themes', label: 'Tema' },
  { value: 'stickers', label: 'Stiker' },
  { value: 'text', label: 'Teks' },
  { value: 'setup', label: 'Setup' }
];

const filterMapLabels = {
  normal: 'Asli',
  vintage: 'Vintage',
  noir: 'Noir',
  cyberpunk: 'Cyberpunk',
  chroma: 'Chrome'
};

const availableEmojis = [
  '✨', '🔥', '💖', '💅', '🥺', '🦋', 
  '🌿', '🎃', '🦇', '👻', '🌸', '⚡', 
  '💎', '🍒', '🦕', '🍦', '🍩', '🍕'
];

const layouts = [
  { 
    value: 'vertical', 
    label: 'Vertikal', 
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="1.5"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="17" x2="17" y2="17"/></svg>`
  },
  { 
    value: '2x2', 
    label: 'Grid (2x2)', 
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`
  },
  { 
    value: 'row', 
    label: 'Baris', 
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="1.5"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/></svg>`
  }
];

const photoCountOptions = [
  { value: 1, label: '1 Foto' },
  { value: 2, label: '2 Foto' },
  { value: 3, label: '3 Foto' },
  { value: 4, label: '4 Foto' }
];

const countdownOptions = [
  { value: 3, label: '3 Detik' },
  { value: 4, label: '4 Detik' },
  { value: 5, label: '5 Detik' }
];

const spacingOptions = [
  { value: 'tight', label: 'Rapat' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Lebar' }
];

const borderOptions = [
  { value: 'thin', label: 'Tipis' },
  { value: 'medium', label: 'Sedang' },
  { value: 'thick', label: 'Tebal' }
];

const setTheme = (themeKey) => {
  if (isThemeLocked(themeKey)) {
    showPrompt.value = true;
    return;
  }
  settings.theme = themeKey;
  
  if (themeKey === 'classic') {
    settings.frameColor = 'obsidian';
  } else if (themeKey === 'minimal') {
    settings.frameColor = 'cream';
  }
  
  announceToScreenReader(`Mengubah tema menjadi ${themes[themeKey].name}`);
};

const setColor = (colorName) => {
  if (isColorLocked(colorName)) {
    showPrompt.value = true;
    return;
  }
  settings.frameColor = colorName;
  announceColor();
};

const addStickerToStrip = (emoji) => {
  addSticker(emoji);
  announceToScreenReader(`Menambahkan stiker ${emoji} ke foto strip`);
};

const announceFilter = () => {
  announceToScreenReader(`Menyematkan filter ${settings.filter}`);
};

const announceColor = () => {
  announceToScreenReader(`Mengubah warna frame menjadi ${settings.frameColor}`);
};

const setLayout = (layoutVal) => {
  settings.layout = layoutVal;
  announceToScreenReader(`Mengubah tata letak strip menjadi ${layoutVal}`);
};

const setPhotosPerStrip = (val) => {
  settings.photosPerStrip = val;
  announceToScreenReader(`Mengubah jumlah foto per strip menjadi ${val}`);
};

const setCountdown = (val) => {
  settings.countdown = val;
  announceToScreenReader(`Mengubah waktu hitung mundur menjadi ${val} detik`);
};

const setSpacing = (spacingVal) => {
  settings.spacing = spacingVal;
  announceToScreenReader(`Mengubah jarak antar foto menjadi ${spacingVal}`);
};

const setBorderSize = (borderVal) => {
  settings.borderSize = borderVal;
  announceToScreenReader(`Mengubah ukuran border frame menjadi ${borderVal}`);
};
</script>

<style scoped>
.panel-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 400px;
}

/* Tab Header Navigation */
.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  gap: 4px;
  margin-bottom: 8px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 12px 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.tab-btn:hover {
  color: var(--text-primary);
  border-bottom-color: rgba(255, 46, 147, 0.4);
}

.tab-btn.active {
  color: var(--accent-magenta);
  border-bottom-color: var(--accent-magenta);
}

/* Tab Pane Transitions */
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: -8px;
  line-height: 1.4;
}

/* Forms Styling */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: none;
}

.form-legend, .form-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

/* Filter Grid Selection */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.filter-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
}

.filter-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.filter-preview {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: #2b2b2b;
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.filter-option:hover .filter-preview {
  transform: scale(1.05);
}

.filter-option input[type="radio"]:checked + .filter-preview {
  border-color: var(--accent-magenta);
  box-shadow: 0 0 10px var(--accent-glow);
}

.filter-option input[type="radio"]:focus-visible + .filter-preview {
  outline: 3px solid var(--border-focus);
}

.filter-normal-preview { background: #3b3a42; }
.filter-vintage-preview { background: #b89c74; }
.filter-noir-preview { background: #888888; }
.filter-cyberpunk-preview { background: linear-gradient(135deg, #ff2e93, #8b5cf6); }
.filter-chroma-preview { background: #a6c0fe; }

.filter-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  transition: color var(--transition-fast);
}

.filter-option input[type="radio"]:checked ~ .filter-label {
  color: var(--accent-magenta);
  font-weight: 700;
}

/* Theme Selector Grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.theme-btn {
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  padding: 14px 10px;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-btn:hover {
  transform: translateY(-2px);
}

.theme-btn.active {
  border-width: 2px;
  box-shadow: 0 0 16px rgba(255, 46, 147, 0.4);
  transform: scale(1.02);
}

.theme-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 1rem;
  background: var(--bg-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

/* Color Circle Grid */
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-option {
  position: relative;
  cursor: pointer;
}

.color-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.color-circle {
  display: block;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.color-option:hover .color-circle {
  transform: scale(1.1);
}

.color-option input[type="radio"]:checked + .color-circle {
  border-color: var(--accent-magenta);
  box-shadow: 0 0 12px var(--accent-glow);
  transform: scale(1.05);
}

.cyberpunk-gradient-bg {
  background: linear-gradient(135deg, #ff2e93, #8b5cf6, #3b82f6);
}

/* Stickers Picker Grid */
.stickers-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  background: rgba(0, 0, 0, 0.15);
  padding: 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.sticker-picker-btn {
  font-size: 1.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.sticker-picker-btn:hover {
  transform: scale(1.25) rotate(5deg);
}

.clear-stickers-btn {
  margin-top: 10px;
  width: 100%;
  font-size: 0.8rem;
  padding: 10px;
}

/* Text Input Styling */
.text-input {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
}

.textarea-input {
  resize: none;
  min-height: 80px;
}

.text-input:focus {
  border-color: var(--accent-magenta);
  box-shadow: 0 0 8px var(--accent-glow);
}

.input-helper {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Setup Styles */
.setup-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.setup-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  padding: 12px 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.setup-btn:hover {
  color: var(--text-primary);
  border-color: rgba(255, 46, 147, 0.4);
}

.setup-btn.active {
  color: var(--accent-magenta);
  border-color: var(--accent-magenta);
  background: rgba(255, 46, 147, 0.05);
}

.setup-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.setup-label {
  font-size: 0.7rem;
  font-weight: 700;
}

.btn-segmented {
  display: flex;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 2px;
  width: 100%;
}

.segmented-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  text-align: center;
}

.segmented-btn:hover {
  color: var(--text-primary);
}

.segmented-btn.active {
  background: var(--accent-magenta);
  color: #fff;
}

/* Custom switch toggle */
.switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
}

.switch-container input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  width: 44px;
  height: 24px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 99px;
  position: relative;
  transition: background-color var(--transition-fast);
}

.switch-slider::before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.switch-container input:checked + .switch-slider {
  background-color: rgba(139, 92, 246, 0.2);
  border-color: var(--accent-purple);
}

.switch-container input:checked + .switch-slider::before {
  transform: translateX(20px);
  background-color: var(--accent-purple);
}

.switch-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Helper Utilities */
.margin-top-md { margin-top: 14px; }
.margin-top-lg { margin-top: 20px; }

/* Premium Lock Overlay & Dialog Styles */
.premium-lock {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid rgba(255, 46, 147, 0.4);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.premium-lock-color {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 0.65rem;
  background: var(--bg-primary);
  border: 1px solid rgba(255, 46, 147, 0.4);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 2;
}

.theme-locked-btn {
  opacity: 0.75;
  filter: grayscale(0.2);
}

.unlock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(12, 10, 20, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: inherit;
  animation: fadeIn 0.2s ease-out;
}

.unlock-dialog {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  padding: 24px;
  width: 90%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.unlock-emoji {
  font-size: 2rem;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--accent-magenta), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  animation: bounce 2s infinite;
}

.unlock-dialog h4 {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.unlock-dialog p {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
}

.unlock-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-unlock-confirm {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-magenta));
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.btn-unlock-confirm:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.btn-unlock-cancel {
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 0.85rem;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
}

.btn-unlock-cancel:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

@keyframes scaleUp {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
</style>
