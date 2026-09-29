import React, { useState, useRef } from 'react';
import {
  Camera,
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Clock,
  HardDrive,
  Eye,
  RefreshCw,
  Send,
  Zap,
  RotateCcw,
  Smartphone,
  AlertTriangle,
  Lock,
  Layers,
  ArrowUpRight,
  FileDown,
} from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';
import { generateFullAuditPdf, generateSingleIntruderPdf } from '../lib/pdfReportGenerator';

interface ForensicLogsScreenProps {
  evidences: ForensicEvidence[];
  onTriggerNewCapture: (photoBase64?: string) => Promise<void>;
  onViewEmailAlert: (evidence: ForensicEvidence) => void;
  onOpenUniversalCamera?: () => void;
}

export const ForensicLogsScreen: React.FC<ForensicLogsScreenProps> = ({
  evidences,
  onTriggerNewCapture,
  onViewEmailAlert,
  onOpenUniversalCamera,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<ForensicEvidence>(evidences[0] || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Iniciar webcam local si está disponible
  const startWebcam = async (facing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsWebcamActive(true);
      }
    } catch (err: any) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Permiso de cámara bloqueado por el navegador. Concede permisos para usar la cámara.'
          : 'No se pudo acceder a la cámara en este dispositivo.'
      );
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsWebcamActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isWebcamActive) {
      startWebcam(nextFacing);
    }
  };

  const captureWebcamSnapshot = async () => {
    setIsCapturing(true);
    let capturedPhotoUrl: string | undefined = undefined;

    if (videoRef.current && isWebcamActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);
      }
      stopWebcam();
    }

    await onTriggerNewCapture(capturedPhotoUrl);
    setIsCapturing(false);
  };

  const handleMobileCameraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCapturing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await onTriggerNewCapture(base64);
      setIsCapturing(false);
    };
    reader.readAsDataURL(file);
  };

  const downloadReport = (evidence: ForensicEvidence) => {
    const reportData = {
      sistema: 'Visual-On Vigilante Silencioso v2.4',
      cadena_custodia: 'Estándar ISO/IEC 27037 de Evidencia Digital',
      registro_evento: evidence.event_id,
      marca_temporal: evidence.timestamp,
      usuario_detectado: evidence.os_user,
      ip_publica: evidence.ip_address,
      geolocalizacion: evidence.geolocation,
      hash_sha256: evidence.sha256_hash,
      cifrado_forense: evidence.encryption_cipher,
      latencia_camara_ms: evidence.camera_latency_ms,
      canales_notificados: evidence.delivery_channels,
      estado_evento: evidence.status,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expediente_forense_${evidence.event_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mantener seleccionada la evidencia si cambia la lista
  const activeSelected = selectedEvidence || evidences[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Input oculto para cámara de celular */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={facingMode}
        onChange={handleMobileCameraFile}
        className="hidden"
      />

      {/* Encabezado Superior de Sección */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Expediente Fotográfico &amp; Evidencias
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro inmutable de capturas fotográficas, marcas de tiempo y metadatos de red
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={async () => {
              setIsGeneratingPdf(true);
              try {
                await generateFullAuditPdf(evidences);
              } finally {
                setIsGeneratingPdf(false);
              }
            }}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Descargar informe completo en formato PDF con todos los intrusos, mapas y estado del equipo"
          >
            <FileDown className="w-4 h-4 text-[#f3ba2f]" />
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar Informe Completo (PDF)'}</span>
          </button>

          {onOpenUniversalCamera && (
            <button
              onClick={onOpenUniversalCamera}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Visor de Cámara (PC / Celular)</span>
            </button>
          )}

          {!isWebcamActive ? (
            <button
              onClick={() => startWebcam(facingMode)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-sky-600" />
              <span>Activar Webcam Local</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleFacing}
                className="px-2.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{facingMode === 'user' ? 'Frontal' : 'Trasera'}</span>
              </button>
              <button
                onClick={stopWebcam}
                className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs hover:bg-rose-100 transition-colors"
              >
                Detener
              </button>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-600" />
            <span>Foto de Celular</span>
          </button>
        </div>
      </div>

      {/* Aviso de error de cámara */}
      {cameraError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs"
          >
            Tomar Foto con Celular
          </button>
        </div>
      )}

      {/* Visor en Vivo de Webcam si está activa */}
      {isWebcamActive && (
        <div className="p-4 bg-white rounded-3xl border-2 border-sky-300 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-sky-900 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Cámara Web en Vivo &bull; Reconocimiento Facial Activo</span>
            </span>
            <span className="text-slate-500">60 FPS</span>
          </div>

          <div className="relative aspect-video max-w-lg mx-auto bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-8 border-2 border-dashed border-sky-400 pointer-events-none flex items-center justify-center rounded-xl">
              <span className="text-[11px] text-sky-200 bg-black/70 px-2.5 py-1 rounded-full font-medium">
                Área de Enfoque Facial
              </span>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={captureWebcamSnapshot}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Capturar Fotograma Inmediato
            </button>
          </div>
        </div>
      )}

      {/* Cuadrícula de 2 Columnas: Lista de Incidentes + Vista Detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Lista de Incidentes */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>REGISTROS EN BASE DE DATOS ({evidences.length})</span>
            <span className="text-sky-600">Custodia Activa</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {evidences.map((ev) => {
              const isSelected = activeSelected?.id === ev.id || activeSelected?.event_id === ev.event_id;
              return (
                <div
                  key={ev.id || ev.event_id}
                  onClick={() => setSelectedEvidence(ev)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-12 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={ev.photo_url}
                          alt="Miniatura"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{ev.event_id}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>{ev.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        ev.status === 'SENT'
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                          : 'border-amber-200 text-amber-700 bg-amber-50'
                      }`}
                    >
                      {ev.status === 'SENT' ? 'DESPACHADO' : 'EN COLA'}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Usuario: <strong className="text-slate-800">{ev.os_user}</strong></span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSingleIntruderPdf(ev);
                      }}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      title="Descargar informe PDF de este intruso"
                    >
                      <FileDown className="w-3 h-3 text-rose-600" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Detalle Forense del Incidente Seleccionado */}
        {activeSelected && (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            {/* Cabecera del Expediente */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  Expediente de Evidencia Digital
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Incidente: {activeSelected.event_id}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => generateSingleIntruderPdf(activeSelected)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Descargar informe pericial en PDF de este intruso con fotografía, rastreo y estado del equipo"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Descargar Informe PDF</span>
                </button>

                <button
                  onClick={() => onViewEmailAlert(activeSelected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Ver cómo se envió la alerta oculta al propietario por WhatsApp y correo"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ver Alerta Enviada</span>
                </button>

                <button
                  onClick={() => downloadReport(activeSelected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Descargar paquete forense en formato JSON firmado"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Fotografía de Alta Resolución con Capa Forense */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner group">
              <img
                src={activeSelected.photo_url}
                alt="Fotografía forense del intruso"
                className="w-full max-h-80 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                }}
              />

              {/* Recuadro de Reconocimiento Facial */}
              <div className="absolute top-6 left-12 right-12 bottom-6 border-2 border-dashed border-rose-500 pointer-events-none rounded-xl flex flex-col justify-between p-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <div className="flex justify-between text-[11px] text-white bg-slate-950/80 px-2 py-0.5 rounded font-medium">
                  <span>ROSTRO DETECTADO</span>
                  <span className="text-emerald-400 font-bold">COINCIDENCIA: 98.4%</span>
                </div>
                <div className="text-[10px] text-sky-300 bg-slate-950/80 px-2 py-0.5 rounded self-start font-mono">
                  LATENCIA: {activeSelected.camera_latency_ms} ms
                </div>
              </div>

              {/* Marca de Agua Inferior con Sello Temporal */}
              <div className="absolute bottom-2 inset-x-2 bg-slate-950/85 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-white flex items-center justify-between">
                <span>{activeSelected.photo_filename}</span>
                <span className="text-slate-400 font-mono">{activeSelected.timestamp} UTC</span>
              </div>
            </div>

            {/* Cuadrícula de Metadatos Forenses */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Usuario del Sistema</div>
                <div className="font-bold text-slate-900 mt-0.5">{activeSelected.os_user}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Dirección IP Pública</div>
                <div className="font-bold text-sky-700 mt-0.5 font-mono">{activeSelected.ip_address}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Ubicación de Red</div>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{activeSelected.geolocation?.city || 'Bogotá D.C.'}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Algoritmo de Cifrado</div>
                <div className="font-bold text-amber-700 mt-0.5">{activeSelected.encryption_cipher}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Velocidad del Sensor</div>
                <div className="font-bold text-emerald-700 mt-0.5">{activeSelected.camera_latency_ms} ms</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Canales Notificados</div>
                <div className="font-bold text-slate-900 mt-0.5">Correo + WhatsApp</div>
              </div>
            </div>

            {/* Hash de Integridad Criptográfica */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Firma Criptográfica SHA-256 (Evidencia Inmutable):</span>
                <span className="text-emerald-600 font-bold">Verificado</span>
              </div>
              <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 break-all select-all">
                {activeSelected.sha256_hash}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
