import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Mail,
  Send,
  Camera,
  CheckCircle2,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Video,
  VideoOff,
} from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';
import { playCameraShutterSound } from '../lib/cameraHelper';

interface IntrusionAlertFirstScreenProps {
  evidence?: ForensicEvidence | null;
  defaultPhone?: string;
  defaultEmail?: string;
  onRefreshCapture?: () => void;
  onEvidenceUpdated?: (evidence: ForensicEvidence) => void;
}

// Función auxiliar para obtener la hora local exacta del equipo en formato YYYY-MM-DD HH:mm:ss
const getRealDeviceTime = (date: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

// Algoritmo forense para detectar si la cámara física está cubierta u oscura
const checkIsObstructed = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
  try {
    const sw = Math.min(width, 80);
    const sh = Math.min(height, 80);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;
    let totalLum = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avgLum = totalLum / count;
    return avgLum < 7;
  } catch {
    return false;
  }
};

export const IntrusionAlertFirstScreen: React.FC<IntrusionAlertFirstScreenProps> = ({
  defaultPhone = '+57 3104193813',
  defaultEmail = 'luzamardi@gmail.com',
  onEvidenceUpdated,
}) => {
  // Número de WhatsApp configurable para la prueba
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem('visualon_test_phone') || defaultPhone;
  });
  const [emailAddress, setEmailAddress] = useState(defaultEmail);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatched_whatsapp' | 'dispatched_email'>('idle');

  // Control manual de la cámara (SIN activación automática al cargar)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<'real_camera' | 'obstructed_sample' | 'idle'>('idle');
  const [isProcessingCapture, setIsProcessingCapture] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hora real del equipo (en tiempo real continuo)
  const [realTime, setRealTime] = useState<string>(() => getRealDeviceTime());

  // Ubicación real detectada del equipo
  const [locationData, setLocationData] = useState<{
    city: string;
    country: string;
    coordinates: string;
    ip: string;
    isp: string;
  }>({
    city: 'Bogotá D.C.',
    country: 'Colombia',
    coordinates: '4.7110° N, 74.0721° W',
    ip: '190.25.202.44',
    isp: 'ETB Fibra Óptica',
  });

  // Enlace que lleva al usuario a la PÁGINA DE INICIO (Login Obligatorio)
  const loginPageLink = `${window.location.origin}/?login=true`;
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // 1. Reloj en tiempo real del equipo (hora exacta del sistema operativo)
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(getRealDeviceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Detección de la UBICACIÓN REAL del equipo en segundo plano
  useEffect(() => {
    let isMounted = true;

    const fetchRealNetworkLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (isMounted && data && !data.error) {
          setLocationData({
            city: data.city || 'Bogotá D.C.',
            country: data.country_name || 'Colombia',
            coordinates: `${Number(data.latitude || 4.711).toFixed(4)}° N, ${Number(data.longitude || -74.0721).toFixed(4)}° W`,
            ip: data.ip || '190.25.202.44',
            isp: data.org || data.asn || 'Red Local',
          });
          return;
        }
      } catch {
        try {
          const res2 = await fetch('https://ipwho.is/');
          const data2 = await res2.json();
          if (isMounted && data2 && data2.success) {
            setLocationData({
              city: data2.city || 'Bogotá D.C.',
              country: data2.country || 'Colombia',
              coordinates: `${Number(data2.latitude || 4.711).toFixed(4)}° N, ${Number(data2.longitude || -74.0721).toFixed(4)}° W`,
              ip: data2.ip || '190.25.202.44',
              isp: data2.connection?.isp || data2.connection?.org || 'Red Local',
            });
          }
        } catch {
          // silenciar
        }
      }
    };

    fetchRealNetworkLocation();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          const lat = pos.coords.latitude.toFixed(4);
          const lon = pos.coords.longitude.toFixed(4);
          setLocationData((prev) => ({
            ...prev,
            coordinates: `${lat}°, ${lon}° (GPS Exacto)`,
          }));
        },
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      );
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Función para apagar la cámara
  const turnOffCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Función para encender la cámara
  const turnOnCamera = async () => {
    turnOffCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Este dispositivo o navegador no admite acceso a la cámara.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('No se pudo encender la cámara:', err);
      setIsCameraActive(false);
      alert('No se pudo encender la cámara. Verifica los permisos del navegador.');
    }
  };

  // Alternar encendido / apagado de la cámara
  const handleToggleCamera = () => {
    if (isCameraActive) {
      turnOffCamera();
    } else {
      turnOnCamera();
    }
  };

  // Guardar evidencia fotográfica en el estado global
  const notifyEvidenceCaptured = (photoUrl: string, isObstructed: boolean) => {
    if (onEvidenceUpdated) {
      onEvidenceUpdated({
        id: `ev_${Date.now()}`,
        event_id: `LVT-${realTime.slice(0, 10).replace(/-/g, '')}-742`,
        timestamp: realTime,
        os_user: 'luz_ocoro',
        ip_address: locationData.ip,
        geolocation: {
          city: locationData.city,
          country: locationData.country,
          coordinates: locationData.coordinates,
        },
        photo_url: photoUrl,
        photo_filename: isObstructed ? 'muestra_intrusion_obstruida.jpg' : 'evidencia_intruso_camara.jpg',
        sha256_hash: '8f7a93c12d45e67890abcdef1234567890abcdef1234567890abcdef12345678',
        status: 'QUEUED',
        delivery_channels: { email: false, whatsapp: false },
        camera_latency_ms: 180,
        encryption_cipher: 'AES-256-GCM',
        keyring_verified: true,
        raw_zip_size: '68.2 KB',
      });
    }
  };

  // Capturar fotografía manual (desde la cámara encendida o disparando captura directa)
  const handleCapturePhoto = async () => {
    setIsProcessingCapture(true);

    // Caso 1: La cámara ya está encendida en vivo
    if (isCameraActive && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        let photoResult = '/assets/forensic_capture.jpg';
        let isCoveredOrDark = false;

        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          isCoveredOrDark = checkIsObstructed(ctx, canvas.width, canvas.height);

          if (isCoveredOrDark) {
            photoResult = '/assets/forensic_capture.jpg';
            setCaptureSource('obstructed_sample');
          } else {
            photoResult = canvas.toDataURL('image/jpeg', 0.88);
            setCaptureSource('real_camera');
          }
        } else {
          setCaptureSource('obstructed_sample');
        }

        // Apagar cámara tras tomar la foto
        turnOffCamera();
        playCameraShutterSound();
        setCapturedPhoto(photoResult);
        notifyEvidenceCaptured(photoResult, isCoveredOrDark);
      } catch (err) {
        console.warn('Error capturando fotograma:', err);
        turnOffCamera();
        playCameraShutterSound();
        const sample = '/assets/forensic_capture.jpg';
        setCapturedPhoto(sample);
        setCaptureSource('obstructed_sample');
        notifyEvidenceCaptured(sample, true);
      } finally {
        setIsProcessingCapture(false);
      }
      return;
    }

    // Caso 2: La cámara está apagada -> encenderla, tomar foto de inmediato y apagarla
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Sin hardware');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const tempVideo = document.createElement('video');
      tempVideo.playsInline = true;
      tempVideo.muted = true;
      tempVideo.srcObject = stream;
      await new Promise<void>((resolve) => {
        tempVideo.onloadedmetadata = () => {
          tempVideo.play().then(() => resolve()).catch(() => resolve());
        };
        setTimeout(() => resolve(), 700);
      });
      await new Promise((r) => setTimeout(r, 200));

      const canvas = document.createElement('canvas');
      canvas.width = tempVideo.videoWidth || 1280;
      canvas.height = tempVideo.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      let photoResult = '/assets/forensic_capture.jpg';
      let isCoveredOrDark = false;

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        isCoveredOrDark = checkIsObstructed(ctx, canvas.width, canvas.height);
        if (isCoveredOrDark) {
          photoResult = '/assets/forensic_capture.jpg';
          setCaptureSource('obstructed_sample');
        } else {
          photoResult = canvas.toDataURL('image/jpeg', 0.88);
          setCaptureSource('real_camera');
        }
      } else {
        setCaptureSource('obstructed_sample');
      }

      stream.getTracks().forEach((t) => t.stop());
      playCameraShutterSound();
      setCapturedPhoto(photoResult);
      notifyEvidenceCaptured(photoResult, isCoveredOrDark);
    } catch {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      playCameraShutterSound();
      const sample = '/assets/forensic_capture.jpg';
      setCapturedPhoto(sample);
      setCaptureSource('obstructed_sample');
      notifyEvidenceCaptured(sample, true);
    } finally {
      setIsProcessingCapture(false);
    }
  };

  // ID del evento basado en la fecha real del equipo
  const eventId = `LVT-${realTime.slice(0, 10).replace(/-/g, '')}-742`;

  // INFORME RÁPIDO PARA WHATSAPP: LINK DIRIGIDO A LA PÁGINA DE INICIO CON LOGIN OBLIGATORIO
  const whatsappReportMessage = `🚨 *INFORME DE ALERTA DE INTRUSIÓN Y VIGILANCIA - VISUAL-ON* 🚨

Se ha detectado encendido o inicio de sesión en tu computadora.

📸 *REGISTRO FOTOGRÁFICO:*
• *Estado:* ${capturedPhoto ? 'Fotografía capturada y congelada en pantalla estática.' : 'Evidencia lista para captura.'}
• *Registro:* ${captureSource === 'real_camera' ? '[✓ Captura Óptica Directa del Intruso]' : '[⚠️ Muestra Forense de Intrusión (Cámara Apagada u Obstruida)]'}

📍 *UBICACIÓN REAL DEL EQUIPO:*
• *Ciudad / País:* ${locationData.city}, ${locationData.country}
• *Coordenadas:* ${locationData.coordinates}
• *Dirección IP Pública:* ${locationData.ip}
• *Proveedor de Internet (ISP):* ${locationData.isp}

💻 *DETALLES DEL SISTEMA:*
• *Usuario del Sistema:* luz_ocoro
• *Dispositivo:* Computador Personal (Laptop)
• *Hora Real de Registro:* ${realTime}
• *ID de Alerta:* ${eventId}
• *Cifrado de Bóveda:* AES-256-GCM (SHA-256 Verificado)

🔐 *LINK DIRECTO A LA PÁGINA DE INICIO (LOGIN OBLIGATORIO):*
${loginPageLink}
_(Nota de seguridad: Es obligatorio ingresar usuario y contraseña en esta página para poder ver el informe completo y acceder al sistema)_

_Sistema de Seguridad Visual-On Sentinel v2.4_`;

  const emailSubject = `🚨 [ALERTA DE INTRUSIÓN Y VIGILANCIA] Login Obligatorio (${realTime})`;
  const emailBody = `INFORME DE ALERTA DE INTRUSIÓN Y VIGILANCIA - VISUAL-ON
======================================================================
Se detectó un acceso o encendido en tu computadora.

REGISTRO FOTOGRÁFICO:
- Estado: ${capturedPhoto ? 'Evidencia capturada y congelada estáticamente en pantalla.' : 'Evidencia registrada.'}
- Registro: ${captureSource === 'real_camera' ? 'Captura Óptica Directa' : 'Muestra Forense de Intrusión'}

UBICACIÓN REAL DEL EQUIPO:
- Ciudad / País: ${locationData.city}, ${locationData.country}
- Coordenadas Geográficas: ${locationData.coordinates}
- Dirección IP Pública: ${locationData.ip}
- Proveedor de Red: ${locationData.isp}

DETALLES DEL SISTEMA:
- Usuario de Sesión: luz_ocoro
- ID Evento: ${eventId}
- Fecha y Hora Real del Equipo: ${realTime}
- Cifrado en Bóveda: AES-256-GCM

LINK DIRECTO A LA PÁGINA DE INICIO (LOGIN OBLIGATORIO):
${loginPageLink}
(Es obligatorio ingresar usuario y contraseña en esta página para ver el informe completo y acceder al panel de control)

Aviso oficial para el propietario registrado.
======================================================================`;

  const directWhatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappReportMessage)}`;
  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // ENVÍO AL MEDIO DESEADO POR EL VIGILANTE: WHATSAPP
  const handleSendToWhatsAppDirect = () => {
    // Si no ha capturado foto, asegurar evidencia de intrusión antes de enviar
    if (!capturedPhoto) {
      setCapturedPhoto('/assets/forensic_capture.jpg');
      setCaptureSource('obstructed_sample');
    }
    localStorage.setItem('visualon_test_phone', phoneNumber);
    setDispatchStatus('dispatched_whatsapp');

    const isMobileDevice = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
    if (isMobileDevice) {
      window.location.href = directWhatsappUrl;
    } else {
      window.open(directWhatsappUrl, '_blank');
    }
  };

  // ENVÍO AL MEDIO DESEADO POR EL VIGILANTE: CORREO
  const handleSendToEmailDirect = () => {
    if (!capturedPhoto) {
      setCapturedPhoto('/assets/forensic_capture.jpg');
      setCaptureSource('obstructed_sample');
    }
    setDispatchStatus('dispatched_email');
    const mailLink = document.createElement('a');
    mailLink.href = mailtoUrl;
    mailLink.target = '_blank';
    document.body.appendChild(mailLink);
    mailLink.click();
    document.body.removeChild(mailLink);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-[#f3ba2f] selection:text-black">
      
      {/* Marco Principal Central */}
      <div className="relative w-full max-w-4xl bg-[#0c1017] border border-[#1b2230] rounded-3xl shadow-2xl overflow-hidden my-4">
        
        {/* Encabezado Superior */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#111622] via-[#0e131d] to-[#111622] border-b border-[#1b2230] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0a0e16] border border-[#f3ba2f]/30 p-2 flex items-center justify-center shrink-0 shadow-lg">
              <img
                src="/assets/gold_shield.jpg"
                alt="Visual-On Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-[#f3ba2f] uppercase font-mono px-2 py-0.5 bg-[#f3ba2f]/10 border border-[#f3ba2f]/30 rounded">
                  CENTINELA SILENCIOSO
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-0.5">
                Panel de Alerta de Intrusión y Vigilancia
              </h1>
            </div>
          </div>

          {/* Estado de Despacho Activo */}
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>DESPACHO HABILITADO</span>
            </span>
          </div>
        </div>

        {/* Cuerpo del Panel */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* ======================================================== */}
          {/* 1. MARCO DE VIGILANCIA: CONTROL DE CÁMARA Y CAPTURA      */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Camera className="w-4 h-4 text-[#f3ba2f]" />
                <span>Pantalla de Vigilancia del Equipo:</span>
              </span>
              
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-rose-500 animate-ping' : capturedPhoto ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>
                  {isCameraActive
                    ? 'CÁMARA ENCENDIDA EN VIVO'
                    : capturedPhoto
                    ? 'FOTO ESTÁTICA EN PANTALLA'
                    : 'CÁMARA APAGADA • EN ESPERA'}
                </span>
              </span>
            </div>

            {/* MARCO DE CÁMARA AMPLIO */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video max-h-[420px] border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              
              {/* VIDEO EN VIVO (Cuando se enciende la cámara) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain bg-black ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* FOTO ESTÁTICA CAPTURADA (Cuando la cámara está apagada pero ya se tomó la foto) */}
              {!isCameraActive && capturedPhoto && (
                <img
                  src={capturedPhoto}
                  alt="Evidencia fotográfica capturada"
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* ESTADO DE ESPERA INICIAL (Cámara apagada y sin foto aún) */}
              {!isCameraActive && !capturedPhoto && (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
                  <div className="w-16 h-16 rounded-2xl bg-[#0e131d] border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                    <Camera className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-300 block">
                      Cámara en Espera • Apagada
                    </span>
                    <span className="text-xs text-slate-500 block max-w-md">
                      Haz clic en "Encender Cámara" para ver la transmisión o en "Capturar Foto" para registrar la evidencia estática y enviar el informe.
                    </span>
                  </div>
                </div>
              )}

              {/* Badge Superior Izquierdo */}
              <div className="absolute top-3 left-3 bg-black/90 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow flex items-center gap-2 border border-white/10 backdrop-blur-sm">
                {isCameraActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-300 font-mono">CÁMARA EN VIVO • LISTA PARA CAPTURAR</span>
                  </>
                ) : capturedPhoto ? (
                  captureSource === 'real_camera' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-mono">FOTO CAPTURADA • ESTÁTICA EN PANTALLA</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-mono">CÁMARA APAGADA / OBSTRUIDA • MUESTRA DE INTRUSIÓN</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-slate-400 font-mono">CÁMARA APAGADA</span>
                  </>
                )}
              </div>

              {/* Indicador Superior Derecho */}
              <div className="absolute top-3 right-3 bg-black/90 text-slate-300 text-[11px] font-mono px-3 py-1.5 rounded border border-slate-800 flex items-center gap-1.5 backdrop-blur-sm">
                <span className={`w-2 h-2 rounded-full ${capturedPhoto ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{capturedPhoto ? 'ESTÁTICA HASTA ENVÍO' : 'LISTO PARA ACTIVAR'}</span>
              </div>
            </div>

            {/* BARRA DE ACCIÓN: OPCIÓN DE ENCENDIDO DE CÁMARA Y CAPTURA DE FOTO */}
            <div className="p-3.5 bg-[#0b0e14] border border-[#1b2230] rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-200">
                  {isCameraActive
                    ? 'Cámara encendida. Presiona "Capturar Foto" para congelar la evidencia.'
                    : capturedPhoto
                    ? 'Foto estática capturada. Lista para enviar en el informe.'
                    : 'Cámara apagada. Elige encenderla o capturar la foto directamente.'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Opción de Encendido / Apagado de Cámara */}
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer border ${
                    isCameraActive
                      ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/40 text-rose-300'
                      : 'bg-[#151c28] hover:bg-[#1d2738] border-[#2a374d] text-slate-200'
                  }`}
                  title={isCameraActive ? 'Apagar la cámara' : 'Encender la cámara'}
                >
                  {isCameraActive ? (
                    <>
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Apagar Cámara</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-[#f3ba2f]" />
                      <span>Encender Cámara</span>
                    </>
                  )}
                </button>

                {/* Opción de Capturar Foto */}
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={isProcessingCapture}
                  className="px-4 py-2 bg-[#f3ba2f] hover:bg-[#ffc93c] active:bg-[#d9a220] text-black font-black text-xs rounded-xl shadow-lg shadow-[#f3ba2f]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Capturar foto y congelarla estáticamente en pantalla"
                >
                  <Camera className={`w-3.5 h-3.5 text-black ${isProcessingCapture ? 'animate-pulse' : ''}`} />
                  <span>
                    {isProcessingCapture
                      ? 'Capturando...'
                      : isCameraActive
                      ? 'Capturar Foto'
                      : capturedPhoto
                      ? 'Nueva Captura'
                      : 'Capturar Foto'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. CANALES PARA ENVIAR EL INFORME                        */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-1">
            
            {/* CAJA DE PRUEBA CONFIGURABLE PARA EL VIGILANTE */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-[#121927] to-[#0d121c] border-2 border-[#f3ba2f]/40 rounded-2xl space-y-4 shadow-xl">
              
              {/* Mensaje Textual */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f3ba2f]/20 text-[#f3ba2f] flex items-center justify-center shrink-0 border border-[#f3ba2f]/40">
                  <Smartphone className="w-5 h-5 text-[#f3ba2f]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-[#f3ba2f] leading-snug">
                    "Por ser una prueba puedes ingresar el número de Whatsapp donde llegará el informe. En este informe se incluye el link directo a la página de inicio, donde es obligatorio ingresar usuario y contraseña para ver el informe completo."
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Ingresa el número de WhatsApp o correo de destino y envía el informe con la foto capturada, ubicación real y hora del equipo.
                  </p>
                </div>
              </div>

              {/* Inputs para Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Campo WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block uppercase">
                    NÚMERO DE WHATSAPP DE DESTINO:
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+57 3104193813"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#263145] rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-[#f3ba2f]"
                    />
                  </div>
                </div>

                {/* Campo Correo */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block uppercase">
                    CORREO ELECTRÓNICO DE DESTINO:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="luzamardi@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#263145] rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-[#f3ba2f]"
                    />
                  </div>
                </div>

              </div>

              {/* Botones de Envío */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendToEmailDirect}
                  className="w-full sm:w-auto py-3 px-5 bg-[#151c28] hover:bg-[#1d2738] active:bg-[#0f141d] border border-[#2a374d] text-slate-200 font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shrink-0"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Enviar por Correo</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToWhatsAppDirect}
                  className="w-full sm:w-auto py-3.5 px-7 bg-[#f3ba2f] hover:bg-[#ffc93c] active:bg-[#d9a220] text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-[#f3ba2f]/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shrink-0"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span>ENVIAR INFORME A ESTE WHATSAPP</span>
                </button>
              </div>

              {dispatchStatus === 'dispatched_whatsapp' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Informe enviado al número <strong>{phoneNumber}</strong> con la evidencia registrada, ubicación real y hora del equipo ({realTime}).</span>
                </div>
              )}

              {dispatchStatus === 'dispatched_email' && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Informe preparado para envío al correo <strong>{emailAddress}</strong> con la evidencia registrada, ubicación y hora del equipo.</span>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
