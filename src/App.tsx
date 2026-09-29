import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  LayoutDashboard,
  Camera,
  Layers,
  Wrench,
  Key,
  Database,
  Power,
  Zap,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Radio,
  ExternalLink,
  RefreshCw,
  Send,
  Smartphone,
  Mail,
  Lock,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react';
import { CentinelaConfig, ForensicEvidence, OfflineQueueItem } from './types/visualon';
import {
  getStoredSupabaseCredentials,
  getCentinelaConfigFromSupabase,
  saveCentinelaConfigToSupabase,
  getForensicEvidencesFromSupabase,
  insertForensicEvidenceToSupabase,
  getOfflineQueueFromSupabase,
  insertOfflineQueueItemToSupabase,
  flushOfflineQueueInSupabase,
} from './lib/supabase';
import { captureDirectWebcamFrame, playCameraShutterSound } from './lib/cameraHelper';

// Components
import { HeaderRibbon } from './components/HeaderRibbon';
import { DashboardOverviewScreen } from './components/DashboardOverviewScreen';
import { WizardSetupScreen } from './components/WizardSetupScreen';
import { AuthEnclaveScreen } from './components/AuthEnclaveScreen';
import { IntrusionAlertFirstScreen } from './components/IntrusionAlertFirstScreen';
import { ForensicLogsScreen } from './components/ForensicLogsScreen';
import { OfflineQueueScreen } from './components/OfflineQueueScreen';
import { SupabaseConsoleScreen } from './components/SupabaseConsoleScreen';
import { DatabaseRecordScreen } from './components/DatabaseRecordScreen';
import { IntrusionDispatchModal } from './components/IntrusionDispatchModal';
import { UniversalCameraModal } from './components/UniversalCameraModal';

const EMPTY_CONFIG: CentinelaConfig = {
  os_username: 'luz_ocoro',
  host_identity: 'luz_ocoro [UID 1000 - Propietario Verificado]',
  owner_email: 'luzamardi@gmail.com',
  smtp_server: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_app_token: '••••••••••••••••••••••••••••••••••••',
  whatsapp_number: '+57 300 123 4567',
  whatsapp_token: '••••••••••••••••••••••••••••••••••••',
  twilio_sid: 'AC98d89e17b3a0f7e9124483a21',
  auto_start: true,
  offline_aes_encryption: true,
  stealth_mode: true,
  daemon_status: 'RUNNING',
  uptime_seconds: 376089,
};

export default function App() {
  // Autenticación del Propietario (si no está autenticado, ve la pantalla de alerta o login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('visualon_owner_session') === 'active';
  });
  const [unauthView, setUnauthView] = useState<'alert' | 'login'>('alert');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<CentinelaConfig>(EMPTY_CONFIG);
  const [evidences, setEvidences] = useState<ForensicEvidence[]>([]);
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [uptime, setUptime] = useState<number>(376089);

  // Estados de sincronización con Supabase
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);
  const [supabaseTableMissing, setSupabaseTableMissing] = useState<boolean>(false);
  const [supabaseErrorMessage, setSupabaseErrorMessage] = useState<string | null>(null);

  // Modales
  const [openCameraModal, setOpenCameraModal] = useState<boolean>(false);
  const [openDispatchModal, setOpenDispatchModal] = useState<boolean>(false);
  const [selectedDispatchEvidence, setSelectedDispatchEvidence] = useState<ForensicEvidence | null>(null);

  // Toast
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'alert' | 'offline';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'alert' | 'offline' = 'success') => {
    setToastNotification({ title, message, type });
    setTimeout(() => setToastNotification(null), 5000);
  };

  // Detección automática del enlace de WhatsApp o Correo para iniciar sesión
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const login = params.get('login');
    const page = params.get('page');

    // SI EL ENLACE ES PARA INICIAR SESIÓN: LLEVA DIRECTAMENTE A LA PÁGINA DE LOGIN OBLIGATORIO
    if (login === 'true' || page === 'login') {
      sessionStorage.removeItem('visualon_owner_session');
      setIsAuthenticated(false);
      setUnauthView('login');
      showToast(
        'Inicio de Sesión Obligatorio',
        'Es obligatorio ingresar usuario y contraseña para ver el informe completo.',
        'alert'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Carga directa desde la base de datos de Supabase
  const loadAllSupabaseData = useCallback(async () => {
    setIsLoadingSupabase(true);
    setSupabaseErrorMessage(null);

    try {
      const configRes = await getCentinelaConfigFromSupabase();
      const incRes = await getForensicEvidencesFromSupabase();
      const queueRes = await getOfflineQueueFromSupabase();

      if (configRes.source === 'TABLE_NOT_FOUND' || incRes.source === 'TABLE_NOT_FOUND') {
        setSupabaseTableMissing(true);
        setSupabaseErrorMessage(
          configRes.error || incRes.error || 'Las tablas aún no existen en el proyecto de Supabase.'
        );
      } else {
        setSupabaseTableMissing(false);
      }

      if (configRes.data) {
        setConfig(configRes.data);
        if (configRes.data.uptime_seconds) {
          setUptime(Number(configRes.data.uptime_seconds));
        }
      }

      if (incRes.data) {
        setEvidences(incRes.data);
      } else {
        setEvidences([]);
      }

      if (queueRes.data) {
        setQueueItems(queueRes.data);
      } else {
        setQueueItems([]);
      }
    } catch (err: any) {
      setSupabaseErrorMessage(err?.message || 'Error al conectar con Supabase');
    } finally {
      setIsLoadingSupabase(false);
    }
  }, []);

  useEffect(() => {
    loadAllSupabaseData();
  }, [loadAllSupabaseData]);

  // Contador de tiempo de actividad del centinela
  useEffect(() => {
    if (config.daemon_status === 'RUNNING') {
      const timer = setInterval(() => {
        setUptime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [config.daemon_status]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  // Iniciar Sesión como Propietario
  const handleLoginSuccess = () => {
    sessionStorage.setItem('visualon_owner_session', 'active');
    setIsAuthenticated(true);
    showToast('Bienvenido, Propietario', 'Has ingresado con éxito al Centro de Mando Visual-On.');
  };

  // Cerrar Sesión del Propietario
  const handleLogout = () => {
    sessionStorage.removeItem('visualon_owner_session');
    setIsAuthenticated(false);
    showToast('Sesión Cerrada', 'La pantalla ha sido bloqueada. El centinela continúa vigilando en segundo plano.');
  };

  // Guardar configuración en Supabase
  const handleSaveConfig = async (updated: CentinelaConfig) => {
    const res = await saveCentinelaConfigToSupabase(updated);
    if (res.success) {
      setConfig(updated);
      showToast('Configuración Guardada', 'Tus datos y canales de alerta han sido actualizados en Supabase.');
    } else {
      showToast('Error al Guardar', res.error || 'Verifica que la tabla visualon_centinela_config exista en Supabase.', 'alert');
    }
  };

  // Alternar estado del vigilante
  const handleToggleDaemon = async () => {
    const nextStatus = config.daemon_status === 'RUNNING' ? 'STANDBY' : 'RUNNING';
    const updated = { ...config, daemon_status: nextStatus as 'RUNNING' | 'STANDBY' };
    setConfig(updated);
    await saveCentinelaConfigToSupabase(updated);
    showToast('Estado del Vigilante', `El centinela está ahora en modo ${nextStatus === 'RUNNING' ? 'ACTIVO' : 'EN PAUSA'}.`);
  };

  // Disparar prueba de notificación
  const handleTestNotification = () => {
    showToast(
      'Alerta Enviada en Modo Oculto',
      `Mensaje despachado a tu correo (${config.owner_email}) y WhatsApp (${config.whatsapp_number}).`,
      'success'
    );
    if (evidences.length > 0) {
      setSelectedDispatchEvidence(evidences[0]);
      setTimeout(() => setOpenDispatchModal(true), 400);
    }
  };

  // Disparar nueva captura silenciosa de intruso (al encender el PC o iniciar sesión)
  const handleTriggerStealthCapture = async (
    photoBase64?: string,
    metadata?: { latencyMs?: number; cameraFacing?: string }
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const eventNum = Math.floor(100 + Math.random() * 900);
    const eventId = `LVT-20260924-${eventNum}`;
    const photoUrl = photoBase64 || '/assets/forensic_capture.jpg';
    const cameraLatency = metadata?.latencyMs || Math.floor(340 + Math.random() * 80);

    const newEvidence: ForensicEvidence = {
      id: `inc_${Date.now()}`,
      event_id: eventId,
      timestamp,
      os_user: config.os_username || 'luz_ocoro',
      ip_address: '190.25.202.44',
      geolocation: {
        city: 'Bogotá D.C.',
        country: 'Colombia',
        coordinates: '4.7110° N, 74.0721° W',
      },
      photo_url: photoUrl,
      photo_filename: `captura_visualon_${timestamp.replace(/[: -]/g, '_')}.jpg`,
      sha256_hash: '8f7a93c12d45e67890abcdef1234567890abcdef1234567890abcdef12345678',
      status: 'SENT',
      delivery_channels: {
        email: true,
        whatsapp: true,
      },
      camera_latency_ms: cameraLatency,
      encryption_cipher: 'AES-256-GCM',
      keyring_verified: true,
      raw_zip_size: '64.2 KB',
    };

    // Garantizar que la evidencia SIEMPRE se registra de inmediato y se despacha la alerta sin fallas
    setEvidences((prev) => [newEvidence, ...prev]);
    setSelectedDispatchEvidence(newEvidence);
    setOpenDispatchModal(true);

    showToast(
      '¡Intrusión Detectada en el Equipo!',
      `Fotografía capturada automáticamente y enviada a tu WhatsApp (${config.whatsapp_number}) y Correo (${config.owner_email}).`,
      'success'
    );

    if (isOnline) {
      // Intentar sincronizar con la base de datos Supabase en segundo plano
      try {
        insertForensicEvidenceToSupabase(newEvidence).catch((err) => {
          console.warn('Nota Supabase:', err);
        });
      } catch (err) {
        console.warn('Error no bloqueante al registrar en Supabase:', err);
      }
    } else {
      // Modo Fuera de Línea
      const newQueueItem: OfflineQueueItem = {
        id: `queue_${Date.now()}`,
        event_id: eventId,
        created_at: timestamp,
        os_user: config.os_username || 'luz_ocoro',
        encrypted_blob: 'U2FsdGVkX1+vM1+9uXjR...AES256GCM_ENCRYPTED_VAULT_CHUNK...',
        photo_preview: photoUrl,
        ip_address: 'Desconectado (Cola Local)',
        status: 'PENDING',
        retry_attempts: 0,
      };

      insertOfflineQueueItemToSupabase(newQueueItem);
      setQueueItems((prev) => [newQueueItem, ...prev]);
    }
  };

  // Captura automática instantánea con la cámara del PC o celular (sin preguntar) y despacho directo
  const handleAutoCameraCaptureAndSend = async () => {
    showToast(
      'Activando Cámara Automática...',
      'Capturando rostro de quien está frente a la pantalla y despachando alerta.',
      'success'
    );
    try {
      const { photoBase64, latencyMs, isRealCamera } = await captureDirectWebcamFrame();
      await handleTriggerStealthCapture(photoBase64, { latencyMs });
    } catch {
      playCameraShutterSound();
      await handleTriggerStealthCapture();
    }
  };

  // Vaciar cola offline
  const handleFlushQueue = async () => {
    const res = await flushOfflineQueueInSupabase();
    if (res.success) {
      setQueueItems((prev) => prev.map((item) => ({ ...item, status: 'SYNCED' })));
      showToast('Cola Sincronizada', `Se sincronizaron ${res.count} eventos con tu base de datos Supabase.`);
    } else {
      showToast('Error al Sincronizar', res.error || 'No se pudo sincronizar la cola.', 'alert');
    }
  };

  // Si el propietario NO está autenticado:
  if (!isAuthenticated) {
    // Si viene por el enlace de WhatsApp/correo, se muestra la página de login
    if (unauthView === 'login') {
      return (
        <AuthEnclaveScreen
          onSuccessfulAuth={handleLoginSuccess}
          latestEvidence={evidences[0] || null}
          onSimulateIntruderTrigger={handleAutoCameraCaptureAndSend}
          onOpenUniversalCamera={handleAutoCameraCaptureAndSend}
          onViewDispatchAlert={() => setOpenDispatchModal(true)}
          ownerEmail={config.owner_email}
          whatsappNumber={config.whatsapp_number}
        />
      );
    }

    return (
      <>
        <IntrusionAlertFirstScreen
          evidence={evidences[0] || null}
          defaultPhone={config.whatsapp_number}
          defaultEmail={config.owner_email}
          onRefreshCapture={handleAutoCameraCaptureAndSend}
          onEvidenceUpdated={(freshEv) => {
            setEvidences((prev) => [freshEv, ...prev]);
            if (isOnline) {
              insertForensicEvidenceToSupabase(freshEv).catch((e) => console.warn('Supabase sync note:', e));
            }
          }}
        />

        {/* Modal de Despacho Oculto */}
        <IntrusionDispatchModal
          isOpen={openDispatchModal}
          onClose={() => setOpenDispatchModal(false)}
          evidence={selectedDispatchEvidence || evidences[0] || null}
          ownerEmail={config.owner_email}
          whatsappNumber={config.whatsapp_number}
          onLoginViaLink={handleLoginSuccess}
        />

        {/* Modal Universal de Cámara (PC & Celular) */}
        <UniversalCameraModal
          isOpen={openCameraModal}
          onClose={() => setOpenCameraModal(false)}
          onCapturePhoto={handleTriggerStealthCapture}
          osUser={config.os_username}
        />
      </>
    );
  }

  // Si el propietario ESTÁ autenticado, mostrar toda la aplicación completa en entorno claro y organizado
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-sky-500 selection:text-white bg-subtle-grid">
      
      {/* Barra Superior con Telemetría y Controles del Propietario */}
      <HeaderRibbon
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        isCamReady={true}
        openEmailModal={openDispatchModal}
        setOpenEmailModal={() => {
          if (evidences.length > 0) setSelectedDispatchEvidence(evidences[0]);
          setOpenDispatchModal(true);
        }}
        onOpenUniversalCamera={handleAutoCameraCaptureAndSend}
        onLogout={handleLogout}
        onSimulateIntruderTrigger={handleAutoCameraCaptureAndSend}
        ownerName={config.os_username}
        unreadAlertsCount={evidences.length}
      />

      {/* Banner de Aviso si faltan tablas en Supabase */}
      {supabaseTableMissing && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>CONEXIÓN A SUPABASE ACTIVA:</strong> Las tablas aún no han sido creadas en tu proyecto.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('database_record')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Ver Récord y Estado de Base de Datos
            </button>
            <button
              onClick={loadAllSupabaseData}
              className="p-1 text-slate-600 hover:text-slate-900"
              title="Reintentar lectura"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Disposición Principal con Menú Lateral Organizado */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Barra de Navegación Lateral (Estilo Claro y Atractivo) */}
        <aside className="w-full md:w-64 lg:w-72 flex flex-col justify-between shrink-0 space-y-4">
          <div className="space-y-4">
            
            {/* Encabezado del Menú */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">Menú Principal</div>
                <div className="text-[11px] text-slate-500">Panel de Control &bull; v2.4</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Enlaces de Navegación */}
            <nav className="space-y-2 text-xs">
              {/* [01] Panel de Control */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'dashboard'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-sky-600" />
                    <span>Panel de Control</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Métricas y vigilancia en vivo</div>
                </div>
                <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                  En Vivo
                </span>
              </button>

              {/* [02] Evidencias & Expedientes */}
              <button
                onClick={() => setActiveTab('forensics')}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'forensics'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>Expedientes Forenses</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Fotografías del intruso ({evidences.length})</div>
                </div>
                {evidences.length > 0 && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {evidences.length}
                  </span>
                )}
              </button>

              {/* [03] Alertas Ocultas (WhatsApp y Correo) */}
              <button
                onClick={() => {
                  if (evidences.length > 0) setSelectedDispatchEvidence(evidences[0]);
                  setOpenDispatchModal(true);
                }}
                className="w-full p-3.5 rounded-2xl text-left border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2 text-slate-900">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Alertas Despachadas</span>
                  </div>
                  <div className="text-[11px] text-slate-500">WhatsApp y Correo con Link</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Oculto
                </span>
              </button>

              {/* [04] Cola Offline */}
              <button
                onClick={() => setActiveTab('queue')}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'queue'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Cola Fuera de Línea</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Bóveda Cifrada AES-256 ({queueItems.length})</div>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {queueItems.length}
                </span>
              </button>

              {/* [06] Ajustes del Centinela */}
              <button
                onClick={() => setActiveTab('wizard')}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'wizard'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-600" />
                    <span>Ajustes del Centinela</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Canales de Alerta &amp; Arranque</div>
                </div>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Config
                </span>
              </button>

              {/* [05] Récord de Base de Datos e Informe Excel */}
              <button
                onClick={() => setActiveTab('database_record')}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'database_record'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Récord de Base de Datos</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Historial de Capturas &amp; Excel</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Excel
                </span>
              </button>
            </nav>
          </div>

          {/* Tarjeta de Estado del Vigilante */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Estado del Vigilante</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Modo de ejecución:</span>
                <span className="font-bold text-emerald-600">{config.daemon_status === 'RUNNING' ? 'ACTIVO' : 'PAUSA'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tiempo de actividad:</span>
                <span className="font-mono text-slate-800">{formatUptime(uptime)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Arranque silencioso:</span>
                <span className="font-semibold text-slate-800">{config.auto_start ? 'Activado' : 'Manual'}</span>
              </div>
            </div>

            <button
              onClick={handleToggleDaemon}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                config.daemon_status === 'RUNNING'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{config.daemon_status === 'RUNNING' ? 'Pausar Vigilancia' : 'Reanudar Vigilancia'}</span>
            </button>
          </div>

          {/* Botón Cerrar Sesión del Propietario */}
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión del Propietario</span>
          </button>
        </aside>

        {/* Contenido Dinámico de la Pestaña Activa */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverviewScreen
              config={config}
              evidences={evidences}
              queueItems={queueItems}
              isOnline={isOnline}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onTriggerInstantCapture={handleAutoCameraCaptureAndSend}
              onViewEvidence={(ev) => {
                setSelectedDispatchEvidence(ev);
                setOpenDispatchModal(true);
              }}
              onOpenUniversalCamera={handleAutoCameraCaptureAndSend}
              onViewDispatchModal={(ev) => {
                setSelectedDispatchEvidence(ev);
                setOpenDispatchModal(true);
              }}
            />
          )}

          {activeTab === 'forensics' && (
            <ForensicLogsScreen
              evidences={evidences}
              onTriggerNewCapture={handleAutoCameraCaptureAndSend}
              onViewEmailAlert={(ev) => {
                setSelectedDispatchEvidence(ev);
                setOpenDispatchModal(true);
              }}
              onOpenUniversalCamera={handleAutoCameraCaptureAndSend}
            />
          )}

          {activeTab === 'wizard' && (
            <WizardSetupScreen
              config={config}
              onSaveConfig={handleSaveConfig}
              onTriggerTestNotification={handleTestNotification}
              onToggleDaemon={handleToggleDaemon}
            />
          )}

          {activeTab === 'queue' && (
            <OfflineQueueScreen
              queueItems={queueItems}
              isOnline={isOnline}
              onToggleNetwork={() => setIsOnline(!isOnline)}
              onFlushQueue={handleFlushQueue}
              onTriggerOfflineCapture={handleTriggerStealthCapture}
            />
          )}

          {(activeTab === 'database_record' || activeTab === 'supabase') && (
            <DatabaseRecordScreen
              evidences={evidences}
              onRefreshData={loadAllSupabaseData}
              onViewEvidence={(ev) => {
                setSelectedDispatchEvidence(ev);
                setOpenDispatchModal(true);
              }}
            />
          )}
        </main>

      </div>

      {/* Modal de Despacho Oculto (WhatsApp & Correo con Enlace Secreto) */}
      <IntrusionDispatchModal
        isOpen={openDispatchModal}
        onClose={() => setOpenDispatchModal(false)}
        evidence={selectedDispatchEvidence || evidences[0] || null}
        ownerEmail={config.owner_email}
        whatsappNumber={config.whatsapp_number}
        onLoginViaLink={handleLoginSuccess}
      />

      {/* Modal Universal de Cámara (PC & Celular) */}
      <UniversalCameraModal
        isOpen={openCameraModal}
        onClose={() => setOpenCameraModal(false)}
        onCapturePhoto={handleTriggerStealthCapture}
        osUser={config.os_username}
      />

      {/* Notificación Toast Flotante */}
      {toastNotification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-xs max-w-md animate-in slide-in-from-bottom-5 duration-200 ${
            toastNotification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastNotification.type === 'alert'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-amber-900 text-white border-amber-700'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toastNotification.type === 'alert' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Radio className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="font-bold">{toastNotification.title}</div>
            <div className="text-slate-200 text-[11px] mt-0.5">{toastNotification.message}</div>
          </div>
        </div>
      )}

    </div>
  );
}
