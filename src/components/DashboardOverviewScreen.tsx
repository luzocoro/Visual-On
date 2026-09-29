import React, { useState } from 'react';
import {
  Shield,
  Camera,
  Wifi,
  Lock,
  Zap,
  Activity,
  AlertTriangle,
  Server,
  Database,
  ArrowUpRight,
  Clock,
  Layers,
  Send,
  Smartphone,
  Mail,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { CentinelaConfig, ForensicEvidence, OfflineQueueItem } from '../types/visualon';
import { generateFullAuditPdf, generateSingleIntruderPdf } from '../lib/pdfReportGenerator';
import { downloadEvidenceExcelReport } from '../lib/excelReportGenerator';

interface DashboardOverviewScreenProps {
  config: CentinelaConfig;
  evidences: ForensicEvidence[];
  queueItems: OfflineQueueItem[];
  isOnline: boolean;
  onNavigateTab: (tab: string) => void;
  onTriggerInstantCapture: () => void;
  onViewEvidence: (ev: ForensicEvidence) => void;
  onOpenUniversalCamera?: () => void;
  onViewDispatchModal?: (ev: ForensicEvidence) => void;
}

export const DashboardOverviewScreen: React.FC<DashboardOverviewScreenProps> = ({
  config,
  evidences,
  queueItems,
  isOnline,
  onNavigateTab,
  onTriggerInstantCapture,
  onViewEvidence,
  onOpenUniversalCamera,
  onViewDispatchModal,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const latestIncident = evidences[0];
  const pendingQueueCount = queueItems.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Banner Superior Principal Organizado y Profesional */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-200/50 space-y-5">
        
        {/* Imagen del Producto y Nombre de la Página Tamaño Grande */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-slate-100 border-2 border-amber-400/80 p-2 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
            <img
              src="/assets/gold_shield.jpg"
              alt="Visual-On Logo"
              className="w-full h-full object-contain rounded-xl drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Panel de Control y Vigilancia
            </h1>

            {/* Debajo y Organizado: Solo Propietario y Estado del Vigilante (Sin Base de Datos) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 pt-0.5">
              <span>
                Propietario registrado: <strong className="text-slate-900 font-bold">{config.os_username}</strong>
              </span>
              <span className="text-slate-300 font-bold">&bull;</span>
              <span className="inline-flex items-center gap-1.5">
                <span>Estado del vigilante:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{config.daemon_status || 'STANDBY'}</span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Información de Canales Vinculados del Vigilante */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Canal WhatsApp Vinculado:</span>
              <strong className="text-slate-900 font-mono">{config.whatsapp_number || '+57 300 123 4567'}</strong>
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>Correo Vinculado:</span>
              <strong className="text-slate-900">{config.owner_email || 'luzamardi@gmail.com'}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                setIsGeneratingPdf(true);
                try {
                  await generateFullAuditPdf(evidences, config);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Descargar informe completo en formato PDF con todos los intrusos, mapas y estado del equipo"
            >
              <FileDown className="w-3.5 h-3.5 text-[#f3ba2f]" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Informe Completo (PDF)'}</span>
            </button>

            <button
              onClick={() => downloadEvidenceExcelReport(evidences)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Descargar récord de todas las capturas y datos en formato Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              <span>Récord en Excel</span>
            </button>

            <button
              onClick={() => onNavigateTab('wizard')}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ajustes del Centinela
            </button>
          </div>
        </div>

      </div>

      {/* 4 Tarjetas de Métricas en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Métrica 1: Total de Intrusiones */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Intrusiones Registradas</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {evidences.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-between">
            <span>100% en Base de Datos</span>
            <span className="text-slate-400">ISO/IEC 27037</span>
          </div>
        </div>

        {/* Métrica 2: Alertas Despachadas */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Canales Notificados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 pt-1">
            Correo + WhatsApp
          </div>
          <div className="text-[11px] text-sky-600 font-medium flex items-center justify-between">
            <span>{config.owner_email || 'luz.ocoro@ejemplo.com'}</span>
            <span className="text-emerald-600 font-bold">Activo</span>
          </div>
        </div>

        {/* Métrica 3: Cola Fuera de Línea */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Cola Fuera de Línea</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tabular-nums">
            {pendingQueueCount}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Bóveda Local AES-256</span>
            <span className={isOnline ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {isOnline ? 'Sincronizable' : 'En Espera'}
            </span>
          </div>
        </div>

        {/* Métrica 4: Latencia de Cámara */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Velocidad de Captura</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            380 ms
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Disparo Instantáneo</span>
            <span className="text-emerald-600 font-semibold">&lt; 0.5 seg</span>
          </div>
        </div>

      </div>

      {/* Sección Dividida en 2 Columnas: Última Captura Forense + Canales de Notificación */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Foco en la Última Captura Forense */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Última Captura Detectada en el Equipo
              </h2>
            </div>

            {latestIncident && (
              <button
                onClick={() => onNavigateTab('forensics')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Expediente Completo</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {latestIncident ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                
                {/* Imagen del Intruso */}
                <div className="sm:col-span-5 relative rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-4/3 border border-slate-200 group">
                  <img
                    src={latestIncident.photo_url}
                    alt="Foto capturada del intruso"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span>INTRUSO IDENTIFICADO</span>
                    {latestIncident.photo_url_secondary && (
                      <span className="bg-black/40 px-1 rounded text-[9px] font-mono">2 FOTOS</span>
                    )}
                  </div>
                  <div className="absolute bottom-2 inset-x-2 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded flex items-center justify-between">
                    <span>{latestIncident.camera_latency_ms} ms</span>
                    <span className="font-mono text-emerald-400">
                      {latestIncident.photo_url_secondary ? '2 CAPTURAS • CÁMARA OFF' : 'SHA-256 OK'}
                    </span>
                  </div>
                </div>

                {/* Detalles del Incidente */}
                <div className="sm:col-span-7 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Identificador:</span>
                    <span className="font-mono font-bold text-slate-900">{latestIncident.event_id}</span>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Usuario SO que inició:</span>
                    <span className="font-bold text-slate-800">{latestIncident.os_user}</span>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Dirección IP:</span>
                    <span className="font-mono font-semibold text-sky-700">{latestIncident.ip_address}</span>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Ubicación Geográfica:</span>
                    <span className="font-medium text-slate-800">{latestIncident.geolocation?.city || 'Bogotá D.C.'}, {latestIncident.geolocation?.country || 'Colombia'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fecha y Hora:</span>
                    <span className="font-medium text-slate-700">{latestIncident.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Ver Alerta Despachada (WhatsApp & Correo) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-600 text-[11px]">
                  La alerta oculta con foto y enlace seguro fue enviada a tu correo y teléfono.
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => generateSingleIntruderPdf(latestIncident, config)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Descargar informe pericial en PDF de este intruso con fotografía y datos de rastreo"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Informe PDF</span>
                  </button>

                  {onViewDispatchModal && (
                    <button
                      onClick={() => onViewDispatchModal(latestIncident)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Ver Alerta WhatsApp</span>
                    </button>
                  )}

                  <button
                    onClick={() => onViewEvidence(latestIncident)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Expediente</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800">No hay capturas registradas aún</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  En cuanto alguien encienda la computadora o inicie sesión, su rostro será capturado y se mostrará aquí de inmediato.
                </p>
              </div>
              <button
                onClick={onTriggerInstantCapture}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Hacer Disparo de Prueba Ahora
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Canales y Configuración Silenciosa */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tarjeta de Canales Ocultos Activos */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Canales de Alerta Oculta
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Operativos
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Canal WhatsApp */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    WhatsApp del Propietario
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                    Conectado
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">{config.whatsapp_number || '+57 300 123 4567'}</div>
                <div className="text-[10px] text-slate-500">
                  Envía foto, hora, IP y enlace de acceso directo al chat privado.
                </div>
              </div>

              {/* Canal Correo Electrónico */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-sky-600" />
                    Correo Electrónico Receptor
                  </span>
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
                    TLS 587
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">{config.owner_email || 'luz.ocoro@ejemplo.com'}</div>
                <div className="text-[10px] text-slate-500">
                  Notificación cifrada con expediente adjunto y botón de acceso.
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('wizard')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cambiar Correo o Número de WhatsApp
            </button>
          </div>

          {/* Tarjeta de Comprobación de Arranque Silencioso */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl border border-blue-200/80 p-6 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Modo Oculto en Inicio del Sistema</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              El centinela está configurado para ejecutarse silenciosamente en segundo plano (daemon). La persona frente a la pantalla no recibe alertas ni avisos sonoros mientras se transmite la evidencia.
            </p>
            <div className="pt-1 flex items-center justify-between text-xs text-blue-900 font-medium">
              <span>Arranque Automático:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ACTIVADO</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
