import { ref, reactive, computed } from 'vue';

const isUsingSimulator = ref(false);
const isSessionActive = ref(false);
const capturedPhotos = ref([]);

const settings = reactive({
  filter: 'normal',
  frameColor: 'obsidian',
  customLabel: '',
  showDate: true,
  theme: 'classic',
  secretMessage: '',
  layout: 'vertical',
  spacing: 'normal',
  borderSize: 'medium',
  photosPerStrip: 4,
  countdown: 3
});

const totalPhotosNeeded = computed(() => {
  return parseInt(settings.photosPerStrip) || 4;
});

const sessionVideoBlob = ref(null);
const sessionVideoBuffer = ref(null);

const stickers = ref([]);

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

const themes = {
  classic: {
    name: 'Classic Black',
    bg: '#0c0a14',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    decorations: []
  },
  minimal: {
    name: 'Minimalist White',
    bg: '#faf6f0',
    color: '#1a1a1a',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    decorations: []
  },
  retro: {
    name: 'Retro Sepia',
    bg: '#f4ede1',
    color: '#5c4033',
    borderColor: '#e3d2be',
    decorations: ['📜']
  },
  neon: {
    name: 'Neon Cyber',
    bg: 'linear-gradient(135deg, #ff2e93 0%, #8b5cf6 50%, #3b82f6 100%)',
    color: '#ffffff',
    borderColor: '#ff2e93',
    decorations: ['⚡', '✨']
  },
  y2k: {
    name: 'Y2K Dream',
    bg: 'linear-gradient(180deg, #ffc0cb 0%, #e6e6fa 100%)',
    color: '#4b0082',
    borderColor: '#ffc0cb',
    decorations: ['🦋', '🌸']
  },
  cottage: {
    name: 'Cottage Core',
    bg: 'linear-gradient(180deg, #d8ecd0 0%, #faf0e6 100%)',
    color: '#2e4a3e',
    borderColor: '#b2cbb1',
    decorations: ['🌿', '🍄']
  },
  spooky: {
    name: 'Spooky Night',
    bg: '#1a0f2e',
    color: '#ff6600',
    borderColor: '#ff6600',
    decorations: ['🎃', '🦇']
  }
};

export function usePhotobooth() {
  const addPhoto = (photoData) => {
    if (capturedPhotos.value.length < totalPhotosNeeded.value) {
      capturedPhotos.value.push(photoData);
    }
  };

  const addSticker = (emoji) => {
    stickers.value.push({
      id: 'sticker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      emoji,
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: 0
    });
  };

  const removeSticker = (id) => {
    stickers.value = stickers.value.filter(s => s.id !== id);
  };

  const clearStickers = () => {
    stickers.value = [];
  };

  const resetSession = () => {
    isSessionActive.value = false;
    capturedPhotos.value = [];
    sessionVideoBlob.value = null;
    sessionVideoBuffer.value = null;
    clearStickers();
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
    sessionVideoBlob,
    sessionVideoBuffer,
    settings,
    stickers,
    filterMap,
    frameColors,
    themes,
    addPhoto,
    addSticker,
    removeSticker,
    clearStickers,
    resetSession,
    announceToScreenReader
  };
}
