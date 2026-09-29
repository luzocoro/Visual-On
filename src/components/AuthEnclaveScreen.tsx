import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Key,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';

interface AuthEnclaveScreenProps {
  onSuccessfulAuth: () => void;
  latestEvidence?: ForensicEvidence | null;
  onSimulateIntruderTrigger: () => Promise<void>;
  onOpenUniversalCamera?: () => void;
  onViewDispatchAlert?: () => void;
  ownerEmail?: string;
  whatsappNumber?: string;
}

export const AuthEnclaveScreen: React.FC<AuthEnclaveScreenProps> = ({
  onSuccessfulAuth,
  onSimulateIntruderTrigger,
  onOpenUniversalCamera,
}) => {
  const [username, setUsername] = useState('luz_ocoro');
  const [password, setPassword] = useState('seguridad2026');
  const [showPassword, setShowPassword] = useState(false);
  const [keepTunnel, setKeepTunnel] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState<'facial' | 'fido' | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!username.trim()) {
      setAuthError('Error: Ingrese su identificador de seguridad.');
      return;
    }

    if (!password.trim()) {
      setAuthError('Error: Ingrese la clave de desbloqueo.');
      return;
    }

    if (password.length < 4) {
      setAuthError('Error: Clave de desbloqueo inválida. Mínimo 4 caracteres.');
      return;
    }

    setIsAuthenticating(true);

    try {
      if (onSimulateIntruderTrigger) {
        await onSimulateIntruderTrigger();
      }
    } catch (err) {
      console.warn('Captura al iniciar sesión:', err);
    }

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      setTimeout(() => {
        onSuccessfulAuth();
      }, 500);
    }, 500);
  };

  const handleBiometricAuth = async (type: 'facial' | 'fido') => {
    setAuthError(null);
    setBiometricScanning(type);
    
    if (type === 'facial' && onOpenUniversalCamera) {
      try {
        await onOpenUniversalCamera();
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      setBiometricScanning(null);
      setAuthSuccess(true);
      setTimeout(() => {
        onSuccessfulAuth();
      }, 500);
    }, 800);
  };

  const handleSilentSentinelMode = () => {
    setAuthSuccess(true);
    setTimeout(() => {
      onSuccessfulAuth();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#f3ba2f] selection:text-black">
      
      {/* CONTENEDOR PRINCIPAL: MARCO DE DOS COLUMNAS IDÉNTICO A LA IMAGEN EXACTA DEL USUARIO */}
      <div className="w-full max-w-[1140px] bg-[#07080b] rounded-2xl sm:rounded-3xl border border-[#181a24] shadow-2xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden my-auto">
        
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA: PANEL DE TELEMETRÍA (5 COLUMNAS EN LG) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 p-7 sm:p-9 lg:p-11 border-b lg:border-b-0 lg:border-r border-[#181a24] flex flex-col justify-between bg-[#08090d]">
          
          <div className="space-y-6">
            
            {/* Insignia / Escudo Superior Centrado con Caja Dorada */}
            <div className="flex justify-center pt-1">
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl bg-[#090b10] border border-[#262420] shadow-[0_0_35px_rgba(0,0,0,0.85)] p-2.5 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/gold_shield.jpg"
                  alt="Visual-On Logo"
                  className="w-full h-full object-cover rounded-xl drop-shadow-[0_4px_14px_rgba(243,186,47,0.35)]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Título Principal VISUAL-ON y Subtítulo de Telemetría */}
            <div className="text-center space-y-1.5 pt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-serif text-white tracking-[0.25em] uppercase font-normal drop-shadow-sm">
                VISUAL-ON
              </h1>
              <p className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-[#f3ba2f] leading-relaxed">
                FORENSIC SURVEILLANCE &amp; SENTINEL<br />TELEMETRY
              </p>
            </div>

            {/* Tarjetas Informativas de Estado */}
            <div className="space-y-3.5 pt-3">
              
              {/* Tarjeta 1: VIGILANCIA ÓPTICA CONTINUA */}
              <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#1b1e28] hover:border-[#282c3c] transition-colors flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#141620] border border-[#202332] flex items-center justify-center shrink-0 mt-0.5 text-[#f3ba2f]">
                  <Eye className="w-5 h-5 text-[#f3ba2f]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-white tracking-wider uppercase">
                    VIGILANCIA ÓPTICA CONTINUA
                  </h2>
                  <p className="text-[11px] text-[#8e95a5] leading-relaxed font-sans">
                    Monitoreo neural en tiempo real con aislamiento de anomalías por visión computacional.
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: CRIPTO-ENCLAVE HSM */}
              <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#1b1e28] hover:border-[#282c3c] transition-colors flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#141620] border border-[#202332] flex items-center justify-center shrink-0 mt-0.5 text-[#f3ba2f]">
                  <Lock className="w-5 h-5 text-[#f3ba2f]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-white tracking-wider uppercase">
                    CRIPTO-ENCLAVE HSM
                  </h2>
                  <p className="text-[11px] text-[#8e95a5] leading-relaxed font-sans">
                    Almacén seguro de llaves maestras blindadas contra extracción cuántica y volcado de memoria.
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Parte Inferior Izquierda: DAEMON: STANDBY y BUILD 2.4.9 GOLD */}
          <div className="pt-6 mt-8 border-t border-[#181a24] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f3ba2f]" />
              <span className="text-[#e2e4e9] font-medium tracking-wide">DAEMON: STANDBY</span>
            </div>
            <div className="text-[#f3ba2f] font-bold tracking-wider">
              BUILD 2.4.9 GOLD
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA: CREDENCIALES (7 COLUMNAS EN LG)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 p-7 sm:p-9 lg:p-11 flex flex-col justify-between bg-[#07080b]">
          
          <div className="space-y-5">
            
            {/* Etiqueta de Aviso: CONTROL DE ACCESO RESTRINGIDO (IDÉNTICA A LA IMAGEN) */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#f3ba2f]/40 bg-[#f3ba2f]/10 text-[#f3ba2f] text-[10px] font-mono font-bold tracking-widest uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-[#f3ba2f]" />
                <span>CONTROL DE ACCESO RESTRINGIDO</span>
              </div>
            </div>

            {/* Título y Subtítulo de Credenciales */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-serif font-normal text-white tracking-wide uppercase drop-shadow-sm">
                CREDENCIALES DE AUTENTICACIÓN
              </h2>
              <p className="text-xs text-[#8e95a5]">
                Ingrese su identificación corporativa para autorizar la sesión forense criptográfica.
              </p>
            </div>

            {/* Mensajes de Alerta / Error / Éxito */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Acceso autorizado. Ingresando al panel de control...</span>
              </div>
            )}

            {/* Formulario de Autenticación Exacto */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              
              {/* CAMPO 1: IDENTIFICADOR DE SEGURIDAD / USUARIO SO */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-[#f3ba2f] tracking-widest uppercase">
                  IDENTIFICADOR DE SEGURIDAD / USUARIO SO
                </label>
                
                <div className="relative flex items-center bg-[#040507] border border-[#1b1e28] rounded-xl px-4 py-3 focus-within:border-[#f3ba2f]/60 transition-colors">
                  <User className="w-4 h-4 text-[#8e95a5] mr-3 shrink-0" />
                  
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="luz_ocoro"
                    className="bg-transparent text-white font-mono text-sm w-full outline-none"
                  />

                  {/* Insignia 'ID VÁLIDO' en Verde */}
                  <div className="px-2 py-0.5 rounded border border-[#0d5238] bg-[#041f17] text-[#10b981] font-mono text-[10px] font-bold tracking-wider shrink-0 select-none flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>ID VÁLIDO</span>
                  </div>
                </div>
              </div>

              {/* CAMPO 2: CLAVE DE DESBLOQUEO / TOKEN KEYRING */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono font-bold text-[#f3ba2f] tracking-widest uppercase">
                    CLAVE DE DESBLOQUEO / TOKEN KEYRING
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('seguridad2026')}
                    className="text-xs text-[#f3ba2f] hover:underline font-sans cursor-pointer"
                  >
                    ¿Recuperar llaves de Enclave?
                  </button>
                </div>

                <div className="relative flex items-center bg-[#040507] border border-[#1b1e28] rounded-xl px-4 py-3 focus-within:border-[#f3ba2f]/60 transition-colors">
                  <Lock className="w-4 h-4 text-[#8e95a5] mr-3 shrink-0" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••••••"
                    className="bg-transparent text-white font-mono text-sm w-full outline-none tracking-widest"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#8e95a5] hover:text-white transition-colors cursor-pointer ml-2 shrink-0"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CASILLA DE VERIFICACIÓN: Mantener túnel de enlace cifrado + TTL: 8 HORAS */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-white select-none">
                  <input
                    type="checkbox"
                    checked={keepTunnel}
                    onChange={(e) => setKeepTunnel(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1b1e28] bg-[#040507] text-[#f3ba2f] accent-[#f3ba2f] cursor-pointer"
                  />
                  <span className="text-xs font-normal">Mantener túnel de enlace cifrado</span>
                </label>

                <span className="text-xs font-mono font-bold text-[#f3ba2f] tracking-wider">
                  TTL: 8 HORAS
                </span>
              </div>

              {/* BOTÓN PRINCIPAL GRANDE: INICIAR SESIÓN SEGURA */}
              <button
                type="submit"
                disabled={isAuthenticating || authSuccess}
                className="w-full py-4 rounded-xl bg-[#f3ba2f] hover:bg-[#ffc83b] active:scale-[0.99] text-black font-black text-sm tracking-[0.16em] uppercase shadow-[0_0_30px_rgba(243,186,47,0.35)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3 flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>AUTORIZANDO ENCLAVE...</span>
                  </>
                ) : authSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>ACCESO AUTORIZADO</span>
                  </>
                ) : (
                  <span>INICIAR SESIÓN SEGURA</span>
                )}
              </button>
            </form>

            {/* DIVISOR: O AUTENTICACIÓN BIOMÉTRICA / FIDO2 */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-[#181a24]"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-[#666c7a] uppercase">
                O AUTENTICACIÓN BIOMÉTRICA / FIDO2
              </span>
              <div className="flex-grow border-t border-[#181a24]"></div>
            </div>

            {/* BOTONES SECUNDARIOS: Iris / Facial y FIDO2 / YubiKey */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleBiometricAuth('facial')}
                disabled={biometricScanning !== null || isAuthenticating}
                className="py-3 px-4 rounded-xl bg-[#040507] border border-[#1b1e28] hover:border-[#f3ba2f]/50 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#f3ba2f]" />
                <span>{biometricScanning === 'facial' ? 'Escaneando...' : 'Iris / Facial'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBiometricAuth('fido')}
                disabled={biometricScanning !== null || isAuthenticating}
                className="py-3 px-4 rounded-xl bg-[#040507] border border-[#1b1e28] hover:border-[#f3ba2f]/50 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4 text-[#f3ba2f]" />
                <span>{biometricScanning === 'fido' ? 'Leyendo...' : 'FIDO2 / YubiKey'}</span>
              </button>
            </div>

          </div>

          {/* ENLACE INFERIOR: Acceder en Modo Centinela Silencioso (Daemon Standby) > */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleSilentSentinelMode}
              className="text-xs text-[#8e95a5] hover:text-[#f3ba2f] font-sans transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
            >
              <span>Acceder en Modo Centinela Silencioso (Daemon Standby)</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
