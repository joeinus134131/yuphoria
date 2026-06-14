<template>
  <div class="glass-card panel-card preview-card-container">
    <h3 class="panel-title">Hasil Cetakan</h3>
    
    <!-- Printer simulation container -->
    <div class="printer-wrapper">
      <div class="printer-slot" aria-hidden="true">
        <div class="printer-glow"></div>
      </div>
      
      <!-- Printable photo strip -->
      <div class="strip-stage" :class="{ 'printing-active': isPrinting }">
        <div id="visual-strip" class="booth-strip" :class="'frame-' + settings.frameColor" :style="frameStyle">
          <!-- 4 photo placeholders -->
          <div class="strip-slots">
            <div v-for="index in 4" :key="index" class="strip-slot" :id="'slot-' + index">
              <img v-if="capturedPhotos[index - 1]" :src="capturedPhotos[index - 1].dataUrl" :class="['captured-image', 'filter-' + settings.filter]" :style="{ filter: filterMap[settings.filter] }" :alt="'Foto Yuphoria ke-' + index" />
              <div v-else class="slot-placeholder">
                <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Strip Footer Branding -->
          <div class="strip-footer">
            <span id="strip-brand-label" class="strip-brand">{{ displayLabel }}</span>
            <span v-if="settings.showDate" id="strip-date-label" class="strip-date">{{ currentDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compilation / Export trigger -->
    <div class="action-footer">
      <button id="download-btn" class="primary-btn full-btn" :disabled="!canDownload" @click="compileAndDownloadStrip">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
        </svg>
        Cetak & Unduh Foto Strip
      </button>
      <p class="export-helper" id="download-btn-helper">{{ downloadHelperText }}</p>
    </div>

    <!-- Hidden Offscreen Canvas for exporting high resolution strip compilation -->
    <canvas ref="exportCanvasRef" id="export-canvas" class="hidden"></canvas>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePhotobooth } from '../composables/usePhotobooth';

const { 
  capturedPhotos, 
  totalPhotosNeeded, 
  settings, 
  filterMap, 
  frameColors,
  announceToScreenReader 
} = usePhotobooth();

const isPrinting = ref(false);
const exportCanvasRef = ref(null);

const canDownload = computed(() => capturedPhotos.value.length === totalPhotosNeeded);

const downloadHelperText = computed(() => {
  return canDownload.value 
    ? 'Sesi foto selesai! Siap untuk mencetak strip memori Anda.' 
    : 'Ambil 4 foto terlebih dahulu untuk mengunduh strip memori Anda.';
});

const displayLabel = computed(() => {
  return settings.customLabel.trim() || 'yuphoria';
});

const currentDate = computed(() => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
});

const frameStyle = computed(() => {
  const frameConf = frameColors[settings.frameColor];
  if (!frameConf) return {};
  if (frameConf.isGradient) {
    return {
      background: `linear-gradient(180deg, ${frameConf.bg[0]} 0%, ${frameConf.bg[1]} 50%, ${frameConf.bg[2]} 100%)`,
      color: frameConf.text
    };
  }
  return {
    backgroundColor: frameConf.bg,
    color: frameConf.text
  };
});

const compileAndDownloadStrip = () => {
  if (!canDownload.value || !exportCanvasRef.value) return;

  announceToScreenReader('Mengekspor foto strip Anda…');

  const exportCanvas = exportCanvasRef.value;
  const exportCtx = exportCanvas.getContext('2d');

  const padding = 32;
  const imgWidth = 400;
  const imgHeight = 300;
  const gap = 24;
  const footerHeight = 120;
  
  const stripWidth = imgWidth + (padding * 2);
  const stripHeight = (imgHeight * 4) + (gap * 3) + (padding * 2) + footerHeight;

  exportCanvas.width = stripWidth;
  exportCanvas.height = stripHeight;

  const frameConf = frameColors[settings.frameColor];

  if (frameConf.isGradient) {
    const grad = exportCtx.createLinearGradient(0, 0, 0, stripHeight);
    grad.addColorStop(0, frameConf.bg[0]);
    grad.addColorStop(0.5, frameConf.bg[1]);
    grad.addColorStop(1, frameConf.bg[2]);
    exportCtx.fillStyle = grad;
  } else {
    exportCtx.fillStyle = frameConf.bg;
  }
  exportCtx.fillRect(0, 0, stripWidth, stripHeight);

  capturedPhotos.value.forEach((photo, idx) => {
    const drawY = padding + (idx * (imgHeight + gap));

    exportCtx.save();
    
    const radius = 6;
    exportCtx.beginPath();
    exportCtx.moveTo(padding + radius, drawY);
    exportCtx.lineTo(padding + imgWidth - radius, drawY);
    exportCtx.quadraticCurveTo(padding + imgWidth, drawY, padding + imgWidth, drawY + radius);
    exportCtx.lineTo(padding + imgWidth, drawY + imgHeight - radius);
    exportCtx.quadraticCurveTo(padding + imgWidth, drawY + imgHeight, padding + imgWidth - radius, drawY + imgHeight);
    exportCtx.lineTo(padding + radius, drawY + imgHeight);
    exportCtx.quadraticCurveTo(padding, drawY + imgHeight, padding, drawY + imgHeight - radius);
    exportCtx.lineTo(padding, drawY + radius);
    exportCtx.quadraticCurveTo(padding, drawY, padding + radius, drawY);
    exportCtx.closePath();
    exportCtx.clip();

    if (settings.filter !== 'normal') {
      exportCtx.filter = filterMap[settings.filter];
    }

    exportCtx.drawImage(photo.source, padding, drawY, imgWidth, imgHeight);

    exportCtx.restore();
  });

  exportCtx.fillStyle = frameConf.text;
  exportCtx.textAlign = 'center';
  exportCtx.textBaseline = 'middle';
  
  exportCtx.font = '800 28px "Outfit", sans-serif';
  const brandY = stripHeight - padding - (footerHeight / 2) - 10;
  exportCtx.fillText(displayLabel.value.toLowerCase(), stripWidth / 2, brandY);

  if (settings.showDate) {
    exportCtx.fillStyle = frameConf.textMuted;
    exportCtx.font = '500 16px "Outfit", sans-serif';
    const dateY = brandY + 28;
    exportCtx.fillText(currentDate.value, stripWidth / 2, dateY);
  }

  triggerPrinterAnimation();

  const exportDataUrl = exportCanvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.href = exportDataUrl;
  downloadLink.download = `yuphoria-strip-${Date.now()}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  announceToScreenReader('Foto strip berhasil diunduh ke perangkat Anda.');
};

const triggerPrinterAnimation = () => {
  isPrinting.value = false;
  setTimeout(() => {
    isPrinting.value = true;
    setTimeout(() => {
      // Keep it displayed at full extension
    }, 2200);
  }, 50);
};
</script>

<style scoped>
.preview-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  width: 100%;
}

.printer-wrapper {
  position: relative;
  width: 100%;
  padding-top: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  height: 480px;
}

.printer-slot {
  position: absolute;
  top: 0;
  left: 10%;
  width: 80%;
  height: 12px;
  background-color: #0f0d1a;
  border-radius: 99px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.8), inset 0 2px 4px #000;
  z-index: 10;
}

.printer-glow {
  position: absolute;
  inset: 0;
  border-radius: 99px;
  background: linear-gradient(90deg, transparent, var(--accent-magenta), transparent);
  opacity: 0.6;
  filter: blur(1px);
  animation: glow-pulse 2s infinite alternate;
}

@keyframes glow-pulse {
  0% { opacity: 0.3; }
  100% { opacity: 0.8; }
}

.strip-stage {
  margin-top: 6px;
  z-index: 5;
  transition: transform var(--transition-slow);
  transform-origin: top center;
  display: flex;
  justify-content: center;
}

.printing-active {
  animation: print-slide-down 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes print-slide-down {
  0% { transform: translateY(-440px) scale(0.9); opacity: 0.2; }
  30% { transform: translateY(-300px) scale(0.95); opacity: 0.8; }
  70% { transform: translateY(-100px) scale(1.0); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.booth-strip {
  width: 180px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

.strip-slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strip-slot {
  width: 100%;
  aspect-ratio: 4/3;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-normal);
}

.frame-cream .strip-slot {
  background-color: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.05);
}

.captured-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.slot-placeholder {
  color: var(--text-secondary);
  opacity: 0.3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.frame-cream .slot-placeholder {
  color: #1a1a1a;
  opacity: 0.25;
}

.placeholder-icon {
  width: 28px;
  height: 28px;
}

.strip-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: var(--font-display);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 8px;
  margin-top: 4px;
}

.frame-cream .strip-footer {
  border-top-color: rgba(0, 0, 0, 0.08);
}

.strip-brand {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-transform: lowercase;
}

.strip-date {
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.7;
}

.action-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.full-btn {
  width: 100%;
}

.export-helper {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
}
</style>
