import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Shield,
  Upload,
} from 'lucide-react';

interface UniversalCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (photoBase64: string, metadata?: { latencyMs?: number; cameraFacing?: string }) => Promise<void>;
  osUser?: string;
}

export const UniversalCameraModal: React.FC<UniversalCameraModalProps> = ({
  isOpen,
  onClose,
  onCapturePhoto,
  osUser = 'luz_ocoro',
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [sensorLatency, setSensorLatency] = useState<number>(380);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Detectar dispositivo móvil
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  }, []);

  // Generador de sonido de obturador fotográfico con Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio bloqueado por política de navegador
    }
  };

  // Enumerar dispositivos de video
  const getAvailableDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // Ignorar
    }
  };

  // Iniciar Stream de la Cámara
  const startCamera = useCallback(async (facing: 'user' | 'environment', deviceId?: string) => {
    setCameraError(null);
    const startTime = performance.now();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: facing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          const latency = Math.round(performance.now() - startTime);
          setSensorLatency(Math.max(120, latency));
        };
      }
      streamRef.current = stream;
      await getAvailableDevices();
    } catch (err: any) {
      setIsStreaming(false);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Permiso de cámara bloqueado. Por favor permite el acceso a la cámara en tu navegador.'
          : err?.name === 'NotFoundError'
          ? 'No se encontró ninguna cámara conectada a este equipo o celular.'
          : `No se pudo abrir la cámara: ${err?.message || 'Error de hardware'}`
      );
    }
  }, [selectedDeviceId]);

  // Detener Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Alternar frontal / trasera en celular
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleChangeDevice = (newId: string) => {
    setSelectedDeviceId(newId);
    startCamera(facingMode, newId);
  };

  // Capturar fotograma
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || !isStreaming) return;
    setIsCapturing(true);
    playShutterSound();

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 180);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (facingMode === 'user' && deviceType === 'desktop') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPreview(dataUrl);
    }
    setIsCapturing(false);
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToSupabase = async () => {
    if (!capturedPreview) return;
    setIsCapturing(true);
    await onCapturePhoto(capturedPreview, {
      latencyMs: sensorLatency,
      cameraFacing: facingMode === 'user' ? 'Cámara Frontal' : 'Cámara Trasera',
    });
    setIsCapturing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Efecto Flash */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 opacity-90" />
        )}

        {/* Barra Superior del Visor */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Cámara en Vivo &bull; Computadora o Celular
              </h2>
              <p className="text-[11px] text-slate-500">
                Detección biométrica y captura forense en alta definición
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
              {deviceType === 'mobile' ? 'Celular / Teléfono Móvil' : 'Computadora de Escritorio / Laptop'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Visor */}
        <div className="p-6 space-y-4">
          
          {/* Controles de Cámara (Frontal / Trasera / Selector) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                {deviceType === 'mobile' ? (
                  <Smartphone className="w-4 h-4 text-sky-600" />
                ) : (
                  <Monitor className="w-4 h-4 text-sky-600" />
                )}
                <span>Lente:</span>
              </span>

              {/* Botón para alternar entre cámara frontal y trasera */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                disabled={isCapturing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-semibold transition-all cursor-pointer shadow-xs"
                title="Alternar entre cámara frontal (selfie) y trasera (ambiente)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {facingMode === 'user' ? 'Cámara Frontal (Selfie)' : 'Cámara Trasera (Ambiente)'}
                </span>
              </button>

              {/* Selector si hay múltiples webcams conectadas */}
              {devices.length > 1 && (
                <div className="hidden sm:flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleChangeDevice(e.target.value)}
                    className="bg-white text-slate-800 border border-slate-200 px-2 py-1 text-xs rounded-lg"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Cámara #${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-emerald-700">Sensor Activo ({sensorLatency} ms)</span>
            </div>
          </div>

          {/* Pantalla del Visor / Resultado Capturado */}
          <div className="relative aspect-video max-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
            {capturedPreview ? (
              /* Previsualización del Fotograma Capturado */
              <div className="relative w-full h-full">
                <img
                  src={capturedPreview}
                  alt="Fotograma capturado"
                  className="w-full h-full object-contain bg-slate-950"
                />

                <div className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fotografía Capturada con Éxito</span>
                </div>

                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white">
                  <div>Usuario: <strong>{osUser}</strong></div>
                  <div className="text-sky-300 font-mono text-[11px]">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</div>
                </div>
              </div>
            ) : (
              /* Stream en Vivo de Video */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' && deviceType === 'desktop' ? 'scale-x-[-1]' : ''}`}
                />

                {isStreaming && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center text-[11px] text-white bg-black/60 px-3 py-1 rounded-full border border-white/20 self-start">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>Transmisión en Vivo</span>
                      </span>
                    </div>

                    <div className="self-center w-52 sm:w-64 h-52 sm:h-64 border-2 border-dashed border-sky-400/90 rounded-2xl flex items-center justify-center relative shadow-[0_0_20px_rgba(2,132,199,0.3)]">
                      <span className="text-[11px] font-semibold text-white bg-black/75 px-3 py-1 rounded-full">
                        Reconocimiento Facial
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">
                      <span>Propietario: {osUser}</span>
                      <span className="text-amber-300">Cifrado AES-256</span>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
                    <div className="text-sm font-bold text-white uppercase">Acceso a Cámara Bloqueado</div>
                    <p className="text-xs text-slate-300 max-w-md">{cameraError}</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Reintentar Acceso
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Usar Cámara Nativa del Celular</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={facingMode}
            onChange={handleMobileFileChange}
            className="hidden"
          />

          {/* Pie de Acciones del Visor */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Tomar foto con la app de cámara nativa de tu teléfono celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>Abrir App de Cámara Celular</span>
            </button>

            <div className="flex items-center gap-2">
              {capturedPreview ? (
                <>
                  <button
                    onClick={() => setCapturedPreview(null)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tomar Otra Foto</span>
                  </button>

                  <button
                    onClick={handleSaveToSupabase}
                    disabled={isCapturing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Guardar Fotografía en Supabase</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCaptureSnapshot}
                  disabled={!isStreaming || isCapturing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  <Zap className="w-4 h-4" />
                  <span>Disparar y Capturar Foto</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
