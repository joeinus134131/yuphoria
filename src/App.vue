<template>
  <div class="booth-container">
    <!-- Floating theme toggle button in the corner -->
    <button id="theme-toggle" class="floating-theme-toggle" aria-label="Ganti mode warna" title="Ganti mode warna" @click="toggleTheme">
      <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </svg>
    </button>

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

    <!-- Toast Notification -->
    <Transition name="toast-fade">
      <div v-if="toastMessage" class="sync-toast" role="status" aria-live="polite">
        <span class="toast-icon">✨</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import PhotoBooth from './components/PhotoBooth.vue';
import CustomizerPanel from './components/CustomizerPanel.vue';
import StripPreview from './components/StripPreview.vue';
import { usePhotobooth } from './composables/usePhotobooth';

const { announceToScreenReader, isLoggedIn, user } = usePhotobooth();

const toastMessage = ref('');
let toastTimeout = null;

const showToast = (msg) => {
  toastMessage.value = msg;
  announceToScreenReader(msg);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
};

// Watch for authentication state changes and show a welcome toast
watch(isLoggedIn, (newVal, oldVal) => {
  // Only trigger toast if it's a transition (oldVal is defined)
  if (oldVal !== undefined) {
    if (newVal && user.value) {
      showToast(`Akun terhubung! Selamat datang, ${user.value.name}. Fitur premium aktif!`);
    } else if (!newVal) {
      showToast('Mode anonim. Fitur premium dikunci.');
    }
  }
}, { immediate: false });

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
/* Widget Container & Theme Toggle */
.booth-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-primary);
  transition: background-color var(--transition-normal);
}

.floating-theme-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.floating-theme-toggle:hover {
  color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
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



/* Toast Sync Styles */
.sync-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(12, 10, 20, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 99px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
}

.toast-icon {
  font-size: 1rem;
}

.toast-text {
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Toast Transition */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
