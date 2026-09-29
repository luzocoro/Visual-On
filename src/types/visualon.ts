export interface CentinelaConfig {
  id?: string;
  os_username: string;
  host_identity: string;
  owner_email: string;
  smtp_server: string;
  smtp_port: number;
  smtp_app_token: string;
  whatsapp_number: string;
  whatsapp_token: string;
  twilio_sid: string;
  auto_start: boolean;
  offline_aes_encryption: boolean;
  stealth_mode: boolean;
  daemon_status: 'RUNNING' | 'STANDBY' | 'STOPPED';
  uptime_seconds: number;
  last_updated?: string;
  created_at?: string;
}

export interface ForensicEvidence {
  id: string;
  event_id: string;
  timestamp: string;
  os_user: string;
  ip_address: string;
  geolocation: {
    city: string;
    country: string;
    coordinates: string;
  };
  photo_url: string;
  photo_url_secondary?: string;
  photo_count?: number;
  photo_filename: string;
  sha256_hash: string;
  status: 'SENT' | 'QUEUED' | 'ENCRYPTED' | 'FAILED';
  delivery_channels: {
    email: boolean;
    whatsapp: boolean;
  };
  camera_latency_ms: number;
  encryption_cipher: 'AES-256-GCM';
  keyring_verified: boolean;
  raw_zip_size: string;
}

export interface OfflineQueueItem {
  id: string;
  event_id: string;
  created_at: string;
  os_user: string;
  encrypted_blob: string;
  photo_preview: string;
  ip_address: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
  retry_attempts: number;
}

export interface SupabaseConfigState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  isUsingDemoFallback: boolean;
  lastSyncTime?: string;
  error?: string | null;
}
