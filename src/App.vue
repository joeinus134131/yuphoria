<template>
  <!-- Header -->
  <header class="app-header">
    <div class="header-container">
      <div class="logo-group">
        <span class="logo-dot" aria-hidden="true"></span>
        <h1>yuphoria</h1>
      </div>
      <p class="tagline">Tempat memori indah dicetak dalam satu strip visual.</p>
      <div class="header-actions">
        <a href="/" class="back-link" title="Kembali ke beranda">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Beranda
        </a>
        <button id="theme-toggle" class="icon-btn" aria-label="Ganti mode warna" title="Ganti mode warna" @click="toggleTheme">
          <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Grid Layout -->
  <main id="main-content" class="app-main">
    <div class="main-container">
      
      <!-- Left Column: Camera / Capture Suite -->
      <PhotoBooth />

      <!-- Right Column: Control panel & Live customization strip preview -->
      <section class="control-panel-section" aria-labelledby="customization-heading">
        <h2 id="customization-heading" class="sr-only">Panel Kustomisasi & Hasil</h2>

        <div class="control-grid">
          <!-- Customization Form -->
          <CustomizerPanel />

          <!-- Live strip preview & download -->
          <StripPreview />
        </div>
      </section>

    </div>
  </main>

  <!-- Footer -->
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-left">
        <p>&copy;&nbsp;2026 yuphoria. Dibuat dengan penuh dedikasi estetika dan Vue.js.</p>
      </div>
      <div class="footer-right">
        <nav aria-label="Tautan navigasi sekunder">
          <ul class="footer-links">
            <li><a href="#camera-status-indicator" class="footer-link">Status Studio</a></li>
            <li><a href="/#cara-kerja" class="footer-link">Cara Kerja</a></li>
            <li><a href="#customizer-form" class="footer-link">Atur Filter</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { onMounted } from 'vue';
import PhotoBooth from './components/PhotoBooth.vue';
import CustomizerPanel from './components/CustomizerPanel.vue';
import StripPreview from './components/StripPreview.vue';
import { usePhotobooth } from './composables/usePhotobooth';

const { announceToScreenReader } = usePhotobooth();

const toggleTheme = () => {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('yuphoria-theme', isLight ? 'light' : 'dark');
  announceToScreenReader(isLight ? 'Mengaktifkan mode terang' : 'Mengaktifkan mode gelap');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('yuphoria-theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
  }
});
</script>

<style scoped>
/* App Layout */
.app-header {
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--bg-secondary), 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color var(--transition-normal);
}

.header-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-magenta), var(--accent-purple));
  box-shadow: 0 0 10px var(--accent-magenta);
}

.logo-group h1 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.8rem;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-magenta) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  background: var(--border-color);
  color: var(--accent-magenta);
  font-size: 0.75rem;
  font-family: var(--font-display);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  border: 1px solid rgba(var(--accent-magenta), 0.2);
}

.tagline {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 400;
  display: none;
}

@media (min-width: 768px) {
  .tagline {
    display: block;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid var(--border-color);
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.back-link:hover {
  color: var(--text-primary);
  border-color: rgba(255,255,255,0.18);
  background: var(--bg-tertiary);
}

.sun-icon {
  transition: transform var(--transition-normal);
}
:root.light .sun-icon {
  transform: rotate(180deg);
}

.app-main {
  flex: 1;
  padding: 32px 16px;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
}

.main-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 960px) {
  .main-container {
    grid-template-columns: 1.2fr 1.3fr;
    align-items: start;
  }
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 580px) and (max-width: 959px) {
  .control-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.app-footer {
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  padding: 24px 16px;
  margin-top: 48px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: background-color var(--transition-normal);
}

.footer-container {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

@media (min-width: 768px) {
  .footer-container {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

.footer-links {
  list-style: none;
  display: flex;
  gap: 20px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--accent-magenta);
}
</style>
