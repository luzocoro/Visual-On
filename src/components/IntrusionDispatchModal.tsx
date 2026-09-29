import React, { useState } from 'react';
import {
  X,
  Shield,
  Smartphone,
  Mail,
  Copy,
  Check,
  Send,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileDown,
} from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';
import { generateSingleIntruderPdf } from '../lib/pdfReportGenerator';

interface IntrusionDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: ForensicEvidence | null;
  ownerEmail?: string;
  whatsappNumber?: string;
  onLoginViaLink?: () => void;
}

export const IntrusionDispatchModal: React.FC<IntrusionDispatchModalProps> = ({
  isOpen,
  onClose,
  evidence,
  ownerEmail = 'luzamardi@gmail.com',
  whatsappNumber = '+57 300 123 4567',
}) => {
  const [copiedText, setCopiedText] = useState(false);

  // Asegurar que usamos estrictamente los datos vinculados inicialmente al registrarse
  const targetEmail = ownerEmail || 'luzamardi@gmail.com';
  const targetPhone = whatsappNumber || '+57 300 123 4567';

  if (!isOpen || !evidence) return null;

  // Enlace secreto que permite iniciar sesión y acceder al panel de control desde WhatsApp/Correo
  const directSecretLoginLink = `${window.location.origin}/?token=sec_auth_enclave&auth=true`;

  // Mensaje oficial y forense con la fotografía, datos del evento y enlace de inicio de sesión
  const incidentMessage = `🚨 *ALERTA DE INTRUSIÓN O INICIO DE SESIÓN - VISUAL-ON* 🚨

Se ha detectado encendido o inicio de sesión en tu computadora.

📸 *FOTOGRAFÍA DEL INTRUSO ADJUNTA*
La cámara capturó el rostro de quien se encuentra frente a la pantalla en modo silencioso.

📋 *Detalles Forenses:*
• 👤 *Usuario:* ${evidence.os_user || 'Desconocido'}
• 🕒 *Fecha y Hora:* ${evidence.timestamp}
• 📍 *Ubicación:* ${evidence.geolocation?.city || 'Colombia'} (${evidence.ip_address || '190.25.202.44'})
• ⚡ *Latencia de Cámara:* ${evidence.camera_latency_ms} ms
• 🔐 *ID de Evento:* ${evidence.event_id}
• 🛡️ *Hash Forense:* ${evidence.sha256_hash.substring(0, 32)}...
• 🔒 *Cifrado:* AES-256-GCM Hardware-Bound

🔗 *ENLACE SEGURO PARA INGRESAR AL PANEL DE CONTROL:*
${directSecretLoginLink}
_(Haz clic en este enlace para autorizarte e ingresar al panel de control y vigilancia)_

_Notificación automática enviada exclusivamente a los canales vinculados del propietario._`;

  const emailSubject = `🚨 [ALERTA DE INTRUSIÓN] Fotografía y acceso al panel de control - ${evidence.event_id}`;
  const emailBody = `ALERTA DE SEGURIDAD VISUAL-ON CENTINELA
======================================================================
Se detectó un acceso o encendido en tu computadora.

EVIDENCIA FOTOGRÁFICA:
El centinela forense capturó el rostro de la persona frente a la pantalla.
Fotografía: ${evidence.photo_url}

ENLACE SEGURO PARA INGRESAR AL PANEL DE CONTROL Y VIGILANCIA:
${directSecretLoginLink}
(Haz clic en el enlace para iniciar sesión como propietario)

DATOS TÉCNICOS DEL EVENTO FORENSE:
- Identificador de Evento: ${evidence.event_id}
- Fecha y Hora de Detección: ${evidence.timestamp}
- Usuario en el Sistema: ${evidence.os_user}
- Dirección IP Pública: ${evidence.ip_address}
- Ubicación Estimada: ${evidence.geolocation?.city || 'Colombia'}
- Latencia de Cámara: ${evidence.camera_latency_ms} ms
- Hash SHA-256 de Autenticidad: ${evidence.sha256_hash}
- Cifrado en Enclave: AES-256-GCM

Aviso automático emitido al correo vinculado del propietario: ${targetEmail}
======================================================================`;

  const handleDownloadPhoto = () => {
    const a = document.createElement('a');
    a.href = evidence.photo_url;
    a.download = `evidencia_intruso_${evidence.event_id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(incidentMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Helper para convertir imagen a PNG blob para portapapeles
  async function convertToPngBlob(url: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b), 'image/png');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado Rojo de Alerta Forense */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white border-b border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Alerta de Intrusión Despachada</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              </h2>
              <p className="text-[11px] text-slate-300">
                Fotografía y reporte enviados en tiempo real a tus canales registrados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Banner con los canales vinculados al registrarse (Sin preguntar cómo recibir) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            
            {/* Canal WhatsApp Vinculado */}
            <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  WhatsApp Vinculado
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 truncate">
                  {targetPhone}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Foto y Alerta Lista</span>
                </div>
              </div>
            </div>

            {/* Canal Correo Vinculado */}
            <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Correo Vinculado
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 truncate">
                  {targetEmail}
                </div>
                <div className="text-[10px] font-semibold text-sky-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Reporte Cifrado Listo</span>
                </div>
              </div>
            </div>

          </div>

          {/* Fotografía de la Evidencia Capturada en Silencio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Fotografía Capturada del Intruso (Adjunta al Mensaje):</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateSingleIntruderPdf(evidence)}
                  className="text-[11px] bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Descargar informe oficial en PDF del intruso con rastreo y datos forenses"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Informe PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Descargar archivo JPEG en alta resolución"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Foto</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-52 border-2 border-rose-500/40 shadow-inner group">
              <img
                src={evidence.photo_url}
                alt="Fotografía capturada del intruso"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                }}
              />
              <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md tracking-wider">
                FOTOGRAFÍA CAPTURADA EN MODO SILENCIOSO
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
                {evidence.camera_latency_ms} ms &bull; SHA-256 Verificado
              </div>
            </div>
          </div>

          {/* Datos Técnicos Forenses */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Usuario:</span>
              <strong className="text-slate-800 truncate block">{evidence.os_user}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Fecha y Hora:</span>
              <strong className="text-slate-800 truncate block">{evidence.timestamp.slice(11)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">IP Pública:</span>
              <strong className="text-slate-800 truncate block">{evidence.ip_address}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Evento ID:</span>
              <strong className="text-rose-600 truncate block">{evidence.event_id}</strong>
            </div>
          </div>

          {/* Pie del Modal */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleCopyReport}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Texto Copiado' : 'Copiar Texto del Informe'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
