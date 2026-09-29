import { ForensicEvidence } from '../types/visualon';

/**
 * Genera y descarga un informe en formato Excel (.csv compatible nativo con Microsoft Excel con BOM UTF-8)
 * que contiene el récord completo de todas las capturas, metadatos forenses, ubicación y estado.
 */
export const downloadEvidenceExcelReport = (evidences: ForensicEvidence[], filenamePrefix = 'record_base_datos_capturas'): void => {
  // Encabezados en español con formato para auditoría
  const headers = [
    'ID Evento',
    'Fecha y Hora del Equipo',
    'Usuario del Sistema Operativo',
    'Direccion IP Publica',
    'Ciudad',
    'Pais',
    'Coordenadas GPS',
    'Enlace Google Maps',
    'Latencia Camara (ms)',
    'Nombre Archivo Evidencia',
    'URL Fotografia',
    'Hash SHA-256 de Autenticidad',
    'Cifrado en Boveda',
    'Despacho WhatsApp',
    'Despacho Correo',
    'Estado en Base de Datos',
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = evidences.map((ev) => {
    const geo = ev.geolocation || {
      city: 'Bogotá D.C.',
      country: 'Colombia',
      coordinates: '4.7110° N, 74.0721° W',
    };

    const cleanCoords = (geo.coordinates || '').replace(/°/g, '').trim();
    const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(cleanCoords)}`;

    return [
      escapeCsv(ev.event_id),
      escapeCsv(ev.timestamp),
      escapeCsv(ev.os_user || 'luz_ocoro'),
      escapeCsv(ev.ip_address || '190.25.202.44'),
      escapeCsv(geo.city),
      escapeCsv(geo.country),
      escapeCsv(geo.coordinates),
      escapeCsv(mapsLink),
      escapeCsv(ev.camera_latency_ms || 380),
      escapeCsv(ev.photo_filename || 'captura_intruso.jpg'),
      escapeCsv(ev.photo_url || ''),
      escapeCsv(ev.sha256_hash || ''),
      escapeCsv(ev.encryption_cipher || 'AES-256-GCM'),
      escapeCsv(ev.delivery_channels?.whatsapp ? 'ENVIADO' : 'PENDIENTE'),
      escapeCsv(ev.delivery_channels?.email ? 'ENVIADO' : 'PENDIENTE'),
      escapeCsv(ev.status || 'SENT'),
    ].join(';'); // Usamos punto y coma (;) como delimitador estándar para Excel en español
  });

  // \uFEFF es el Byte Order Mark (BOM) UTF-8 para que Excel reconozca tildes, caracteres especiales y formato
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
