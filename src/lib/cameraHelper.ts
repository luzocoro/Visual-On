/**
 * Helper para captura automática de cámara (PC / Celular) y sonido de obturador
 */

export const playCameraShutterSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Silencio si el navegador no permite audio antes de interacción
  }
};

/**
 * Accede a la cámara web o del celular, toma el fotograma automáticamente
 * en milisegundos sin diálogos de confirmación y retorna la imagen en base64.
 */
export const captureDirectWebcamFrame = async (): Promise<{
  photoBase64: string;
  latencyMs: number;
  isRealCamera: boolean;
}> => {
  const startTime = performance.now();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      photoBase64: '/assets/forensic_capture.jpg',
      latencyMs: 380,
      isRealCamera: false,
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve()).catch(reject);
      };
      // Timeout de seguridad en caso de que tarde en inicializar
      setTimeout(() => resolve(), 650);
    });

    // Esperar un fotograma para que no quede negro
    await new Promise((r) => setTimeout(r, 120));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    let photoBase64 = '/assets/forensic_capture.jpg';
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      photoBase64 = canvas.toDataURL('image/jpeg', 0.88);
    }

    // Detener de inmediato la cámara
    stream.getTracks().forEach((track) => track.stop());

    // Sonido de disparo
    playCameraShutterSound();

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      photoBase64,
      latencyMs: Math.max(150, latencyMs),
      isRealCamera: true,
    };
  } catch (err) {
    // Si el usuario deniega o no hay cámara conectada, usar evidencia de respaldo
    playCameraShutterSound();
    return {
      photoBase64: '/assets/forensic_capture.jpg',
      latencyMs: Math.round(performance.now() - startTime),
      isRealCamera: false,
    };
  }
};
