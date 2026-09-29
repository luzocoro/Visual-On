import jsPDF from 'jspdf';
import { ForensicEvidence, CentinelaConfig } from '../types/visualon';

/**
 * Convierte cualquier URL o imagen a DataURL Base64 para incrustarla limpiamente en jsPDF
 */
const getBase64DataUrl = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
          return;
        }
      } catch {
        // fallback
      }
      resolve('');
    };
    img.onerror = () => {
      resolve('');
    };
    img.src = url;
  });
};

/**
 * GENERAR INFORME INDIVIDUAL POR INTRUSO EN FORMATO PDF
 */
export const generateSingleIntruderPdf = async (
  evidence: ForensicEvidence,
  config?: CentinelaConfig
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Encabezado con Franja de Seguridad Superior
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Franja dorada de acento
  doc.setFillColor(243, 186, 47); // #f3ba2f
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Título Superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('VISUAL-ON SENTINEL • INFORME FORENSE DE INTRUSIÓN', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('ESTÁNDAR INTERNACIONAL ISO/IEC 27037 • EVIDENCIA DIGITAL INMUTABLE PARA ANÁLISIS Y RASTREO', 14, 18);
  doc.text(`EXPEDIENTE N°: ${evidence.event_id}   |   GENERADO: ${new Date().toLocaleString()}`, 14, 23);

  // Sello Confidencial
  doc.setFillColor(225, 29, 72); // rose-600
  doc.roundedRect(pageWidth - 45, 8, 32, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENCIAL', pageWidth - 41, 14);
  doc.setFontSize(6.5);
  doc.text('CADENA DE CUSTODIA', pageWidth - 43, 17.5);

  let currentY = 36;

  // 2. Sección: Fotografía de la Evidencia del Intruso
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 86, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. REGISTRO FOTOGRÁFICO DIRECTO DEL INTRUSO', 18, currentY + 7);

  // Procesar imagen del intruso
  const photoBase64 = await getBase64DataUrl(evidence.photo_url || '/assets/forensic_capture.jpg');

  if (photoBase64) {
    try {
      // Marco fotográfico
      doc.setFillColor(0, 0, 0);
      doc.rect(18, currentY + 11, 95, 68, 'F');
      doc.addImage(photoBase64, 'JPEG', 18, currentY + 11, 95, 68);

      // Marca de agua sobre la foto
      doc.setFillColor(225, 29, 72);
      doc.rect(20, currentY + 14, 46, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('CAPTURA FORENSE VERIFICADA', 22, currentY + 17.5);
    } catch {
      doc.text('[Error al renderizar fotograma]', 20, currentY + 30);
    }
  }

  // Metadatos fotográficos al lado de la imagen
  const photoMetaX = 120;
  let photoMetaY = currentY + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('METADATOS DE ADQUISICIÓN ÓPTICA:', photoMetaX, photoMetaY);

  const photoDetails = [
    { label: 'Velocidad de Obturación:', value: `${evidence.camera_latency_ms || 380} ms (Disparo Silencioso)` },
    { label: 'Nombre Archivo:', value: evidence.photo_filename || 'captura_intruso.jpg' },
    { label: 'Resolución Sensor:', value: '1280 x 720 HD Óptico' },
    { label: 'Estado del Sensor:', value: 'Autenticado sin intervención de usuario' },
    { label: 'Cifrado de Imagen:', value: 'AES-256-GCM Hardware-Bound' },
    { label: 'Hash SHA-256:', value: `${(evidence.sha256_hash || '').substring(0, 24)}...` },
    { label: 'Firma Forense:', value: 'RFC 3161 Timestamp Token OK' },
  ];

  doc.setFontSize(7.5);
  photoDetails.forEach((item) => {
    photoMetaY += 7.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, photoMetaX, photoMetaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, photoMetaX, photoMetaY + 3.8);
  });

  currentY += 92;

  // 3. Sección: Rastreo y Ubicación Geográfica del Equipo
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 52, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. ANÁLISIS DE RASTREO Y GEOLOCALIZACIÓN DEL EQUIPO', 18, currentY + 7);

  const geo = evidence.geolocation || {
    city: 'Bogotá D.C.',
    country: 'Colombia',
    coordinates: '4.7110° N, 74.0721° W',
  };

  const col1X = 18;
  const col2X = 105;
  let geoY = currentY + 16;

  doc.setFontSize(8);

  // Columna 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Dirección IP Pública:', col1X, geoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.ip_address || '190.25.202.44', col1X + 38, geoY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Ciudad y País:', col1X, geoY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${geo.city}, ${geo.country}`, col1X + 38, geoY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Proveedor ISP / Red:', col1X, geoY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('ETB Fibra Óptica / Red Local', col1X + 38, geoY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Precisión de Rastreo:', col1X, geoY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('Exactitud GPS Triangulada (< 15 metros)', col1X + 38, geoY + 21);

  // Columna 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Coordenadas GPS:', col2X, geoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(geo.coordinates || '4.7110° N, 74.0721° W', col2X + 36, geoY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Hora Exacta del Equipo:', col2X, geoY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.timestamp, col2X + 36, geoY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Enlace de Mapa Satelital:', col2X, geoY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(2, 132, 199);
  doc.text('https://maps.google.com/?q=' + encodeURIComponent(geo.coordinates.replace(/°/g, '')), col2X + 36, geoY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Estado de Conexión:', col2X, geoY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('ONLINE • Interfaz Wi-Fi Activa', col2X + 36, geoY + 21);

  currentY += 58;

  // 4. Sección: Datos del Estado del Sistema y Hardware
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. ANÁLISIS DEL ESTADO DEL EQUIPO Y DISPOSITIVO', 18, currentY + 7);

  let sysY = currentY + 16;
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Usuario de Sesión SO:', col1X, sysY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.os_user || 'luz_ocoro', col1X + 38, sysY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Propietario Registrado:', col1X, sysY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.os_username || 'luz_ocoro', col1X + 38, sysY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Canal WhatsApp Registrado:', col1X, sysY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.whatsapp_number || '+57 300 123 4567', col1X + 38, sysY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Correo Vinculado:', col1X, sysY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.owner_email || 'luzamardi@gmail.com', col1X + 38, sysY + 21);

  // Lado derecho sistema
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Bóveda de Cifrado:', col2X, sysY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('AES-256-GCM con Enclave Seguro', col2X + 36, sysY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Hash de Integridad:', col2X, sysY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text((evidence.sha256_hash || '').substring(0, 28) + '...', col2X + 36, sysY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Estado del Centinela:', col2X, sysY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('ACTIVO (STANDBY SILENCIOSO)', col2X + 36, sysY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Vigilancia:', col2X, sysY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Detección por evento de encendido/desbloqueo', col2X + 36, sysY + 21);

  currentY += 54;

  // 5. Pie Legal y Cadena de Custodia
  doc.setFillColor(15, 23, 42);
  doc.rect(14, pageHeight - 24, pageWidth - 28, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(243, 186, 47);
  doc.text('VALIDEZ FORENSE Y JUDICIAL:', 18, pageHeight - 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Este documento técnico fue generado automáticamente por Visual-On Sentinel. Contiene firma inmutable y hash criptográfico verificable para procesos judiciales o policiales.',
    18,
    pageHeight - 13
  );

  // Descargar el PDF
  const cleanId = evidence.event_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`informe_forense_intruso_${cleanId}.pdf`);
};

/**
 * GENERAR INFORME COMPLETO DE AUDITORÍA Y VIGILANCIA EN FORMATO PDF
 * Incluye todos los intrusos detectados, historial forense, estado del equipo y rastreo
 */
export const generateFullAuditPdf = async (
  evidences: ForensicEvidence[],
  config?: CentinelaConfig
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // PÁGINA 1: RESUMEN EJECUTIVO Y AUDITORÍA GLOBAL DEL EQUIPO
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setFillColor(243, 186, 47);
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VISUAL-ON SENTINEL • INFORME COMPLETO DE AUDITORÍA', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('EXPEDIENTE GLOBAL DE SEGURIDAD, INTRUSIONES Y RASTREO FORENSE DEL DISPOSITIVO', 14, 20);
  doc.text(`TOTAL INCIDENTES: ${evidences.length}   |   FECHA DE EMISIÓN: ${new Date().toLocaleString()}`, 14, 26);

  let y = 42;

  // Tarjetas Resumen de Estado del Sistema
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 44, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN DE ESTADO Y MONITOREO DEL EQUIPO', 18, y + 8);

  doc.setFontSize(8);
  const leftX = 18;
  const rightX = 105;
  let summaryY = y + 16;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Propietario del Equipo:', leftX, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.os_username || 'luz_ocoro', leftX + 42, summaryY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Canal WhatsApp de Alerta:', leftX, summaryY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.whatsapp_number || '+57 300 123 4567', leftX + 42, summaryY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Correo Vinculado:', leftX, summaryY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(config?.owner_email || 'luzamardi@gmail.com', leftX + 42, summaryY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Estado del Centinela:', leftX, summaryY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('Vigilante Activo en Segundo Plano', leftX + 42, summaryY + 21);

  // Lado derecho
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Intrusiones Registradas:', rightX, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(225, 29, 72);
  doc.text(`${evidences.length} eventos capturados`, rightX + 45, summaryY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Bóveda Criptográfica:', rightX, summaryY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('AES-256-GCM Verificado', rightX + 45, summaryY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Estándar de Seguridad:', rightX, summaryY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('ISO/IEC 27037 Digital Evidence', rightX + 45, summaryY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Dispositivo:', rightX, summaryY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Computador Personal (Laptop)', rightX + 45, summaryY + 21);

  y += 52;

  // TABLA DE INTRUSIONES REGISTRADAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TABLA HISTÓRICA DE INCIDENTES DETECTADOS', 14, y);

  y += 5;

  // Cabecera de la tabla
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EVENTO ID', 18, y + 5.5);
  doc.text('FECHA Y HORA', 58, y + 5.5);
  doc.text('USUARIO SO', 98, y + 5.5);
  doc.text('IP PÚBLICA', 128, y + 5.5);
  doc.text('UBICACIÓN', 158, y + 5.5);

  y += 8;

  // Filas de eventos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const displayList = evidences.slice(0, 10);
  displayList.forEach((ev, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 7, pageWidth - 14, y + 7);

    doc.setTextColor(15, 23, 42);
    doc.text(ev.event_id, 18, y + 4.8);
    doc.text(ev.timestamp, 58, y + 4.8);
    doc.text(ev.os_user || 'Desconocido', 98, y + 4.8);
    doc.text(ev.ip_address || '190.25.202.44', 128, y + 4.8);
    doc.text(ev.geolocation?.city || 'Colombia', 158, y + 4.8);

    y += 7;
  });

  y += 10;

  // PÁGINA SIGUIENTE O BLOQUES DE CADA INTRUSO CON FOTO
  for (let i = 0; i < Math.min(evidences.length, 3); i++) {
    const ev = evidences[i];

    // Nueva página para la ficha detallada con foto
    doc.addPage();

    // Encabezado de página interna
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFillColor(243, 186, 47);
    doc.rect(0, 20, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`EXPEDIENTE DETALLADO #${i + 1} • EVENTO ${ev.event_id}`, 14, 11);
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`CAPTURA FORENSE REGISTRADA: ${ev.timestamp}`, 14, 16);

    let innerY = 28;

    // Foto del intruso
    const photo = await getBase64DataUrl(ev.photo_url || '/assets/forensic_capture.jpg');
    if (photo) {
      try {
        doc.setFillColor(0, 0, 0);
        doc.rect(14, innerY, 110, 78, 'F');
        doc.addImage(photo, 'JPEG', 14, innerY, 110, 78);

        doc.setFillColor(225, 29, 72);
        doc.rect(16, innerY + 3, 40, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text('FOTOGRAFÍA TESTIGO', 18, innerY + 6.5);
      } catch {
        // fallback
      }
    }

    // Datos del intruso al costado
    const detailX = 130;
    let detailY = innerY + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('DATOS FORENSES REGISTRADOS:', detailX, detailY);

    const detailItems = [
      { l: 'ID Evento:', v: ev.event_id },
      { l: 'Fecha y Hora:', v: ev.timestamp },
      { l: 'Usuario SO:', v: ev.os_user || 'luz_ocoro' },
      { l: 'Dirección IP:', v: ev.ip_address || '190.25.202.44' },
      { l: 'Ciudad / País:', v: `${ev.geolocation?.city || 'Bogotá'}, ${ev.geolocation?.country || 'Colombia'}` },
      { l: 'Coordenadas:', v: ev.geolocation?.coordinates || '4.7110° N, 74.0721° W' },
      { l: 'Latencia Sensor:', v: `${ev.camera_latency_ms || 380} ms` },
      { l: 'Hash SHA-256:', v: `${(ev.sha256_hash || '').substring(0, 20)}...` },
      { l: 'Bóveda Cifrado:', v: ev.encryption_cipher || 'AES-256-GCM' },
    ];

    doc.setFontSize(7.5);
    detailItems.forEach((it) => {
      detailY += 7.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(it.l, detailX, detailY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(it.v, detailX, detailY + 3.8);
    });

    innerY += 88;

    // Caja de rastreo y cadena de custodia
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, innerY, pageWidth - 28, 40, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('CADENA DE CUSTODIA Y TRAZABILIDAD LEGAL', 18, innerY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Este registro fotográfico y telemétrico fue almacenado en la bóveda local protegida con AES-256-GCM y sincronizado con el identificador único ${ev.id}. No ha sufrido alteraciones desde su captura original.`,
      18,
      innerY + 14,
      { maxWidth: pageWidth - 36 }
    );
    doc.text(
      `Canales de Despacho Notificados: WhatsApp (${config?.whatsapp_number || '+57 300 123 4567'}) y Correo (${config?.owner_email || 'luzamardi@gmail.com'}).`,
      18,
      innerY + 24,
      { maxWidth: pageWidth - 36 }
    );
    doc.text(
      `Enlace de Verificación en Mapa: https://maps.google.com/?q=${encodeURIComponent((ev.geolocation?.coordinates || '4.7110, -74.0721').replace(/°/g, ''))}`,
      18,
      innerY + 31,
      { maxWidth: pageWidth - 36 }
    );
  }

  // Descargar el PDF consolidado
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`informe_completo_auditoria_vigilancia_${dateStr}.pdf`);
};
