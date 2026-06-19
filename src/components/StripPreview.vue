<template>
  <div class="glass-card panel-card preview-card-container">
    <h3 class="panel-title">Hasil Cetakan</h3>
    
    <!-- Printer simulation container -->
    <div class="printer-wrapper">
      <div class="printer-slot" aria-hidden="true">
        <div class="printer-glow"></div>
      </div>
      
      <!-- Printable photo strip with 3D Card Flip -->
      <div class="strip-stage" :class="{ 'printing-active': isPrinting }">
        <div class="flip-container" :class="{ 'is-flipped': isFlipped }" :style="containerDimensions">
          <div class="flipper">
            
            <!-- FRONT SIDE: The Photo Strip -->
            <div id="visual-strip" class="booth-strip front" :class="[stripLayoutClass]" :style="frameStyle">
              
              <!-- Draggable stickers container overlay -->
              <div class="stickers-overlay">
                <div 
                  v-for="sticker in stickers" 
                  :key="sticker.id"
                  class="draggable-sticker"
                  :style="{
                    left: sticker.x + '%',
                    top: sticker.y + '%',
                    transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`
                  }"
                  @mousedown="startDrag($event, sticker)"
                  @touchstart="startDrag($event, sticker)"
                >
                  <span class="sticker-emoji">{{ sticker.emoji }}</span>
                  <button class="delete-sticker-btn" @click.stop="removeSticker(sticker.id)" title="Hapus">×</button>
                  
                  <!-- Scale and rotate controls visible on hover -->
                  <div class="sticker-controls" @mousedown.stop @touchstart.stop>
                    <button class="control-btn" @click.stop="resizeSticker(sticker, 0.1)" title="Perbesar">+</button>
                    <button class="control-btn" @click.stop="resizeSticker(sticker, -0.1)" title="Perkecil">-</button>
                    <button class="control-btn" @click.stop="rotateSticker(sticker, 15)" title="Putar">↻</button>
                  </div>
                </div>
              </div>

              <!-- Theme specific decorations -->
              <div class="theme-decorations" v-if="currentTheme.decorations && currentTheme.decorations.length > 0">
                <span class="decor-1">{{ currentTheme.decorations[0] }}</span>
                <span class="decor-2" v-if="currentTheme.decorations.length > 1">{{ currentTheme.decorations[1] }}</span>
              </div>

              <!-- Photo slots -->
              <div class="strip-slots">
                <div v-for="index in totalPhotosNeeded" :key="index" class="strip-slot" :id="'slot-' + index">
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

            <!-- BACK SIDE: Secret Message -->
            <div class="booth-strip back" :class="[stripLayoutClass]" :style="frameStyle">
              <div class="back-content" :class="{ 'layout-row-back': settings.layout === 'row' }">
                <div class="back-header">
                  <span class="back-heart">💌</span>
                  <h4>Pesan Rahasia</h4>
                </div>
                
                <div class="secret-text-box">
                  <p v-if="settings.secretMessage">{{ settings.secretMessage }}</p>
                  <p v-else class="empty-message">Tulis pesan rahasia di tab 'Teks' untuk ditampilkan di sini.</p>
                </div>
                
                <div class="back-footer">
                  <span>yuphoria memory card</span>
                  <span>© 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Compilation / Export trigger -->
    <div class="action-footer">
      <button class="secondary-btn full-btn" @click="toggleFlip">
        {{ isFlipped ? 'Lihat Foto Strip' : 'Lihat Pesan Rahasia 🔄' }}
      </button>
      
      <button id="download-btn" class="primary-btn full-btn margin-top-sm" :disabled="!canDownload" @click="compileAndDownloadStrip">
        <svg v-if="!isCompilingVideo" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
        </svg>
        <span v-else class="spinner-btn" aria-hidden="true"></span>
        {{ isCompilingVideo ? 'Memproses Motion Photo…' : 'Cetak & Unduh Foto Strip' }}
      </button>
      <p class="export-helper" id="download-btn-helper">{{ downloadHelperText }}</p>
    </div>

    <!-- Hidden Offscreen Canvas for exporting high resolution strip compilation -->
    <canvas ref="exportCanvasRef" id="export-canvas" class="hidden"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { usePhotobooth } from '../composables/usePhotobooth';

const { 
  capturedPhotos, 
  totalPhotosNeeded, 
  settings, 
  stickers,
  filterMap, 
  frameColors,
  themes,
  removeSticker,
  announceToScreenReader 
} = usePhotobooth();

const isPrinting = ref(false);
const isFlipped = ref(false);
const exportCanvasRef = ref(null);

const canDownload = computed(() => capturedPhotos.value.length === totalPhotosNeeded.value);

const downloadHelperText = computed(() => {
  return canDownload.value 
    ? 'Sesi foto selesai! Siap untuk mencetak strip memori Anda.' 
    : `Ambil ${totalPhotosNeeded.value} foto terlebih dahulu untuk mengunduh strip memori Anda.`;
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

const currentTheme = computed(() => {
  return themes[settings.theme] || themes.classic;
});

const stripLayoutClass = computed(() => {
  return `layout-${settings.layout} spacing-${settings.spacing} border-${settings.borderSize}`;
});

const containerDimensions = computed(() => {
  const count = totalPhotosNeeded.value;
  if (settings.layout === 'vertical') {
    const h = (count * 80) + 120;
    return { width: '180px', height: `${h}px` };
  } else if (settings.layout === '2x2') {
    const rows = Math.ceil(count / 2);
    const h = (rows * 110) + 110;
    return { width: '280px', height: `${h}px` };
  } else if (settings.layout === 'row') {
    const w = (count * 90) + 80;
    return { width: `${w}px`, height: '180px' };
  }
  return { width: '180px', height: '440px' };
});

const frameStyle = computed(() => {
  const t = currentTheme.value;
  let style = {
    fontFamily: t.font || 'var(--font-display)',
    color: t.color
  };
  
  if (settings.theme === 'classic' || settings.theme === 'minimal') {
    const frameConf = frameColors[settings.frameColor] || frameColors.obsidian;
    if (frameConf.isGradient) {
      style.background = `linear-gradient(180deg, ${frameConf.bg[0]} 0%, ${frameConf.bg[1]} 50%, ${frameConf.bg[2]} 100%)`;
      style.color = frameConf.text;
      style.borderColor = frameConf.textMuted;
    } else {
      style.backgroundColor = frameConf.bg;
      style.color = frameConf.text;
      style.borderColor = settings.theme === 'classic' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    }
  } else {
    style.background = t.bg;
    style.borderColor = t.borderColor;
  }
  
  return style;
});

const isCompilingVideo = ref(false);
const compiledVideoBuffer = ref(null);
const compiledVideoMimeType = ref('video/mp4');
let activeVideos = [];

// Drag and drop handlers
const startDrag = (event, sticker) => {
  event.preventDefault();
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  
  const startX = clientX;
  const startY = clientY;
  
  const initialX = sticker.x;
  const initialY = sticker.y;
  
  const stripElement = document.getElementById('visual-strip');
  if (!stripElement) return;
  
  const rect = stripElement.getBoundingClientRect();
  
  const onMouseMove = (moveEvent) => {
    const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
    
    const deltaX = ((moveX - startX) / rect.width) * 100;
    const deltaY = ((moveY - startY) / rect.height) * 100;
    
    sticker.x = Math.max(5, Math.min(95, initialX + deltaX));
    sticker.y = Math.max(5, Math.min(95, initialY + deltaY));
  };
  
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('touchmove', onMouseMove);
  document.addEventListener('touchend', onMouseUp);
};

const resizeSticker = (sticker, amount) => {
  sticker.scale = Math.max(0.5, Math.min(3.0, sticker.scale + amount));
};

const rotateSticker = (sticker, amount) => {
  sticker.rotation = (sticker.rotation + amount) % 360;
};

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value;
  announceToScreenReader(isFlipped.value ? 'Membalik foto strip untuk membaca pesan rahasia' : 'Membalik foto strip ke halaman utama');
};

const getCanvasParams = (layout, spacing, borderSize) => {
  const imgWidth = 400;
  const imgHeight = 300;
  const photosCount = totalPhotosNeeded.value;
  
  const padding = borderSize === 'thin' ? 16 
                : borderSize === 'thick' ? 48 
                : 32; 
                
  const gap = spacing === 'tight' ? 8 
            : spacing === 'wide' ? 40 
            : 20; 
            
  let stripWidth = 0;
  let stripHeight = 0;
  const photoPositions = [];
  let brandX = 0;
  let brandY = 0;
  let dateX = 0;
  let dateY = 0;
  let isBrandVertical = false;
  
  if (layout === 'vertical') {
    const footerHeight = 120;
    stripWidth = imgWidth + (padding * 2);
    stripHeight = (imgHeight * photosCount) + (gap * (photosCount - 1)) + (padding * 2) + footerHeight;
    
    for (let i = 0; i < photosCount; i++) {
      photoPositions.push({
        x: padding,
        y: padding + (i * (imgHeight + gap)),
        w: imgWidth,
        h: imgHeight
      });
    }
    
    brandX = stripWidth / 2;
    brandY = stripHeight - padding - (footerHeight / 2) - 10;
    dateX = stripWidth / 2;
    dateY = brandY + 28;
    isBrandVertical = false;
    
  } else if (layout === '2x2') {
    const footerHeight = 110;
    const cols = 2;
    const rows = Math.ceil(photosCount / cols);
    stripWidth = (imgWidth * cols) + (gap * (cols - 1)) + (padding * 2);
    stripHeight = (imgHeight * rows) + (gap * (rows - 1)) + (padding * 2) + footerHeight;
    
    for (let i = 0; i < photosCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      photoPositions.push({
        x: padding + (col * (imgWidth + gap)),
        y: padding + (row * (imgHeight + gap)),
        w: imgWidth,
        h: imgHeight
      });
    }
    
    brandX = stripWidth / 2;
    brandY = stripHeight - padding - (footerHeight / 2) - 10;
    dateX = stripWidth / 2;
    dateY = brandY + 28;
    isBrandVertical = false;
    
  } else if (layout === 'row') {
    const footerWidth = 140;
    stripWidth = (imgWidth * photosCount) + (gap * (photosCount - 1)) + (padding * 2) + footerWidth;
    stripHeight = imgHeight + (padding * 2);
    
    for (let i = 0; i < photosCount; i++) {
      photoPositions.push({
        x: padding + (i * (imgWidth + gap)),
        y: padding,
        w: imgWidth,
        h: imgHeight
      });
    }
    
    brandX = stripWidth - padding - (footerWidth / 2) + 10;
    brandY = stripHeight / 2 - 15;
    dateX = brandX;
    dateY = brandY + 32;
    isBrandVertical = true;
  }
  
  return {
    stripWidth,
    stripHeight,
    photoPositions,
    brandX,
    brandY,
    dateX,
    dateY,
    isBrandVertical,
    padding,
    gap
  };
};

const fillBackground = (ctx, width, height) => {
  const style = frameStyle.value;
  if (style.background) {
    if (style.background.startsWith('linear-gradient')) {
      let colors = [];
      if (settings.theme === 'classic' || settings.theme === 'minimal') {
        const frameConf = frameColors[settings.frameColor];
        colors = frameConf.isGradient ? frameConf.bg : [frameConf.bg, frameConf.bg];
      } else {
        if (settings.theme === 'neon') {
          colors = ['#ff2e93', '#8b5cf6', '#3b82f6'];
        } else if (settings.theme === 'y2k') {
          colors = ['#ffc0cb', '#e6e6fa'];
        } else if (settings.theme === 'cottage') {
          colors = ['#d8ecd0', '#faf0e6'];
        } else {
          colors = ['#1a0f2e', '#1a0f2e'];
        }
      }
      
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      colors.forEach((col, idx) => {
        grad.addColorStop(idx / (colors.length - 1), col);
      });
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.background;
    }
  } else if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
  } else {
    ctx.fillStyle = '#0c0a14';
  }
  ctx.fillRect(0, 0, width, height);
};

const drawThemeAndStickers = (ctx, width, height) => {
  const t = currentTheme.value;
  
  // 1. Draw theme decorations
  if (t.decorations && t.decorations.length > 0) {
    ctx.save();
    ctx.font = '36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (settings.layout === 'vertical') {
      if (settings.theme === 'retro') {
        ctx.fillText('📜', width - 40, 40);
        ctx.fillText('📜', 40, height - 160);
      } else if (settings.theme === 'neon') {
        ctx.fillText('⚡', 40, 40);
        ctx.fillText('✨', width - 40, 40);
      } else if (settings.theme === 'y2k') {
        ctx.fillText('🦋', 40, 60);
        ctx.fillText('🌸', width - 40, height - 160);
      } else if (settings.theme === 'cottage') {
        ctx.fillText('🌿', 40, 40);
        ctx.fillText('🍄', width - 40, height - 160);
      } else if (settings.theme === 'spooky') {
        ctx.fillText('🎃', 45, 45);
        ctx.fillText('🦇', width - 45, 45);
        ctx.fillText('👻', 45, height - 160);
      }
    } else if (settings.layout === '2x2') {
      if (settings.theme === 'retro') {
        ctx.fillText('📜', width - 40, 40);
      } else if (settings.theme === 'neon') {
        ctx.fillText('⚡', width - 40, 40);
      } else if (settings.theme === 'y2k') {
        ctx.fillText('🦋', 40, 40);
        ctx.fillText('🌸', width - 40, height - 140);
      } else if (settings.theme === 'cottage') {
        ctx.fillText('🌿', width - 40, 40);
      } else if (settings.theme === 'spooky') {
        ctx.fillText('🎃', 40, 40);
        ctx.fillText('🦇', width - 40, height - 140);
      }
    } else if (settings.layout === 'row') {
      if (settings.theme === 'retro') {
        ctx.fillText('📜', width - 180, 40);
      } else if (settings.theme === 'neon') {
        ctx.fillText('✨', width - 180, height - 40);
      } else if (settings.theme === 'y2k') {
        ctx.fillText('🦋', 40, 40);
        ctx.fillText('🌸', width - 180, height - 40);
      } else if (settings.theme === 'cottage') {
        ctx.fillText('🌿', 40, 40);
      } else if (settings.theme === 'spooky') {
        ctx.fillText('🎃', 40, 40);
        ctx.fillText('🦇', width - 180, height - 40);
      }
    }
    ctx.restore();
  }

  // 2. Draw user placed stickers
  stickers.value.forEach((sticker) => {
    ctx.save();
    const pxX = (sticker.x / 100) * width;
    const pxY = (sticker.y / 100) * height;
    
    ctx.translate(pxX, pxY);
    ctx.scale(sticker.scale, sticker.scale);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    
    ctx.font = '40px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.emoji, 0, 0);
    ctx.restore();
  });
};

const compile4StripVideo = (photos) => {
  return new Promise((resolve) => {
    const validPhotos = photos.filter(p => p.videoBlob);
    if (validPhotos.length < totalPhotosNeeded.value) {
      console.warn("Not all photos have video blobs, cannot compile motion photo.");
      resolve(null);
      return;
    }

    const videos = [];
    let loadedCount = 0;
    let hasFailed = false;

    const cleanup = () => {
      videos.forEach(v => {
        try {
          v.pause();
          URL.revokeObjectURL(v.src);
        } catch (e) {}
      });
    };

    const onVideoLoaded = () => {
      if (hasFailed) return;
      loadedCount++;
      if (loadedCount === totalPhotosNeeded.value) {
        startRecording();
      }
    };

    const onVideoError = (err) => {
      console.error("Failed to load video element for compilation:", err);
      hasFailed = true;
      cleanup();
      resolve(null);
    };

    photos.forEach((photo) => {
      const v = document.createElement('video');
      v.src = URL.createObjectURL(photo.videoBlob);
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.crossOrigin = 'anonymous';
      v.addEventListener('loadeddata', onVideoLoaded);
      v.addEventListener('error', onVideoError);
      videos.push(v);
    });

    activeVideos = videos;

    const startRecording = () => {
      const params = getCanvasParams(settings.layout, settings.spacing, settings.borderSize);
      const { stripWidth, stripHeight, photoPositions, brandX, brandY, dateX, dateY, isBrandVertical } = params;

      const recCanvas = document.createElement('canvas');
      recCanvas.width = stripWidth;
      recCanvas.height = stripHeight;
      const recCtx = recCanvas.getContext('2d');

      const stream = recCanvas.captureStream(30);
      
      let options = {};
      const candidates = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      let mimeType = 'video/webm';
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) {
          mimeType = c;
          options = { mimeType: c };
          break;
        }
      }

      const recChunks = [];
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        console.error("Failed to create MediaRecorder for canvas:", err);
        cleanup();
        resolve(null);
        return;
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recChunks.push(e.data);
      };

      let animationFrameId = null;

      recorder.onstop = async () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        const finalBlob = new Blob(recChunks, { type: mimeType.split(';')[0] });
        cleanup();
        
        try {
          const arrayBuf = await finalBlob.arrayBuffer();
          resolve({
            buffer: new Uint8Array(arrayBuf),
            mimeType: finalBlob.type
          });
        } catch (err) {
          console.error("Failed to convert compiled video blob to array buffer:", err);
          resolve(null);
        }
      };

      Promise.all(videos.map(v => v.play()))
        .then(() => {
          recorder.start(100);
          
          const duration = 4000;
          const startTime = Date.now();

          const drawFrame = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
              if (recorder.state !== 'inactive') {
                recorder.stop();
              }
              return;
            }

            // Fill background based on theme
            fillBackground(recCtx, stripWidth, stripHeight);

            // Draw video frames
            videos.forEach((v, idx) => {
              const pos = photoPositions[idx];
              if (!pos) return;
              
              recCtx.save();
              const radius = 6;
              recCtx.beginPath();
              recCtx.moveTo(pos.x + radius, pos.y);
              recCtx.lineTo(pos.x + pos.w - radius, pos.y);
              recCtx.quadraticCurveTo(pos.x + pos.w, pos.y, pos.x + pos.w, pos.y + radius);
              recCtx.lineTo(pos.x + pos.w, pos.y + pos.h - radius);
              recCtx.quadraticCurveTo(pos.x + pos.w, pos.y + pos.h, pos.x + pos.w - radius, pos.y + pos.h);
              recCtx.lineTo(pos.x + radius, pos.y + pos.h);
              recCtx.quadraticCurveTo(pos.x, pos.y + pos.h, pos.x, pos.y + pos.h - radius);
              recCtx.lineTo(pos.x, pos.y + radius);
              recCtx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
              recCtx.closePath();
              recCtx.clip();

              if (settings.filter !== 'normal') {
                recCtx.filter = filterMap[settings.filter];
              }

              recCtx.drawImage(v, pos.x, pos.y, pos.w, pos.h);
              recCtx.restore();
            });

            // Draw footer brand
            recCtx.save();
            recCtx.fillStyle = frameStyle.value.color || '#ffffff';
            recCtx.textAlign = 'center';
            recCtx.textBaseline = 'middle';
            
            const fontName = settings.theme === 'retro' || settings.theme === 'cottage' ? 'Georgia' 
                           : settings.theme === 'y2k' ? '"Comic Sans MS"' 
                           : settings.theme === 'spooky' ? 'Creepster, sans-serif' 
                           : '"Outfit", sans-serif';
                           
            recCtx.font = `800 28px ${fontName}`;
            
            if (isBrandVertical) {
              recCtx.translate(brandX, brandY);
              recCtx.rotate(Math.PI / 2);
              recCtx.fillText(displayLabel.value.toLowerCase(), 0, 0);
            } else {
              recCtx.fillText(displayLabel.value.toLowerCase(), brandX, brandY);
            }
            recCtx.restore();

            if (settings.showDate) {
              recCtx.save();
              recCtx.fillStyle = settings.theme === 'classic' || settings.theme === 'minimal' 
                ? frameColors[settings.frameColor].textMuted 
                : 'rgba(255, 255, 255, 0.7)';
              recCtx.textAlign = 'center';
              recCtx.textBaseline = 'middle';
              recCtx.font = `500 16px ${fontName}`;
              
              if (isBrandVertical) {
                recCtx.translate(dateX, dateY);
                recCtx.rotate(Math.PI / 2);
                recCtx.fillText(currentDate.value, 0, 0);
              } else {
                recCtx.fillText(currentDate.value, dateX, dateY);
              }
              recCtx.restore();
            }

            // Draw decorations & user stickers
            drawThemeAndStickers(recCtx, stripWidth, stripHeight);

            animationFrameId = requestAnimationFrame(drawFrame);
          };

          drawFrame();
        })
        .catch(err => {
          console.error("Failed to play videos during compilation:", err);
          cleanup();
          resolve(null);
        });
    };
  });
};

const compileMotionPhotoVideo = async () => {
  if (capturedPhotos.value.length < totalPhotosNeeded.value) return;
  
  isCompilingVideo.value = true;
  compiledVideoBuffer.value = null;
  
  const result = await compile4StripVideo(capturedPhotos.value);
  if (result) {
    compiledVideoBuffer.value = result.buffer;
    compiledVideoMimeType.value = result.mimeType;
  }
  isCompilingVideo.value = false;
};

let compileTimeout = null;

watch([capturedPhotos, settings, stickers], () => {
  if (capturedPhotos.value.length === totalPhotosNeeded.value) {
    clearTimeout(compileTimeout);
    compileTimeout = setTimeout(() => {
      compileMotionPhotoVideo();
    }, 800);
  }
}, { deep: true, immediate: true });

onUnmounted(() => {
  clearTimeout(compileTimeout);
  activeVideos.forEach(v => {
    try {
      v.pause();
      URL.revokeObjectURL(v.src);
    } catch (e) {}
  });
});

const createMotionPhotoSync = (jpegBuffer, videoBuffer, videoMimeType = 'video/mp4') => {
  const videoSize = videoBuffer.byteLength;
  const placeholder = "0000000000";

  const getXml = (primaryLen, videoLen, mimeType) => `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.1.0-jc003">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" 
      xmlns:GCamera="http://ns.google.com/photos/1.0/camera/" 
      xmlns:Container="http://ns.google.com/photos/1.0/container/" 
      xmlns:Item="http://ns.google.com/photos/1.0/container/item/" 
      GCamera:MotionPhoto="1" 
      GCamera:MotionPhotoVersion="1" 
      GCamera:MotionPhotoPresentationTimestampUs="0">
      <Container:Directory>
        <rdf:Seq>
          <rdf:li rdf:parseType="Resource">
            <Container:Item Item:Mime="image/jpeg" Item:Semantic="Primary" Item:Length="${primaryLen}" Item:Padding="0"/>
          </rdf:li>
          <rdf:li rdf:parseType="Resource">
            <Container:Item Item:Mime="${mimeType}" Item:Semantic="MotionPhoto" Item:Length="${videoLen}" Item:Padding="0"/>
          </rdf:li>
        </rdf:Seq>
      </Container:Directory>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;

  const xmpHeader = "http://ns.adobe.com/xap/1.0/\0";
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(xmpHeader);

  const tempXml = getXml(placeholder, videoSize, videoMimeType);
  const xmlBytesLength = encoder.encode(tempXml).byteLength;

  const primaryLength = jpegBuffer.byteLength + 4 + headerBytes.byteLength + xmlBytesLength;
  const formattedPrimaryLength = String(primaryLength).padStart(10, '0');

  const xmpXml = getXml(formattedPrimaryLength, videoSize, videoMimeType);
  const xmlBytes = encoder.encode(xmpXml);
  
  const segmentLength = 2 + headerBytes.byteLength + xmlBytes.byteLength;
  
  const app1Segment = new Uint8Array(2 + segmentLength);
  app1Segment[0] = 0xFF;
  app1Segment[1] = 0xE1;
  app1Segment[2] = (segmentLength >> 8) & 0xFF;
  app1Segment[3] = segmentLength & 0xFF;
  app1Segment.set(headerBytes, 4);
  app1Segment.set(xmlBytes, 4 + headerBytes.byteLength);

  if (jpegBuffer[0] !== 0xFF || jpegBuffer[1] !== 0xD8) {
    console.warn("Invalid JPEG header, returning normal file");
    const out = new Uint8Array(jpegBuffer.byteLength + videoBuffer.byteLength);
    out.set(jpegBuffer, 0);
    out.set(videoBuffer, jpegBuffer.byteLength);
    return out;
  }

  const outputBuffer = new Uint8Array(jpegBuffer.byteLength + app1Segment.byteLength + videoBuffer.byteLength);
  outputBuffer.set(jpegBuffer.subarray(0, 2), 0);
  outputBuffer.set(app1Segment, 2);
  outputBuffer.set(jpegBuffer.subarray(2), 2 + app1Segment.byteLength);
  outputBuffer.set(videoBuffer, jpegBuffer.byteLength + app1Segment.byteLength);

  return outputBuffer;
};

const compileAndDownloadStrip = async () => {
  if (!canDownload.value || !exportCanvasRef.value) return;

  if (isCompilingVideo.value) {
    announceToScreenReader('Sedang memproses motion photo, mohon tunggu sebentar…');
    while (isCompilingVideo.value) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  if (!compiledVideoBuffer.value && capturedPhotos.value.some(p => p.videoBlob)) {
    announceToScreenReader('Mempersiapkan video motion photo…');
    await compileMotionPhotoVideo();
  }

  announceToScreenReader('Mengekspor foto strip Anda…');

  const exportCanvas = exportCanvasRef.value;
  const exportCtx = exportCanvas.getContext('2d');

  const params = getCanvasParams(settings.layout, settings.spacing, settings.borderSize);
  const { stripWidth, stripHeight, photoPositions, brandX, brandY, dateX, dateY, isBrandVertical } = params;

  exportCanvas.width = stripWidth;
  exportCanvas.height = stripHeight;

  // Fill background
  fillBackground(exportCtx, stripWidth, stripHeight);

  // Draw images
  capturedPhotos.value.forEach((photo, idx) => {
    const pos = photoPositions[idx];
    if (!pos) return;

    exportCtx.save();
    
    const radius = 6;
    exportCtx.beginPath();
    exportCtx.moveTo(pos.x + radius, pos.y);
    exportCtx.lineTo(pos.x + pos.w - radius, pos.y);
    exportCtx.quadraticCurveTo(pos.x + pos.w, pos.y, pos.x + pos.w, pos.y + radius);
    exportCtx.lineTo(pos.x + pos.w, pos.y + pos.h - radius);
    exportCtx.quadraticCurveTo(pos.x + pos.w, pos.y + pos.h, pos.x + pos.w - radius, pos.y + pos.h);
    exportCtx.lineTo(pos.x + radius, pos.y + pos.h);
    exportCtx.quadraticCurveTo(pos.x, pos.y + pos.h, pos.x, pos.y + pos.h - radius);
    exportCtx.lineTo(pos.x, pos.y + radius);
    exportCtx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
    exportCtx.closePath();
    exportCtx.clip();

    if (settings.filter !== 'normal') {
      exportCtx.filter = filterMap[settings.filter];
    }

    exportCtx.drawImage(photo.source, pos.x, pos.y, pos.w, pos.h);

    exportCtx.restore();
  });

  // Draw footer brand label
  exportCtx.save();
  exportCtx.fillStyle = frameStyle.value.color || '#ffffff';
  exportCtx.textAlign = 'center';
  exportCtx.textBaseline = 'middle';
  
  const fontName = settings.theme === 'retro' || settings.theme === 'cottage' ? 'Georgia' 
                 : settings.theme === 'y2k' ? '"Comic Sans MS"' 
                 : settings.theme === 'spooky' ? 'Creepster, sans-serif' 
                 : '"Outfit", sans-serif';
                 
  exportCtx.font = `800 28px ${fontName}`;
  
  if (isBrandVertical) {
    exportCtx.translate(brandX, brandY);
    exportCtx.rotate(Math.PI / 2);
    exportCtx.fillText(displayLabel.value.toLowerCase(), 0, 0);
  } else {
    exportCtx.fillText(displayLabel.value.toLowerCase(), brandX, brandY);
  }
  exportCtx.restore();

  if (settings.showDate) {
    exportCtx.save();
    exportCtx.fillStyle = settings.theme === 'classic' || settings.theme === 'minimal' 
      ? frameColors[settings.frameColor].textMuted 
      : 'rgba(255, 255, 255, 0.7)';
    exportCtx.textAlign = 'center';
    exportCtx.textBaseline = 'middle';
    exportCtx.font = `500 16px ${fontName}`;
    
    if (isBrandVertical) {
      exportCtx.translate(dateX, dateY);
      exportCtx.rotate(Math.PI / 2);
      exportCtx.fillText(currentDate.value, 0, 0);
    } else {
      exportCtx.fillText(currentDate.value, dateX, dateY);
    }
    exportCtx.restore();
  }

  // Draw theme decorations and stickers
  drawThemeAndStickers(exportCtx, stripWidth, stripHeight);

  triggerPrinterAnimation();

  const jpegDataUrl = exportCanvas.toDataURL('image/jpeg', 0.90);
  
  const base64 = jpegDataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const jpegBuffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    jpegBuffer[i] = binaryString.charCodeAt(i);
  }

  let finalBuffer;
  if (compiledVideoBuffer.value) {
    try {
      finalBuffer = createMotionPhotoSync(jpegBuffer, compiledVideoBuffer.value, compiledVideoMimeType.value);
    } catch (err) {
      console.error('Failed to create motion photo, downloading static JPEG:', err);
      finalBuffer = jpegBuffer;
    }
  } else {
    finalBuffer = jpegBuffer;
  }

  let binary = '';
  const chunkSize = 0xffff;
  for (let i = 0; i < finalBuffer.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, finalBuffer.subarray(i, i + chunkSize));
  }
  const dataUrl = 'data:image/jpeg;base64,' + window.btoa(binary);

  const downloadLink = document.createElement('a');
  downloadLink.href = dataUrl;
  downloadLink.download = `MVIMG_yuphoria-strip-${Date.now()}.jpg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  
  setTimeout(() => {
    document.body.removeChild(downloadLink);
  }, 100);

  announceToScreenReader('Foto strip berhasil diunduh ke perangkat Anda.');
};

const triggerPrinterAnimation = () => {
  isPrinting.value = false;
  setTimeout(() => {
    isPrinting.value = true;
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

.spinner-btn {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: btn-spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
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
  height: 490px;
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

/* 3D Card Flip Animation */
.flip-container {
  perspective: 1000px;
  transition: width 0.4s ease, height 0.4s ease;
}

.flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-container.is-flipped .flipper {
  transform: rotateY(180deg);
}

.booth-strip {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all var(--transition-normal);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  box-sizing: border-box;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  margin: 0;
}

.booth-strip.front {
  z-index: 2;
  transform: rotateY(0deg);
}

.booth-strip.back {
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Layout Specific Sizing Styles */
.layout-vertical {
  flex-direction: column;
}
.layout-vertical .strip-slots {
  display: flex;
  flex-direction: column;
}
.layout-vertical .strip-slot {
  width: 100%;
  aspect-ratio: 4/3;
}
.layout-vertical .strip-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 8px;
  margin-top: auto;
}

.layout-2x2 {
  flex-direction: column;
}
.layout-2x2 .strip-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.layout-2x2 .strip-slot {
  width: 100%;
  aspect-ratio: 4/3;
}
.layout-2x2 .strip-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 6px;
  margin-top: auto;
}

.layout-row {
  flex-direction: row;
}
.layout-row .strip-slots {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.layout-row .strip-slot {
  height: 100%;
  aspect-ratio: 4/3;
  width: auto;
}
.layout-row .strip-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  width: 70px;
  border-top: none;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  padding-left: 8px;
  margin-top: 0;
  padding-top: 0;
  text-align: center;
}
.layout-row .strip-brand {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 0.85rem;
}
.layout-row .strip-date {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 0.55rem;
  margin-top: 8px;
}

.frame-cream .layout-vertical .strip-footer,
.frame-cream .layout-2x2 .strip-footer {
  border-top-color: rgba(0, 0, 0, 0.08);
}
.frame-cream .layout-row .strip-footer {
  border-left-color: rgba(0, 0, 0, 0.08);
}

/* Spacing Options */
.spacing-tight .strip-slots { gap: 4px; }
.spacing-normal .strip-slots { gap: 10px; }
.spacing-wide .strip-slots { gap: 20px; }

/* Border Size Padding Options */
.border-thin { padding: 8px; }
.border-medium { padding: 16px; }
.border-thick { padding: 24px; }

/* Back content message layout */
.back-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  text-align: center;
  padding: 10px 4px;
  box-sizing: border-box;
}

.layout-row-back {
  flex-direction: row !important;
  align-items: center;
  gap: 16px;
  padding: 4px 10px !important;
}

.layout-row-back .back-header {
  width: 90px;
  flex-shrink: 0;
}

.layout-row-back .secret-text-box {
  margin: 0 !important;
  height: 100% !important;
}

.layout-row-back .back-footer {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  border-top: none !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0 !important;
  padding-left: 12px;
  height: 100%;
}

.back-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.back-heart {
  font-size: 2rem;
  animation: heart-pulse 1.5s infinite;
}

@keyframes heart-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.back-header h4 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}

.secret-text-box {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius-sm);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  margin: 16px 0;
  overflow-y: auto;
  max-height: 200px;
}

.secret-text-box p {
  font-family: var(--font-body);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

.secret-text-box p.empty-message {
  font-style: italic;
  opacity: 0.5;
}

.back-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  opacity: 0.7;
  font-family: var(--font-display);
  font-weight: 500;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.frame-cream .back-footer {
  border-top-color: rgba(0, 0, 0, 0.08);
}

/* Draggable Stickers Overlay */
.stickers-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 8;
  pointer-events: none;
  overflow: hidden;
}

.draggable-sticker {
  position: absolute;
  pointer-events: auto;
  cursor: move;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1.5px dashed transparent;
  border-radius: var(--border-radius-sm);
  transition: border-color var(--transition-fast);
}

.draggable-sticker:hover {
  border-color: var(--accent-magenta);
  background: rgba(255, 46, 147, 0.08);
}

.sticker-emoji {
  font-size: 2.2rem;
  line-height: 1;
}

.delete-sticker-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ff2e63;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.75rem;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 12;
}

.draggable-sticker:hover .delete-sticker-btn {
  display: flex;
}

.sticker-controls {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  gap: 4px;
  background: rgba(12, 10, 20, 0.9);
  padding: 2px 6px;
  border-radius: 99px;
  border: 1px solid var(--border-color);
  z-index: 12;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.draggable-sticker:hover .sticker-controls {
  display: flex;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Theme Decorations */
.theme-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

.decor-1, .decor-2 {
  position: absolute;
  font-size: 1.5rem;
  opacity: 0.85;
}

.decor-1 {
  top: 6px;
  left: 6px;
}

.decor-2 {
  bottom: 80px;
  right: 6px;
}

/* Photo Slots */
.strip-slots {
  display: flex;
  transition: all var(--transition-normal);
}

.strip-slot {
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
  transition: all var(--transition-normal);
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

.margin-top-sm { margin-top: 8px; }
</style>
