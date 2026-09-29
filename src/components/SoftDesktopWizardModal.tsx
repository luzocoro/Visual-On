import React, { useState } from 'react';
import { X, Check, Shield, CheckCircle2 } from 'lucide-react';
import { CentinelaConfig } from '../types/visualon';

interface SoftDesktopWizardModalProps {
  config: CentinelaConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CentinelaConfig) => Promise<void>;
  onTestNotification: () => void;
}

export const SoftDesktopWizardModal: React.FC<SoftDesktopWizardModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onTestNotification,
}) => {
  const [formData, setFormData] = useState<CentinelaConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    await onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-mono">
      <div className="max-w-2xl w-full bg-[#e8eef5] text-slate-800 rounded-2xl shadow-[12px_12px_30px_#9cb0c5,-12px_-12px_30px_#ffffff] p-6 sm:p-8 space-y-5 border border-white/60 relative">
        {/* Top Window Bar (Matching visual on.jpg) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></span>
          </div>

          <div className="px-4 py-1 rounded-full bg-[#9dc4ad]/40 text-[#2d573f] text-xs font-bold tracking-wider uppercase shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]">
            STATUS: INITIAL SETUP
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono">
            Visual-On | SCR-01: Welcome &amp; Initial Configuration Wizard
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">
            PLEASE LINK YOUR NOTIFICATION CREDENTIALS TO COMPLETE SETUP. ⛅
          </p>
        </div>

        {/* OS User Pill (Soft Neumorphic) */}
        <div className="px-3.5 py-2 rounded-xl bg-[#e8eef5] shadow-[inset_3px_3px_6px_#c5d0dc,inset_-3px_-3px_6px_#ffffff] flex items-center gap-2 text-xs font-mono">
          <span className="font-bold text-slate-700">OS USER DETECTED:</span>
          <span className="text-[#3c7a56] font-bold">[{formData.os_username}] (VERIFIED)</span>
        </div>

        {/* Form Fields (Soft Inset Neumorphic) */}
        <div className="space-y-4 text-xs font-mono">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">[ CORREO ELECTRÓNICO DESTINO ]</label>
            <input
              type="email"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#e8eef5] shadow-[inset_3px_3px_6px_#c5d0dc,inset_-3px_-3px_6px_#ffffff] text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">
              [ NÚMERO DE WHATSAPP (CON CÓDIGO DE PAÍS) ]
            </label>
            <input
              type="text"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#e8eef5] shadow-[inset_3px_3px_6px_#c5d0dc,inset_-3px_-3px_6px_#ffffff] text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* SMTP App Token */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">
              [ CONFIGURACIÓN SMTP / TOKEN DE NOTIFICACIÓN ]
            </label>
            <input
              type="password"
              value={formData.smtp_app_token}
              onChange={(e) => setFormData({ ...formData, smtp_app_token: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#e8eef5] shadow-[inset_3px_3px_6px_#c5d0dc,inset_-3px_-3px_6px_#ffffff] text-slate-800 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={formData.auto_start}
                onChange={(e) => setFormData({ ...formData, auto_start: e.target.checked })}
                className="w-4 h-4 rounded accent-[#598392]"
              />
              <span>Iniciar automáticamente con el sistema operativo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={formData.offline_aes_encryption}
                onChange={(e) => setFormData({ ...formData, offline_aes_encryption: e.target.checked })}
                className="w-4 h-4 rounded accent-[#598392]"
              />
              <span>Guardar fotos no enviadas de forma cifrada cuando no haya red</span>
            </label>
          </div>
        </div>

        {/* Footer Actions (Matching visual on.jpg) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/70">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer font-mono"
          >
            cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onTestNotification}
              className="px-4 py-2 rounded-xl bg-[#98c1d9]/80 text-[#1d3557] font-bold text-xs shadow-[4px_4px_8px_#c5d0dc,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#c5d0dc] hover:bg-[#98c1d9] transition-all cursor-pointer font-mono"
            >
              Probar Notificación
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#83a992] text-white font-bold text-xs shadow-[4px_4px_8px_#c5d0dc,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#59836e] hover:bg-[#729b82] transition-all cursor-pointer flex items-center gap-1.5 font-mono"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? '¡Guardado!' : 'Guardar y Activar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
