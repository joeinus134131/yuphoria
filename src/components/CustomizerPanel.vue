<template>
  <div class="glass-card panel-card">
    <h3 class="panel-title">Kustomisasi Strip</h3>
    
    <form class="customizer-form" @submit.prevent>
      
      <!-- Filter Selectors -->
      <fieldset class="form-group">
        <legend class="form-legend">Pilih Filter Kamera</legend>
        <div class="filter-grid" id="filters-container">
          <label class="filter-option" for="filter-normal">
            <input type="radio" id="filter-normal" value="normal" v-model="settings.filter" @change="announceFilter">
            <span class="filter-preview filter-normal-preview" aria-hidden="true"></span>
            <span class="filter-label">Asli</span>
          </label>
          <label class="filter-option" for="filter-vintage">
            <input type="radio" id="filter-vintage" value="vintage" v-model="settings.filter" @change="announceFilter">
            <span class="filter-preview filter-vintage-preview" aria-hidden="true"></span>
            <span class="filter-label">Vintage</span>
          </label>
          <label class="filter-option" for="filter-noir">
            <input type="radio" id="filter-noir" value="noir" v-model="settings.filter" @change="announceFilter">
            <span class="filter-preview filter-noir-preview" aria-hidden="true"></span>
            <span class="filter-label">Noir</span>
          </label>
          <label class="filter-option" for="filter-cyberpunk">
            <input type="radio" id="filter-cyberpunk" value="cyberpunk" v-model="settings.filter" @change="announceFilter">
            <span class="filter-preview filter-cyberpunk-preview" aria-hidden="true"></span>
            <span class="filter-label">Cyberpunk</span>
          </label>
          <label class="filter-option" for="filter-chroma">
            <input type="radio" id="filter-chroma" value="chroma" v-model="settings.filter" @change="announceFilter">
            <span class="filter-preview filter-chroma-preview" aria-hidden="true"></span>
            <span class="filter-label">Chrome</span>
          </label>
        </div>
      </fieldset>

      <!-- Frame Background Color -->
      <fieldset class="form-group">
        <legend class="form-legend">Pilih Warna Frame</legend>
        <div class="color-grid" id="colors-container">
          <label class="color-option" for="color-obsidian" title="Obsidian Night">
            <input type="radio" id="color-obsidian" value="obsidian" v-model="settings.frameColor" @change="announceColor">
            <span class="color-circle" style="background-color: #0c0a14;" aria-hidden="true"></span>
            <span class="sr-only">Obsidian Night</span>
          </label>
          <label class="color-option" for="color-cream" title="Pearl Cream">
            <input type="radio" id="color-cream" value="cream" v-model="settings.frameColor" @change="announceColor">
            <span class="color-circle" style="background-color: #faf6f0;" aria-hidden="true"></span>
            <span class="sr-only">Pearl Cream</span>
          </label>
          <label class="color-option" for="color-pink" title="Pastel Pink">
            <input type="radio" id="color-pink" value="pink" v-model="settings.frameColor" @change="announceColor">
            <span class="color-circle" style="background-color: #ffd1dc;" aria-hidden="true"></span>
            <span class="sr-only">Pastel Pink</span>
          </label>
          <label class="color-option" for="color-lavender" title="Lavender Glaze">
            <input type="radio" id="color-lavender" value="lavender" v-model="settings.frameColor" @change="announceColor">
            <span class="color-circle" style="background-color: #e6e6fa;" aria-hidden="true"></span>
            <span class="sr-only">Lavender Glaze</span>
          </label>
          <label class="color-option" for="color-cyber" title="Neon Cyberpunk">
            <input type="radio" id="color-cyber" value="cyber" v-model="settings.frameColor" @change="announceColor">
            <span class="color-circle cyberpunk-gradient-bg" aria-hidden="true"></span>
            <span class="sr-only">Neon Cyberpunk Gradient</span>
          </label>
        </div>
      </fieldset>

      <!-- Frame Label customization -->
      <div class="form-group">
        <label for="custom-label-input" class="form-label">Teks Label Frame</label>
        <input type="text" id="custom-label-input" class="text-input" placeholder="Tulis pesan memori di sini…" autocomplete="off" maxlength="32" v-model="settings.customLabel">
        <span class="input-helper">Maksimal 32 karakter untuk bagian bawah strip.</span>
      </div>

      <!-- Extra customization options (e.g. Stickers, Layout style) -->
      <fieldset class="form-group">
        <legend class="form-legend">Pilihan Tata Letak & Tanggal</legend>
        
        <div class="checkbox-group">
          <label class="switch-container" for="show-date-checkbox">
            <input type="checkbox" id="show-date-checkbox" v-model="settings.showDate">
            <span class="switch-slider" aria-hidden="true"></span>
            <span class="switch-text">Tampilkan tanggal saat ini</span>
          </label>
        </div>
      </fieldset>
    </form>
  </div>
</template>

<script setup>
import { usePhotobooth } from '../composables/usePhotobooth';

const { settings, announceToScreenReader } = usePhotobooth();

const announceFilter = () => {
  announceToScreenReader(`Menyematkan filter ${settings.filter}`);
};

const announceColor = () => {
  announceToScreenReader(`Mengubah warna frame menjadi ${settings.frameColor}`);
};
</script>

<style scoped>
.panel-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

/* Forms Styling */
.customizer-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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

/* Filter preview thumbnails */
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

.color-option input[type="radio"]:focus-visible + .color-circle {
  outline: 3px solid var(--border-focus);
  outline-offset: 2px;
}

.cyberpunk-gradient-bg {
  background: linear-gradient(135deg, #ff2e93, #8b5cf6, #3b82f6);
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

.switch-container input:focus-visible + .switch-slider {
  outline: 3px solid var(--border-focus);
  outline-offset: 2px;
}

.switch-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}
</style>
