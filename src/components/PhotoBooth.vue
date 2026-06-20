<template>
  <section class="booth-section" aria-labelledby="booth-heading">
    <h2 id="booth-heading" class="sr-only">Studio Kamera</h2>
    
    <div class="glass-card camera-card">
      <!-- Retro Viewfinder Frame -->
      <div class="viewfinder">
        <div class="viewfinder-corners" aria-hidden="true">
          <span class="top-left"></span>
          <span class="top-right"></span>
          <span class="bottom-left"></span>
          <span class="bottom-right"></span>
        </div>
        
        <div class="live-badge" id="camera-status-indicator">
          <span class="blink-dot" aria-hidden="true"></span>
          <span id="camera-status-text">{{ cameraStatusText }}</span>
        </div>
 
        <!-- Video Feed / Simulated Camera Canvas -->
        <div class="media-container" id="media-viewport">
          <video 
            ref="webcamFeed" 
            id="webcam-feed" 
            autoplay 
            playsinline 
            muted 
            aria-label="Pratinjau kamera langsung"
            :class="{ hidden: isUsingSimulator, mirrored: facingMode === 'user' }"
            :style="{ filter: currentFilterStyle }"
          ></video>
          <canvas 
            ref="fallbackCanvas" 
            id="fallback-canvas" 
            width="640" 
            height="480" 
            :class="{ hidden: !isUsingSimulator }" 
            aria-label="Simulator kamera virtual"
            :style="{ filter: currentFilterStyle }"
          ></canvas>
          
          <!-- Captured Indicator Flashes / Overlays -->
          <div id="flash-effect" class="flash-overlay" :class="{ 'flash-active': isFlashing }" aria-hidden="true"></div>
          
          <!-- Giant Visual Countdown -->
          <div id="countdown-overlay" class="countdown-overlay" :class="{ hidden: !isCountingDown }" aria-hidden="true">
            <span id="countdown-number" :key="countdownTimer">{{ countdownTimer }}</span>
          </div>
        </div>
 
        <!-- Bottom Video Stats / Framing Helper -->
        <div class="viewfinder-footer">
          <span class="aspect-label">4:3 ASPECT RATIO</span>
          <span class="resolution-label" id="resolution-display">{{ resolutionDisplay }}</span>
        </div>
      </div>
 
      <!-- Capture Sequence Progress Bar -->
      <div class="capture-progress-container" aria-label="Kemajuan Pengambilan Foto">
        <div class="progress-labels">
          <span>Sesi Foto</span>
          <span id="captured-count-text">{{ capturedCountText }}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span v-for="step in totalPhotosNeeded" :key="step" class="progress-indicator-dot" 
                :class="{ active: currentPhotoIndex === step && isSessionActive, done: capturedPhotos.length >= step }"></span>
          <div class="progress-fill" id="session-progress-bar" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
 
      <!-- Main Camera Control Bar -->
      <div class="camera-controls">
        <button id="start-session-btn" class="primary-btn pulse-effect" @click="startPhotoSession" :disabled="isSessionActive">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Mulai Sesi Foto ({{ totalPhotosNeeded }}-Cut)
        </button>
        <button v-if="capturedPhotos.length === totalPhotosNeeded || (isSessionActive && !isCountingDown && capturedPhotos.length > 0)" id="retake-btn" class="secondary-btn" @click="resetCurrentSession" aria-label="Ulangi sesi foto saat ini">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Ulangi
        </button>
        <button id="toggle-camera-source-btn" class="icon-btn border-btn" @click="toggleCameraSource" aria-label="Ganti sumber kamera/simulator" title="Ganti mode simulator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
        <button v-if="!isUsingSimulator" id="switch-camera-facing-btn" class="icon-btn border-btn" @click="toggleCameraFacing" aria-label="Ganti kamera depan/belakang" title="Ganti kamera depan/belakang">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 16h5v5"></path>
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>
 
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePhotobooth } from '../composables/usePhotobooth';
 
const { 
  isUsingSimulator, 
  isSessionActive, 
  capturedPhotos, 
  totalPhotosNeeded, 
  sessionVideoBlob,
  sessionVideoBuffer,
  settings, 
  filterMap,
  addPhoto,
  resetSession,
  announceToScreenReader
} = usePhotobooth();
 
const webcamFeed = ref(null);
const fallbackCanvas = ref(null);
 
const cameraStatusText = ref('MENGHUBUNGKAN…');
const resolutionDisplay = ref('640 × 480 PX');
const isFlashing = ref(false);
const isCountingDown = ref(false);
const countdownTimer = ref(3);
const currentPhotoIndex = ref(0);
const facingMode = ref('user');
 
let localStream = null;
let simulatorIntervalId = null;
let countdownInterval = null;
let captureSessionTimeout = null;
 
let mediaRecorder = null;
let recordedChunks = [];
 
const startRecordingForShot = () => {
  recordedChunks = [];
  let stream = null;
 
  if (isUsingSimulator.value) {
    if (fallbackCanvas.value) {
      try {
        stream = fallbackCanvas.value.captureStream(30); // 30 fps
      } catch (err) {
        console.error('Failed to capture stream from fallback canvas:', err);
      }
    }
  } else {
    stream = localStream;
  }
 
  if (!stream) {
    console.warn('No active stream found to record.');
    return;
  }
 
  let options = {};
  const candidates = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
 
  let selectedMimeType = '';
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMimeType = mime;
      options = { mimeType: mime };
      break;
    }
  }
 
  try {
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.start(100);
  } catch (err) {
    console.error('Failed to start MediaRecorder:', err);
  }
};
 
const cancelRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
  }
  recordedChunks = [];
};
 
const currentFilterStyle = computed(() => filterMap[settings.filter]);
 
const progressPercent = computed(() => {
  return (capturedPhotos.value.length / totalPhotosNeeded.value) * 100;
});
 
const capturedCountText = computed(() => {
  if (capturedPhotos.value.length === 0) return 'Belum ada foto yang diambil';
  if (capturedPhotos.value.length === totalPhotosNeeded.value) return 'Seluruh foto berhasil diambil!';
  return `${capturedPhotos.value.length} dari ${totalPhotosNeeded.value} foto diambil`;
});
 
onMounted(() => {
  setupCamera();
});
 
onUnmounted(() => {
  stopCameraStream();
  stopSimulatorStream();
});
 
const toggleCameraSource = () => {
  isUsingSimulator.value = !isUsingSimulator.value;
  setupCamera();
};

const toggleCameraFacing = () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user';
  setupCamera();
};
 
const setupCamera = async () => {
  stopCameraStream();
  stopSimulatorStream();
  
  cameraStatusText.value = 'MENGHUBUNGKAN…';
  announceToScreenReader('Menghubungkan ke kamera perangkat…');
 
  if (isUsingSimulator.value) {
    startCameraSimulator();
    return;
  }
 
  try {
    const constraints = {
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facingMode.value },
      audio: false
    };
 
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream = stream;
    if (webcamFeed.value) {
      webcamFeed.value.srcObject = stream;
      webcamFeed.value.onloadedmetadata = () => {
        resolutionDisplay.value = `${webcamFeed.value.videoWidth} × ${webcamFeed.value.videoHeight} PX`;
      };
    }
    
    cameraStatusText.value = 'KAMERA AKTIF';
    announceToScreenReader('Kamera aktif. Siap mengambil foto.');
  } catch (error) {
    console.warn('Camera Access Denied or Unavailable. Switching to simulator mode.', error);
    isUsingSimulator.value = true;
    startCameraSimulator();
  }
};
 
const stopCameraStream = () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if (webcamFeed.value) {
    webcamFeed.value.srcObject = null;
  }
};
 
const startCameraSimulator = () => {
  cameraStatusText.value = 'SIMULATOR AKTIF';
  resolutionDisplay.value = '640 × 480 PX';
  announceToScreenReader('Simulator kamera aktif. Menampilkan animasi visual.');
 
  if (!fallbackCanvas.value) return;
  const ctx = fallbackCanvas.value.getContext('2d');
  let angle = 0;
  
  simulatorIntervalId = setInterval(() => {
    ctx.fillStyle = '#110e1e';
    ctx.fillRect(0, 0, 640, 480);
 
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < 640; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
    }
    for (let y = 0; y < 480; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
    }
 
    const centerX = 320;
    const centerY = 240;
    const radius = 100 + Math.sin(angle) * 15;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff2e93';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff2e93';
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, angle, angle + Math.PI * 1.5);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 10;
    ctx.stroke();
 
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px "Outfit", sans-serif';
    ctx.fillText('[ SIMULATED RETRO VIEWPORT ]', 30, 40);
    
    const lineY = 240 + Math.sin(angle * 2.5) * 200;
    ctx.strokeStyle = 'rgba(255, 46, 147, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, lineY);
    ctx.lineTo(630, lineY);
    ctx.stroke();
 
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, 550, 40);
 
    angle += 0.03;
  }, 1000 / 30);
};
 
const stopSimulatorStream = () => {
  if (simulatorIntervalId) {
    clearInterval(simulatorIntervalId);
    simulatorIntervalId = null;
  }
};
 
const startPhotoSession = () => {
  if (isSessionActive.value) return;
  resetSession();
  isSessionActive.value = true;
  triggerCaptureSequence(1);
};
 
const triggerCaptureSequence = (photoIndex) => {
  if (photoIndex > totalPhotosNeeded.value) {
    finishPhotoSession();
    return;
  }
 
  currentPhotoIndex.value = photoIndex;
  countdownTimer.value = settings.countdown;
  isCountingDown.value = true;
  
  announceToScreenReader(`Foto ke-${photoIndex} dalam ${settings.countdown} detik…`);
 
  // Start recording video for this specific shot
  startRecordingForShot();
 
  countdownInterval = setInterval(() => {
    countdownTimer.value--;
    
    if (countdownTimer.value <= 0) {
      clearInterval(countdownInterval);
      isCountingDown.value = false;
      
      // Capture snapshot at the countdown mark
      const snapData = captureSnapshot(photoIndex);
      
      // Continue recording for 1 additional second to get a full motion clip
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.onstop = () => {
            let finalBlob = null;
            if (recordedChunks.length > 0) {
              const mimeTypeOnly = mediaRecorder.mimeType.split(';')[0] || 'video/webm';
              finalBlob = new Blob(recordedChunks, { type: mimeTypeOnly });
              console.log(`Shot ${photoIndex} recorded. Blob size:`, finalBlob.size);
            }
            
            addPhoto({ 
              dataUrl: snapData.imgDataUrl, 
              source: snapData.snapCanvas, 
              videoBlob: finalBlob 
            });
            
            announceToScreenReader(`Foto ke-${photoIndex} berhasil diambil!`);
          };
          mediaRecorder.stop();
        } else {
          addPhoto({ 
            dataUrl: snapData.imgDataUrl, 
            source: snapData.snapCanvas, 
            videoBlob: null 
          });
          announceToScreenReader(`Foto ke-${photoIndex} berhasil diambil!`);
        }
 
        captureSessionTimeout = setTimeout(() => {
          triggerCaptureSequence(photoIndex + 1);
        }, 1200);
      }, 1000);
    }
  }, 1000);
};
 
const captureSnapshot = (photoIndex) => {
  playShutterSound();
  
  isFlashing.value = true;
  setTimeout(() => isFlashing.value = false, 400);
 
  const snapCanvas = document.createElement('canvas');
  snapCanvas.width = 640;
  snapCanvas.height = 480;
  const snapCtx = snapCanvas.getContext('2d');
 
  if (facingMode.value === 'user') {
    snapCtx.translate(640, 0);
    snapCtx.scale(-1, 1);
  }
 
  if (!isUsingSimulator.value && webcamFeed.value) {
    const video = webcamFeed.value;
    const sWidth = video.videoWidth || 640;
    const sHeight = video.videoHeight || 480;
    const tWidth = 640;
    const tHeight = 480;

    const sAspect = sWidth / sHeight;
    const tAspect = tWidth / tHeight;

    let sx = 0, sy = 0, sw = sWidth, sh = sHeight;
    if (sAspect > tAspect) {
      // Stream is wider (e.g. 16:9), crop the sides
      sw = sHeight * tAspect;
      sx = (sWidth - sw) / 2;
    } else if (sAspect < tAspect) {
      // Stream is taller (e.g. portrait 9:16), crop top and bottom
      sh = sWidth / tAspect;
      sy = (sHeight - sh) / 2;
    }

    snapCtx.drawImage(video, sx, sy, sw, sh, 0, 0, tWidth, tHeight);
  } else if (fallbackCanvas.value) {
    snapCtx.drawImage(fallbackCanvas.value, 0, 0, 640, 480);
  }
 
  snapCtx.setTransform(1, 0, 0, 1, 0, 0);
 
  const imgDataUrl = snapCanvas.toDataURL('image/png');
 
  return { snapCanvas, imgDataUrl };
};
 
const finishPhotoSession = () => {
  isSessionActive.value = false;
  currentPhotoIndex.value = 0;
  announceToScreenReader(`Sesi foto selesai. Seluruh ${totalPhotosNeeded.value} foto berhasil diambil. Silakan unduh hasil strip Anda.`);
};
 
const resetCurrentSession = () => {
  clearInterval(countdownInterval);
  clearTimeout(captureSessionTimeout);
  isCountingDown.value = false;
  currentPhotoIndex.value = 0;
  cancelRecording();
  resetSession();
  announceToScreenReader('Sesi foto diulang. Silakan klik tombol untuk memulai.');
};
 
const playShutterSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Helper to play a single shutter blade click
    const playClick = (time, volume, freqStart, freqEnd, noiseFreq) => {
      // Noise buffer for the mechanical snap
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(noiseFreq, time);
      noiseFilter.Q.value = 5;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22 * volume, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      
      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Pitch-sweeping sine wave for the body thud
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqStart, time);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, time + 0.03);
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.35 * volume, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      // High metal resonance element
      const metallicOsc = ctx.createOscillator();
      metallicOsc.type = 'sine';
      metallicOsc.frequency.setValueAtTime(2400, time);
      
      const metallicGain = ctx.createGain();
      metallicGain.gain.setValueAtTime(0.08 * volume, time);
      metallicGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      metallicOsc.connect(metallicGain);
      metallicGain.connect(ctx.destination);
      
      // Start/Stop nodes
      noiseNode.start(time);
      osc.start(time);
      metallicOsc.start(time);
      
      noiseNode.stop(time + 0.05);
      osc.stop(time + 0.05);
      metallicOsc.stop(time + 0.05);
    };
    
    // iPhone Camera double-click click sound ("chi-chick")
    // 1st click: softer mechanical mirror open
    playClick(now, 0.75, 480, 160, 1400);
    
    // 2nd click: crisper mirror close at 60ms offset
    playClick(now + 0.06, 1.0, 620, 200, 2100);
    
  } catch (e) {
    // Silent fail
  }
};
</script>
 
<style scoped>
.camera-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
 
.viewfinder {
  position: relative;
  background-color: #000000;
  border-radius: var(--border-radius-md);
  aspect-ratio: 4/3;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9);
}
 
.viewfinder-corners span {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(255, 255, 255, 0.4);
  border-style: solid;
  pointer-events: none;
  z-index: 10;
}
.viewfinder-corners .top-left { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
.viewfinder-corners .top-right { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
.viewfinder-corners .bottom-left { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
.viewfinder-corners .bottom-right { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }
 
.live-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 15;
}
 
.blink-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: pulse-blink 1.5s infinite;
}
 
@keyframes pulse-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.9); }
}
 
.media-container {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
#webcam-feed, #fallback-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

#webcam-feed.mirrored, #fallback-canvas {
  transform: scaleX(-1);
}
 
.viewfinder-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  z-index: 10;
}
 
.flash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--shutter-flash-color);
  opacity: 0;
  z-index: 20;
  pointer-events: none;
}
 
.flash-active {
  animation: flash-animation 0.4s ease-out forwards;
}
 
@keyframes flash-animation {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}
 
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  pointer-events: none;
  backdrop-filter: blur(2px);
}
 
#countdown-number {
  font-family: var(--font-display);
  font-size: 6rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 0 30px var(--accent-magenta), 0 0 60px rgba(0,0,0,0.5);
  animation: countdown-pulse 1s ease-out infinite;
}
 
@keyframes countdown-pulse {
  0% { transform: scale(1.8); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: scale(0.9); opacity: 0; }
}
 
.capture-progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
 
.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
 
.progress-track {
  height: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 99px;
  position: relative;
  overflow: visible;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
 
.progress-fill {
  position: absolute;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(to right, var(--accent-purple), var(--accent-magenta));
  border-radius: 99px;
  transition: width var(--transition-normal);
  z-index: 1;
}
 
.progress-indicator-dot {
  width: 14px;
  height: 14px;
  background-color: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  z-index: 2;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
}
 
.progress-indicator-dot.active {
  border-color: var(--accent-magenta);
  background-color: var(--bg-secondary);
  transform: scale(1.25);
  box-shadow: 0 0 8px var(--accent-magenta);
}
 
.progress-indicator-dot.done {
  border-color: var(--accent-purple);
  background-color: var(--accent-purple);
  transform: scale(1.1);
}
 
.camera-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}
 
.primary-btn { flex: 1; }
.btn-icon { width: 18px; height: 18px; }
 
.pulse-effect {
  position: relative;
}
 
.pulse-effect::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 2px solid var(--accent-magenta);
  border-radius: calc(var(--border-radius-md) + 2px);
  opacity: 0;
  animation: pulse-ring 2.5s cubic-bezier(0.25, 0, 0, 1) infinite;
}
 
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { opacity: 0; transform: scale(1.08); }
  100% { opacity: 0; }
}
</style>
