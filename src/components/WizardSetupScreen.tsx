import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Smartphone,
  Lock,
  Cpu,
  Save,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  Power,
  RefreshCw,
  Server,
  Key,
} from 'lucide-react';
import { CentinelaConfig } from '../types/visualon';

interface WizardSetupScreenProps {
  config: CentinelaConfig;
  onSaveConfig: (updated: CentinelaConfig) => Promise<void>;
  onTriggerTestNotification: () => void;
  onToggleDaemon: () => void;
}

export const WizardSetupScreen: React.FC<WizardSetupScreenProps> = ({
  config,
  onSaveConfig,
  onTriggerTestNotification,
  onToggleDaemon,
}) => {
  const [formData, setFormData] = useState<CentinelaConfig>(config);
  const [showSmtpToken, setShowSmtpToken] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleChange = (field: keyof CentinelaConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveConfig(formData);
    setIsSaving(false);
    setSaveSuccessMsg('¡Configuración guardada y sincronizada correctamente en tu base de datos Supabase!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Encabezado Superior */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ajustes del Centinela &amp; Canales Ocultos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configura el correo y WhatsApp del propietario para el despacho silencioso de alertas
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleDaemon}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              formData.daemon_status === 'RUNNING'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Power className="w-4 h-4 text-emerald-600" />
            <span>Vigilante: {formData.daemon_status === 'RUNNING' ? 'ACTIVO' : 'PAUSADO'}</span>
          </button>

          <button
            onClick={onTriggerTestNotification}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Enviar Notificación de Prueba</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Cuadrícula de 2 Columnas de Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Canales de Notificación (WhatsApp y Correo) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tarjeta de Canal Correo Electrónico */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Canal 1: Correo Electrónico del Propietario
                </h2>
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Alerta con Foto &bull; Link
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Correo Electrónico Receptor
                </label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => handleChange('owner_email', e.target.value)}
                  placeholder="propietario@ejemplo.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  Aquí llegarán las fotos del intruso y el enlace de acceso directo.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    value={formData.smtp_server}
                    onChange={(e) => handleChange('smtp_server', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Puerto TLS
                  </label>
                  <input
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => handleChange('smtp_port', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña de Aplicación / Token Seguro (Cifrado con AES-256)
                </label>
                <div className="relative">
                  <input
                    type={showSmtpToken ? 'text' : 'password'}
                    value={formData.smtp_app_token}
                    onChange={(e) => handleChange('smtp_app_token', e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-sky-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpToken(!showSmtpToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showSmtpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Canal WhatsApp */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Canal 2: WhatsApp Móvil del Propietario
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Alerta Instantánea
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Número de WhatsApp (con código de país)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  Recibirás el mensaje con la foto del intruso y el enlace secreto para ingresar.
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Token de Despacho API WhatsApp
                </label>
                <div className="relative">
                  <input
                    type={showTwilioToken ? 'text' : 'password'}
                    value={formData.whatsapp_token}
                    onChange={(e) => handleChange('whatsapp_token', e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTwilioToken(!showTwilioToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Parámetros del Vigilante Oculto */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Comportamiento del Vigilante
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Interruptor 1: Modo Oculto */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Modo Totalmente Oculto</div>
                  <div className="text-[11px] text-slate-500">
                    No muestra ventanas emergentes ni alertas en la pantalla del equipo.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.stealth_mode}
                  onChange={(e) => handleChange('stealth_mode', e.target.checked)}
                  className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Interruptor 2: Inicio Automático */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Activar al Encender Computadora</div>
                  <div className="text-[11px] text-slate-500">
                    Dispara la cámara automáticamente en el arranque del sistema.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_start}
                  onChange={(e) => handleChange('auto_start', e.target.checked)}
                  className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Interruptor 3: Cifrado Offline */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Cifrado Offline AES-256</div>
                  <div className="text-[11px] text-slate-500">
                    Guarda la foto encriptada si el equipo no tiene internet en ese instante.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.offline_aes_encryption}
                  onChange={(e) => handleChange('offline_aes_encryption', e.target.checked)}
                  className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Campo Usuario del Sistema */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Usuario del Sistema Operativo
                </label>
                <input
                  type="text"
                  value={formData.os_username}
                  onChange={(e) => handleChange('os_username', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                />
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios en Base de Datos</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
