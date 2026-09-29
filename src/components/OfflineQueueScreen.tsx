import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';
import { OfflineQueueItem } from '../types/visualon';

interface OfflineQueueScreenProps {
  queueItems: OfflineQueueItem[];
  isOnline: boolean;
  onToggleNetwork: () => void;
  onFlushQueue: () => Promise<void>;
  onTriggerOfflineCapture: () => Promise<void>;
}

export const OfflineQueueScreen: React.FC<OfflineQueueScreenProps> = ({
  queueItems,
  isOnline,
  onToggleNetwork,
  onFlushQueue,
  onTriggerOfflineCapture,
}) => {
  const [isFlushing, setIsFlushing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'diagram'>('queue');
  const [syncFeedback, setSyncFeedback] = useState('');

  const handleFlush = async () => {
    if (!isOnline) {
      setSyncFeedback('Imposible sincronizar: No hay conexión a internet activa.');
      setTimeout(() => setSyncFeedback(''), 4000);
      return;
    }
    setIsFlushing(true);
    await onFlushQueue();
    setIsFlushing(false);
    setSyncFeedback('¡Cola procesada! Las evidencias se transmitieron y sincronizaron con Supabase.');
    setTimeout(() => setSyncFeedback(''), 4500);
  };

  const pendingCount = queueItems.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Encabezado Superior */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cola Fuera de Línea &amp; Bóveda Cifrada
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Almacenamiento local protegido con AES-256 cuando no hay conexión a internet disponible
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onToggleNetwork}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
            <span>Internet: {isOnline ? 'CONECTADO' : 'DESCONECTADO'}</span>
          </button>

          <button
            onClick={onTriggerOfflineCapture}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Simular Captura sin Internet</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Selector de Pestañas: Lista de Cola o Diagrama */}
      <div className="flex border-b border-slate-200 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Paquetes en Cola ({queueItems.length})
        </button>

        <button
          onClick={() => setActiveTab('diagram')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'diagram'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Diagrama de Sincronización Silenciosa
        </button>
      </div>

      {activeTab === 'queue' ? (
        <div className="space-y-4">
          
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Paquetes en Bóveda Local</div>
              <div className="text-2xl font-black text-slate-900">{queueItems.length}</div>
              <div className="text-[11px] text-amber-600 font-medium">Cifrado AES-256-GCM</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Reintentos de Conexión</div>
              <div className="text-2xl font-black text-sky-600">Cada 30s</div>
              <div className="text-[11px] text-slate-500">Escucha activa en segundo plano</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Sincronización con Supabase</div>
              <div className="text-2xl font-black text-emerald-600">
                {isOnline ? 'Listo para Subir' : 'En Pausa'}
              </div>
              <div className="text-[11px] text-slate-500">Mantiene la inmutabilidad forense</div>
            </div>
          </div>

          {/* Barra de Acción para Desahogar la Cola */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Las fotos se almacenan cifradas localmente y solo se transmiten al detectar conexión a internet.
              </span>
            </div>

            <button
              onClick={handleFlush}
              disabled={isFlushing || pendingCount === 0 || !isOnline}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              {isFlushing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando ahora...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procesar y Sincronizar Cola ({pendingCount} pendientes)</span>
                </>
              )}
            </button>
          </div>

          {/* Tabla de Elementos en Cola */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Identificador &bull; Miniatura</th>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Usuario SO</th>
                  <th className="p-3.5">Carga Cifrada (AES-256)</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Reintentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No hay eventos pendientes en la cola fuera de línea. Todas las alertas se enviaron en tiempo real.
                    </td>
                  </tr>
                ) : (
                  queueItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <img
                          src={item.photo_preview}
                          alt="Miniatura"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                          }}
                          className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                        />
                        <span>{item.event_id}</span>
                      </td>
                      <td className="p-3.5 text-slate-500">{item.created_at}</td>
                      <td className="p-3.5 font-medium text-slate-800">{item.os_user}</td>
                      <td className="p-3.5 font-mono text-[11px] text-amber-700">
                        {item.encrypted_blob.slice(0, 24)}...
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'PENDING'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status === 'PENDING' ? 'PENDIENTE' : 'SINCRONIZADO'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{item.retry_attempts}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Diagrama de Sincronización */
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              Mecanismo de Tolerancia a Fallos y Despacho Silencioso
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              Si el intruso desconecta el Wi-Fi o apaga el router, el centinela guarda la foto cifrada en disco y la transmite inmediatamente en cuanto se detecte conexión.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            <img
              src="/assets/incident_diagram_flow_1790266211577.jpg"
              alt="Diagrama de Flujo de Incidentes"
              className="w-full h-auto object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
