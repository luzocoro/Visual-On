import React from 'react';
import { X, Shield, Clock, MapPin, User, FileArchive, Download, Lock, CheckCircle2 } from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';

interface EmailAlertPreviewModalProps {
  evidence: ForensicEvidence | null;
  onClose: () => void;
}

export const EmailAlertPreviewModal: React.FC<EmailAlertPreviewModalProps> = ({
  evidence,
  onClose,
}) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono">
      <div className="max-w-2xl w-full bg-[#eef2f6] text-[#1e293b] rounded-lg shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Email Client Simulated Header (Matching estilo visual 1.jpeg) */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="ml-2 font-medium text-slate-800">Gmail / Cliente de Correo</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Subject Bar */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 text-xs text-slate-700">
          <strong>Asunto:</strong> [ALERTA VISUAL-ON] Inicio de sesión detectado en tu equipo - {evidence.timestamp}
        </div>

        {/* Email Body Card (Soft Neumorphic Style from estilo visual 1.jpeg) */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-center gap-2.5 pb-2">
            <img
              src="/src/assets/images/visual_on_gold_shield_1790266186643.jpg"
              alt="Visual-On Logo"
              className="w-10 h-10 object-contain rounded-md"
            />
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-sans">
                Visual-On
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                Secure Agent
              </div>
            </div>
          </div>

          <div className="text-center font-sans font-semibold text-slate-800 text-sm flex items-center justify-center gap-1.5">
            <User className="w-4 h-4 text-cyan-600" />
            <span>Alerta de Seguridad Visual-On: Inicio de sesión verificado.</span>
          </div>

          {/* Details Table + Photo Grid */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left Data Items */}
            <div className="md:col-span-6 space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>Usuario SO:</span>
                </div>
                <span className="font-bold text-slate-900">{evidence.os_user}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span>Fecha/Hora:</span>
                </div>
                <span className="font-bold text-slate-900">{evidence.timestamp}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>IP Pública:</span>
                </div>
                <span className="font-bold text-slate-900">{evidence.ip_address}</span>
              </div>
            </div>

            {/* Right Photo Snapshot */}
            <div className="md:col-span-6 relative rounded-lg overflow-hidden border border-slate-200 shadow-inner group">
              <img
                src={evidence.photo_url}
                alt="Captura"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                }}
                className="w-full h-44 object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] px-2 py-1 flex items-center justify-between">
                <span>{evidence.photo_filename}</span>
                <span className="text-cyan-400 font-bold">LAT: {evidence.camera_latency_ms}ms</span>
              </div>
            </div>
          </div>

          {/* Primary View Action */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#00d2ff] hover:bg-[#00c0ea] text-slate-950 font-bold text-xs rounded-lg transition-colors font-sans shadow-sm"
          >
            [ Botón: Ver Detalles ]
          </button>

          {/* Encrypted Attachment Box (Matching estilo visual 1.jpeg) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0">
                <FileArchive className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>captura_adjunta_AES-256.zip</span>
                  <Lock className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[10px] text-slate-500">
                  {evidence.raw_zip_size} | Encolado local Cifrado (AES-256)
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-600 mb-1 hidden sm:block">
                Adjunto Cifrado AES-256-GCM para envío diferido
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  evidence.status === 'SENT'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                status: {evidence.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
