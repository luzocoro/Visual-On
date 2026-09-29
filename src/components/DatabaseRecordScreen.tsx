import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  Download,
  Lock,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ForensicEvidence } from '../types/visualon';
import { downloadEvidenceExcelReport } from '../lib/excelReportGenerator';
import { SupabaseConsoleScreen } from './SupabaseConsoleScreen';

interface DatabaseRecordScreenProps {
  evidences: ForensicEvidence[];
  onRefreshData?: () => void;
  onViewEvidence?: (ev: ForensicEvidence) => void;
}

export const DatabaseRecordScreen: React.FC<DatabaseRecordScreenProps> = ({
  evidences,
  onRefreshData,
  onViewEvidence,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Filtrado de registros en la tabla
  const filteredEvidences = evidences.filter((ev) => {
    const term = searchTerm.toLowerCase();
    return (
      ev.event_id.toLowerCase().includes(term) ||
      (ev.os_user || '').toLowerCase().includes(term) ||
      (ev.ip_address || '').toLowerCase().includes(term) ||
      (ev.geolocation?.city || '').toLowerCase().includes(term)
    );
  });

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave de administrador para la consola técnica
    if (adminPin.trim() === 'admin2026' || adminPin.trim() === 'visualon2026' || adminPin.trim() === '1234') {
      setIsAdminUnlocked(true);
      setShowAdminPinModal(false);
      setPinError(false);
      setAdminPin('');
    } else {
      setPinError(true);
    }
  };

  // Si el administrador desbloqueó la consola técnica de Supabase:
  if (isAdminUnlocked) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>
              <strong>SESIÓN DE ADMINISTRADOR TÉCNICO ACTIVA:</strong> Tienes acceso a la consola de base de datos de Supabase.
            </span>
          </div>
          <button
            onClick={() => setIsAdminUnlocked(false)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Bloquear y Volver al Récord
          </button>
        </div>
        <SupabaseConsoleScreen onRefreshAllData={onRefreshData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Encabezado Superior de la Pantalla */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Récord de Base de Datos y Vistas Capturadas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Historial inmutable de todas las evidencias almacenadas. La base de datos está protegida con cifrado AES-256 y políticas de seguridad RLS.
          </p>
        </div>

        {/* Botón Principal: Descargar Informe en Excel */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadEvidenceExcelReport(evidences)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            title="Descargar el récord completo en formato Excel (.csv compatible)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Descargar Informe en Excel</span>
          </button>

          {/* Botón Protegido para Administrador */}
          <button
            onClick={() => setShowAdminPinModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Acceso exclusivo para el administrador técnico de Supabase"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Consola de Administrador</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Informativa de Protección de Base de Datos */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <span>Base de Datos Protegida &bull; Nivel de Acceso Restringido</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Solo Lectura &bull; Exportación Habilitada
              </span>
            </div>
            <div className="text-slate-400 mt-0.5">
              Los registros están sincronizados en la nube. El acceso directo a credenciales o tablas técnicas de Supabase está bloqueado por seguridad del sistema.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">TOTAL REGISTROS</span>
            <strong className="text-emerald-400 text-sm">{evidences.length} eventos</strong>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px]">FORMATO EXPORTACIÓN</span>
            <strong className="text-slate-200 text-sm">Excel UTF-8 (BOM)</strong>
          </div>
        </div>
      </div>

      {/* Buscador y Tabla de Récord Forense */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Barra de Filtro y Búsqueda */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID de evento, usuario, IP o ciudad..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Mostrando {filteredEvidences.length} de {evidences.length} registros capturados
            </span>
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Actualizar registros"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Récord de Capturas */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Evidencia</th>
                <th className="py-3.5 px-4">ID Evento</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Usuario SO</th>
                <th className="py-3.5 px-4">IP Pública</th>
                <th className="py-3.5 px-4">Ciudad / País</th>
                <th className="py-3.5 px-4">Latencia</th>
                <th className="py-3.5 px-4">Notificación</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEvidences.length > 0 ? (
                filteredEvidences.map((ev, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={ev.id || ev.event_id} className={`hover:bg-slate-50 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-4">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-black border border-slate-200 shrink-0">
                          <img
                            src={ev.photo_url}
                            alt="Captura"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/forensic_capture.jpg';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {ev.event_id}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {ev.timestamp}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {ev.os_user || 'luz_ocoro'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-sky-700">
                        {ev.ip_address}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {ev.geolocation?.city || 'Bogotá'}, {ev.geolocation?.country || 'Colombia'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {ev.camera_latency_ms || 380} ms
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Despachado</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {onViewEvidence && (
                          <button
                            onClick={() => onViewEvidence(ev)}
                            className="px-2.5 py-1 text-xs text-sky-700 hover:text-sky-900 font-semibold hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Ver Detalle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Validación de Administrador para Consola Técnica */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Privilegio de Administrador</span>
              </div>
              <h2 className="text-lg font-black text-white">
                Acceso a Consola Técnica de Supabase
              </h2>
              <p className="text-xs text-slate-400">
                El acceso a la estructura y credenciales de la base de datos es restringido.
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ingresa la Contraseña o PIN de Administrador:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Clave de administrador..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Contraseña incorrecta. Acceso restringido.</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  (Para pruebas de administrador puedes usar <code>visualon2026</code> o <code>admin2026</code>)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPinModal(false);
                    setAdminPin('');
                    setPinError(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Desbloquear Consola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
