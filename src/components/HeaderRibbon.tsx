import React from 'react';
import {
  Shield,
  Camera,
  Wifi,
  Lock,
  Bell,
  Database,
  FileSpreadsheet,
  LogOut,
  Zap,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react';

interface HeaderRibbonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  isCamReady: boolean;
  openEmailModal: boolean;
  setOpenEmailModal: (open: boolean) => void;
  onOpenUniversalCamera?: () => void;
  onLogout?: () => void;
  onSimulateIntruderTrigger?: () => void;
  ownerName?: string;
  unreadAlertsCount?: number;
}

export const HeaderRibbon: React.FC<HeaderRibbonProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  setIsOnline,
  isCamReady,
  openEmailModal,
  setOpenEmailModal,
  onOpenUniversalCamera,
  onLogout,
  onSimulateIntruderTrigger,
  ownerName = 'Luz Ocoro',
  unreadAlertsCount = 1,
}) => {
  return (
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs sticky top-0 z-40 shadow-xs">
      
      {/* Zona de Marca y Logo Imponente y Profesional */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-slate-100 border-2 border-amber-400/80 shadow-md shadow-amber-500/10 p-1.5 shrink-0 group">
          <img
            src="/assets/gold_shield.jpg"
            alt="Visual-On Logo"
            className="w-full h-full object-contain rounded-xl drop-shadow-xs transform group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="font-black text-xl sm:text-2xl tracking-wider text-slate-950 uppercase font-sans drop-shadow-xs flex items-center">
            <span>VISUAL</span>
            <span className="text-sky-600">-ON</span>
          </h1>
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase font-mono px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
            FORENSIC
          </span>
        </div>
      </div>

      {/* Indicadores de Hardware y Telemetría en Vivo */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Estado de Conexión de Red */}
        <button
          type="button"
          onClick={() => setIsOnline(!isOnline)}
          title="Alternar estado de conexión a internet para probar la cola offline"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isOnline
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>{isOnline ? 'En Línea' : 'Sin Conexión (Offline)'}</span>
        </button>

        {/* Récord de Base de Datos e Informe Excel */}
        <button
          type="button"
          onClick={() => setActiveTab('database_record')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'database_record'
              ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'
          }`}
          title="Ver récord forense de capturas y descargar informe en Excel"
        >
          <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'database_record' ? 'text-white' : 'text-emerald-600'}`} />
          <span>Récord en Excel</span>
        </button>
      </div>

      {/* Acciones del Propietario */}
      <div className="flex items-center gap-2">
        {/* Botón de Bandeja de Alertas (WhatsApp / Correo) */}
        <button
          type="button"
          onClick={() => setOpenEmailModal(true)}
          className="relative p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          title="Ver alertas despachadas por WhatsApp y Correo Electrónico"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline text-xs font-medium">Alertas Despachadas</span>
          {unreadAlertsCount > 0 && (
            <>
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
            </>
          )}
        </button>

        {/* Perfil del Propietario & Cerrar Sesión */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 text-sky-800 font-bold flex items-center justify-center text-xs">
            LO
          </div>

          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-900">{ownerName}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Propietario Autenticado</div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Cerrar Sesión y Bloquear Pantalla"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
