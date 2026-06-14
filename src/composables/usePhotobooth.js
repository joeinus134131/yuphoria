import { ref, reactive } from 'vue';

const isUsingSimulator = ref(false);
const isSessionActive = ref(false);
const capturedPhotos = ref([]);
const totalPhotosNeeded = 4;

const settings = reactive({
  filter: 'normal',
  frameColor: 'obsidian',
  customLabel: '',
  showDate: true
});

const filterMap = {
  normal: 'none',
  vintage: 'sepia(0.5) contrast(1.1) brightness(0.95) saturate(1.1)',
  noir: 'grayscale(1) contrast(1.3) brightness(0.9)',
  cyberpunk: 'hue-rotate(60deg) saturate(1.5) contrast(1.2)',
  chroma: 'saturate(1.8) contrast(1.05) brightness(1.05)'
};

const frameColors = {
  obsidian: { bg: '#0c0a14', text: '#ffffff', textMuted: 'rgba(255,255,255,0.7)', isGradient: false },
  cream: { bg: '#faf6f0', text: '#1a1a1a', textMuted: 'rgba(0,0,0,0.5)', isGradient: false },
  pink: { bg: '#ffd1dc', text: '#6b3e4a', textMuted: 'rgba(107,62,74,0.7)', isGradient: false },
  lavender: { bg: '#e6e6fa', text: '#3d3d5c', textMuted: 'rgba(61,61,92,0.7)', isGradient: false },
  cyber: { 
    bg: ['#ff2e93', '#8b5cf6', '#3b82f6'], 
    text: '#ffffff', 
    textMuted: 'rgba(255,255,255,0.7)', 
    isGradient: true 
  }
};

export function usePhotobooth() {
  const addPhoto = (photoData) => {
    if (capturedPhotos.value.length < totalPhotosNeeded) {
      capturedPhotos.value.push(photoData);
    }
  };

  const resetSession = () => {
    isSessionActive.value = false;
    capturedPhotos.value = [];
  };

  const announceToScreenReader = (message) => {
    const announcer = document.getElementById('status-announcer');
    if (announcer) {
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }
  };

  return {
    isUsingSimulator,
    isSessionActive,
    capturedPhotos,
    totalPhotosNeeded,
    settings,
    filterMap,
    frameColors,
    addPhoto,
    resetSession,
    announceToScreenReader
  };
}
