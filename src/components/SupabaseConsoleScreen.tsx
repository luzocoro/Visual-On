import React, { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  Key,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  ExternalLink,
  Code2,
  Table,
  Terminal,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  SUPABASE_MIGRATION_SQL,
  getStoredSupabaseCredentials,
  resetSupabaseClient,
  getCentinelaConfigFromSupabase,
  getForensicEvidencesFromSupabase,
  getOfflineQueueFromSupabase,
  seedSupabaseDatabase,
} from '../lib/supabase';

interface SupabaseConsoleScreenProps {
  onRefreshAllData?: () => void;
}

export const SupabaseConsoleScreen: React.FC<SupabaseConsoleScreenProps> = ({ onRefreshAllData }) => {
  const credentials = getStoredSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(credentials.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(credentials.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'tables' | 'sql'>('tables');
  const [copiedSql, setCopiedSql] = useState(false);

  // Estado de comprobación de tablas en Supabase
  const [dbStatus, setDbStatus] = useState<{
    configTable: { exists: boolean; count: number; error?: string };
    incidentsTable: { exists: boolean; count: number; error?: string };
    queueTable: { exists: boolean; count: number; error?: string };
    latencyMs?: number;
    checked: boolean;
  }>({
    configTable: { exists: false, count: 0 },
    incidentsTable: { exists: false, count: 0 },
    queueTable: { exists: false, count: 0 },
    checked: false,
  });

  const checkTables = async () => {
    setIsTesting(true);
    const start = performance.now();
    try {
      const configRes = await getCentinelaConfigFromSupabase();
      const incRes = await getForensicEvidencesFromSupabase();
      const queueRes = await getOfflineQueueFromSupabase();
      const latencyMs = Math.round(performance.now() - start);

      setDbStatus({
        configTable: {
          exists: configRes.source === 'SUPABASE_REAL',
          count: configRes.data ? 1 : 0,
          error: configRes.error || undefined,
        },
        incidentsTable: {
          exists: incRes.source === 'SUPABASE_REAL',
          count: incRes.data ? incRes.data.length : 0,
          error: incRes.error || undefined,
        },
        queueTable: {
          exists: queueRes.source === 'SUPABASE_REAL',
          count: queueRes.data ? queueRes.data.length : 0,
          error: queueRes.error || undefined,
        },
        latencyMs,
        checked: true,
      });

      if (onRefreshAllData) {
        onRefreshAllData();
      }
    } catch {
      setDbStatus((prev) => ({ ...prev, checked: true }));
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    checkTables();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveCredentials = () => {
    resetSupabaseClient(supabaseUrl.trim(), supabaseAnonKey.trim());
    checkTables();
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await seedSupabaseDatabase();
    setIsSeeding(false);
    if (res.success) {
      setSeedResult({
        success: true,
        message: '¡Se insertaron exitosamente 3 registros reales por cada tabla en tu base de datos Supabase!',
      });
      await checkTables();
    } else {
      setSeedResult({
        success: false,
        message: `Asegúrate de ejecutar primero el script SQL en Supabase para crear las tablas. (${res.error || 'Error'})`,
      });
    }
  };

  const allTablesOk = dbStatus.configTable.exists && dbStatus.incidentsTable.exists && dbStatus.queueTable.exists;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Encabezado Superior */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Consola de Integración &bull; Supabase Backend
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conexión exclusiva con tu proyecto Supabase oficial &bull; Políticas RLS de Seguridad y Fotos Reales
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={checkTables}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Verificar Conexión</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/wjjutipebdevlieccvmm"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Ir a Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tarjeta de Estado de Conexión */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
        allTablesOk
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/70 border-amber-200 text-amber-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold">
              {allTablesOk ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Base de Datos Supabase Conectada y Operativa</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Paso Requerido: Crear las Tablas en el SQL Editor de Supabase</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed max-w-2xl">
              {allTablesOk
                ? `La aplicación está consumiendo el 100% de los datos reales alojados en tu base de datos (${supabaseUrl}). No se utilizan datos simulados ni ficticios.`
                : `Tu proyecto de Supabase está enlazado correctamente. Para que la app pueda leer y guardar datos reales, copia el script SQL y ejecútalo en el SQL Editor de tu panel.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Sembrar 3 Registros vía API</span>
            </button>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL Completo'}</span>
            </button>
          </div>
        </div>

        {seedResult && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            seedResult.success
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-rose-100 border-rose-300 text-rose-800'
          }`}>
            {seedResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{seedResult.message}</span>
          </div>
        )}
      </div>

      {/* Pestañas de Información */}
      <div className="flex border-b border-slate-200 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'tables'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Tablas y Registros de la Base de Datos
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sql'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Script SQL Completo (DDL + RLS)
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'guide'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Guía Paso a Paso en Supabase
        </button>
      </div>

      {/* Pestaña: Tablas y Registros */}
      {activeTab === 'tables' && (
        <div className="space-y-5 text-xs">
          
          {/* Tabla 1 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Table className="w-4 h-4 text-sky-600" />
                <span>TABLA 1: visualon_centinela_config (Configuración del Vigilante)</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                dbStatus.configTable.exists
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                {dbStatus.configTable.exists ? `EN LÍNEA (${dbStatus.configTable.count} REGISTROS)` : 'PENDIENTE'}
              </span>
            </div>

            <p className="text-slate-500">
              Almacena el correo receptor del propietario, teléfono de WhatsApp, tokens de despacho y parámetros de modo oculto.
            </p>
          </div>

          {/* Tabla 2 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Table className="w-4 h-4 text-sky-600" />
                <span>TABLA 2: visualon_incidents (Fotografías y Evidencia Forense)</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                dbStatus.incidentsTable.exists
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                {dbStatus.incidentsTable.exists ? `EN LÍNEA (${dbStatus.incidentsTable.count} REGISTROS)` : 'PENDIENTE'}
              </span>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Registro inmutable de capturas fotográficas de intrusos, geolocalización, metadata de red, latencias y hashes SHA-256. La columna <code>photo_url</code> (tipo TEXT) almacena la fotografía forense real mediante enlace público HTTPS, URL de Supabase Storage o formato Base64 JPEG, permitiendo previsualizarla directamente en Supabase y en la interfaz.
            </p>
          </div>

          {/* Tabla 3 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Table className="w-4 h-4 text-sky-600" />
                <span>TABLA 3: visualon_offline_queue (Cola Cifrada Fuera de Línea)</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                dbStatus.queueTable.exists
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                {dbStatus.queueTable.exists ? `EN LÍNEA (${dbStatus.queueTable.count} REGISTROS)` : 'PENDIENTE'}
              </span>
            </div>

            <p className="text-slate-500">
              Bóveda cifrada de capturas tomadas cuando no había internet en el equipo.
            </p>
          </div>

        </div>
      )}

      {/* Pestaña: Script SQL */}
      {activeTab === 'sql' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Script SQL Oficial para Ejecutar en Supabase
              </h2>
              <p className="text-slate-500 text-[11px]">
                Crea las 3 tablas, habilita Row Level Security e inserta 3 registros con fotografías visibles
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar Código SQL'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto max-h-[500px] font-mono text-[11px] leading-relaxed">
            <pre>{SUPABASE_MIGRATION_SQL}</pre>
          </div>
        </div>
      )}

      {/* Pestaña: Guía Paso a Paso */}
      {activeTab === 'guide' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs text-slate-700">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Instrucciones para Configurar tu Base de Datos en Supabase
            </h2>
            <p className="text-slate-500 mt-1">
              Sigue estos sencillos pasos para dejar las tablas listas en 1 minuto:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Ingresa al Dashboard de tu Proyecto en Supabase</span>
              </div>
              <p className="text-slate-600 pl-7">
                Abre <code>https://supabase.com/dashboard/project/wjjutipebdevlieccvmm</code> en tu navegador.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Abre el Editor SQL (SQL Editor)</span>
              </div>
              <p className="text-slate-600 pl-7">
                En el menú lateral izquierdo de Supabase, haz clic en el icono con símbolo de terminal o SQL Editor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">3</span>
                <span>Pega el Script SQL y haz clic en &quot;Run&quot;</span>
              </div>
              <p className="text-slate-600 pl-7">
                Copia el script de la pestaña anterior, pégalo en una nueva consulta y presiona el botón verde <strong>Run</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">4</span>
                <span>Verificación Automática</span>
              </div>
              <p className="text-slate-600 pl-7">
                Regresa a esta ventana y presiona <strong>&quot;Verificar Conexión&quot;</strong>. La aplicación leerá los registros en vivo.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
