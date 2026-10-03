// Servicio para consumir y parsear datos de Google Sheets de forma pública sin API keys

import { Task, Alert, DailyLog, Document, QualityCheck, ConcreteTest, LibraryItem } from '../types';

// Ayudante para normalizar y limpiar los encabezados de las columnas de Sheets
export function sanitizeHeader(h: string): string {
  if (!h) return '';
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')                     // separa las letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '')     // elimina los acentos
    .replace(/\s+/g, '_')                // convierte espacios en guiones bajos
    .replace(/[^a-z0-9_]/g, '');         // mantiene caracteres alfanuméricos y guiones bajos
}

// ----------------------------------------------------
// DATOS REALES DE CACHE / EN CASO DE FALLA (FALLBACKS)
// ----------------------------------------------------

export const FALLBACK_DASHBOARD = {
  fecha: '09-06-2026',
  avance_fisico: 53.0,
  avance_financiero: 52.5,
  observaciones_abiertas: 2,
  ordenes_servicio_abiertas: 3,
  notas_pedido_abiertas: 1,
  proxima_reunion: '14-06-2026',
  proxima_certificacion: '30-06-2026',
  estado_general: 'Conforme'
};

export const FALLBACK_AVANCE_OBRA: Task[] = [
  {
    id: 'T-01',
    rubro: 'Movilidad de Suelos y Alteo de Costa',
    avancePrevisto: 100,
    avanceReal: 100,
    inicioMes: 1,
    finMes: 3,
    estado: 'Completado',
    responsable: 'Empresa Constructora TecnoLagos S.A.'
  },
  {
    id: 'T-02',
    rubro: 'Fundaciones, Pilotaje y Tabique Retén Costero',
    avancePrevisto: 100,
    avanceReal: 100,
    inicioMes: 2,
    finMes: 5,
    estado: 'Completado',
    responsable: 'Pilotes Virazón S.R.L.'
  },
  {
    id: 'T-03',
    rubro: 'Estructura de Hormigón Armado Principal (H° A°)',
    avancePrevisto: 85,
    avanceReal: 85,
    inicioMes: 4,
    finMes: 9,
    estado: 'En Fecha',
    responsable: 'TecnoLagos S.A. / Ing. G. Rossi'
  },
  {
    id: 'T-04',
    rubro: 'Mampostería Envolvente y Divisiones Internas',
    avancePrevisto: 42,
    avanceReal: 40,
    inicioMes: 7,
    finMes: 11,
    estado: 'En Fecha',
    responsable: 'Albañilería Integral Nordelta'
  },
  {
    id: 'T-05',
    rubro: 'Instalaciones Sanitarias, Cloacales y Pluviales de Base',
    avancePrevisto: 25,
    avanceReal: 20,
    inicioMes: 8,
    finMes: 11,
    estado: 'En Fecha',
    responsable: 'Instalar Hidráulica'
  },
  {
    id: 'T-06',
    rubro: 'Instalaciones Eléctricas de Base y Canalizaciones',
    avancePrevisto: 15,
    avanceReal: 15,
    inicioMes: 8,
    finMes: 12,
    estado: 'En Fecha',
    responsable: 'VoltObra Soluciones'
  },
  {
    id: 'T-07',
    rubro: 'Aberturas de Aluminio y Fachada de Vidrio DVH',
    avancePrevisto: 5,
    avanceReal: 5,
    inicioMes: 10,
    finMes: 14,
    estado: 'En Fecha',
    responsable: 'Carpinterías Alumax S.A.'
  },
  {
    id: 'T-08',
    rubro: 'Cielorrasos Suspendidos y Construcción Drywall',
    avancePrevisto: 0,
    avanceReal: 0,
    inicioMes: 10,
    finMes: 13,
    estado: 'En Fecha',
    responsable: 'DrySec Nordelta'
  },
  {
    id: 'T-10',
    rubro: 'Deck de Madera Lapacho, Piscina y Marina del Lago',
    avancePrevisto: 0,
    avanceReal: 0,
    inicioMes: 13,
    finMes: 16,
    estado: 'En Fecha',
    responsable: 'NauticalDecks Argentina'
  }
];

export const FALLBACK_BITACORA: DailyLog[] = [
  {
    id: 'L-152',
    fecha: '09-06-2026',
    clima: 'Despejado',
    temperatura: '16°C - 21°C',
    personalActivo: 36,
    contratistas: [
      { nombre: 'TecnoLagos S.A.', especialidad: 'Hormigón Armado', personal: 18 },
      { nombre: 'Albañilería Integral', especialidad: 'Muros Exteriores', personal: 10 },
      { nombre: 'Instalar Hidráulica', especialidad: 'Desagües Cloacales', personal: 4 },
      { nombre: 'VoltObra Soluciones', especialidad: 'Canalizaciones', personal: 4 }
    ],
    tareasDelDia: [
      'Hormigonado de vigas y losa sobre cocina y restaurant principal (Losa L-02, volumen aproximado 45 m3 de H30).',
      'Levantamiento de muros de cerramiento en sector administración con bloques cerámicos de 18cm.',
      'Tendido de montantes pluviales en plenos de cañerías.'
    ],
    novedades: 'Excelente ritmo de colado. El camión mezclador ingresó por el camino de obra sin demoras. Se tomaron muestras correspondientes en probetas (6 cilindros) para control de compresión a los 7 y 28 días.',
    firmaDO: true,
    evidenciaFoto: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'L-151',
    fecha: '08-06-2026',
    clima: 'Nublado',
    temperatura: '14°C - 18°C',
    personalActivo: 28,
    contratistas: [{ nombre: 'TecnoLagos S.A.', especialidad: 'Estructuras', personal: 14 }],
    tareasDelDia: ['Encofrado metálico de losa L-02 en sector de restaurant.', 'Colocación de armadura superior de refuerzo.'],
    novedades: 'Se controló el doblado de la armadura según plano de estructuras Rev.2. Se colocaron separadores plásticos adicionales.',
    firmaDO: true,
    evidenciaFoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600'
  }
];

export const FALLBACK_ORDENES: Document[] = [
  {
    id: 'OS-012',
    tipo: 'O.S.',
    correlativo: 'OS-012',
    asunto: 'Corrección de recubrimientos y espaciado de armaduras de refuerzo en Losa L-02',
    descripcion: 'Durante la inspección de armaduras de la losa del restaurante, se constató que los hierros de la malla superior tocaban el encofrado por carencia de separadores. Se ordena colocar separadores plásticos cada 80 cm para garantizar recubrimiento mínimo de 2.5cm.',
    emisor: 'Inspección Dirección de Obra (Estudio Arq. Benítez & Asoc.)',
    receptor: 'Jefe de Obra (TecnoLagos S.A. - Arq. Rossi)',
    fechaEmision: '08-06-2026',
    estado: 'Cerrada',
    respuesta: 'Se colocaron un total de 120 separadores plásticos de alta densidad de 25mm. Se realizó una reinspección conjunta pre-colado del hormigón.',
    firmaVisual: 'D.O. - Arq. Gabriel Benítez',
    fechaFirma: '09-06-2026'
  },
  {
    id: 'OS-013',
    tipo: 'O.S.',
    correlativo: 'OS-013',
    asunto: 'Protección de bordes costeros ante vertido accidental de lechada',
    descripcion: 'Se solicita de manera URGENTE reforzar las geo-textiles flotantes en el sector del tabique de coronamiento costero. Se observó película de lechada de cemento en la orilla del lago. Tolerancia cero para impacto ambiental en lagos.',
    emisor: 'Inspección Dirección de Obra',
    receptor: 'Jefe de Obra',
    fechaEmision: '09-06-2026',
    estado: 'Emitida',
    firmaVisual: 'D.O. - Arq. Gabriel Benítez'
  }
];

export const FALLBACK_NOTAS: Document[] = [
  {
    id: 'NP-015',
    tipo: 'N.P.',
    correlativo: 'NP-015',
    asunto: 'Propuesta de Reemplazo de bomba de recirculación de Piscina por cambio de stock',
    descripcion: 'El modelo homologado en pliego (Bomba Vulcano BAE-300 de 3HP) se encuentra temporalmente sin entrega por demoras del fabricante. Proponemos su reemplazo por la bomba marca Speck modelo BADU-90, fabricada en Alemania, sin costo adicional.',
    emisor: 'Contratista de Instalaciones (FiltroSur S.A.)',
    receptor: 'Dirección de Obra (Benítez & Asoc.)',
    fechaEmision: '06-06-2026',
    estado: 'Respondida',
    respuesta: 'Se autoriza la propuesta Speck BADU-90. Se requiere la entrega de manuales técnicos en carpeta final y fichas de garantía extendida de 24 meses.',
    firmaVisual: 'Arq. Gabriel Benítez'
  }
];

export const FALLBACK_OBSERVACIONES: QualityCheck[] = [
  {
    id: 'QC-01',
    item: 'Inspección de Armadura y Encofrados Losa Restaurant L-02',
    sector: 'Restaurant Planta Alta',
    verificadoPor: 'Estudio Benítez (D.O.)',
    fechaVerificacion: '08-06-2026',
    resultado: 'Aprobado',
    observaciones: 'Falta de espaciadores corregida satisfactoriamente, aprobado pre-hormigonado.'
  },
  {
    id: 'QC-02',
    item: 'Nivelación y Alineación de Tabiques de Contención Cocheras Subsuelo',
    sector: 'Subsuelo Cocheras',
    verificadoPor: 'Estudio Benítez (D.O.)',
    fechaVerificacion: '02-06-2026',
    resultado: 'Observado',
    observaciones: 'Se detectó desvío de verticalidad de +2.2 cm en módulo de acceso sur. Contratista deberá realizar picado y revoque corrector.'
  }
];

export const FALLBACK_CERTIFICACIONES = [
  { mes: 'Mes 1', previsto: 2.5, real: 2.1, certificado: 2.0 },
  { mes: 'Mes 2', previsto: 6.0, real: 5.5, certificado: 5.0 },
  { mes: 'Mes 3', previsto: 11.5, real: 10.1, certificado: 9.5 },
  { mes: 'Mes 4', previsto: 18.0, real: 16.5, certificado: 15.5 },
  { mes: 'Mes 5', previsto: 26.0, real: 24.0, certificado: 22.8 },
  { mes: 'Mes 6', previsto: 34.5, real: 31.5, certificado: 30.2 },
  { mes: 'Mes 7', previsto: 43.5, real: 39.8, certificado: 38.0 },
  { mes: 'Mes 8', previsto: 53.0, real: 53.0, certificado: 52.5 }
];

export const FALLBACK_DOCUMENTACION: LibraryItem[] = [
  {
    id: 'L-001',
    categoria: 'Planos',
    titulo: 'Estructuras de Hormigón Armado - Planta de Fundaciones y Pilotaje',
    codigo: 'CHV-EST-PL-001-R3',
    revision: 'Rev. 3 (Aprobado)',
    fecha: '12-02-2026',
    tamano: '14.2 MB'
  },
  {
    id: 'L-002',
    categoria: 'Planos',
    titulo: 'Arquitectura - Planta General de Distribución y Cortes de Club House',
    codigo: 'CHV-ARQ-PL-010-R2',
    revision: 'Rev. 2_Final',
    fecha: '18-03-2026',
    tamano: '28.5 MB'
  },
  {
    id: 'L-003',
    categoria: 'Pliegos',
    titulo: 'Pliego de Condiciones Técnicas Particulares y Especificaciones de Calidad',
    codigo: 'CHV-PLI-TE-002-R0',
    revision: 'Bidding Vers.',
    fecha: '10-09-2025',
    tamano: '9.8 MB'
  }
];

export const FALLBACK_REPORTES = [
  {
    titulo: 'Informe Fotográfico Mensual de Avance - Mayo de Obra',
    fecha: '31-05-2026',
    tipo: 'PDF Técnico',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
  },
  {
    titulo: 'Auditoría Técnica del Hormigón H30 a 28 días',
    fecha: '05-06-2026',
    tipo: 'Remito / Ensayo',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'
  }
];

// Helper para convertir datos de fila de Gviz a objetos dinámicos
async function fetchSheetRows(sheetId: string, sheetName: string): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error HTTP consultando hoja ${sheetName}: ${res.status}`);
  }
  
  const text = await res.text();
  const startText = "google.visualization.Query.setResponse(";
  const startIndex = text.indexOf(startText);
  if (startIndex === -1) {
    throw new Error(`Formato de Google Sheets incorrecto en la respuesta de la hoja: ${sheetName}`);
  }
  
  const jsonText = text.substring(startIndex + startText.length, text.lastIndexOf(")"));
  const json = JSON.parse(jsonText);
  
  if (json.status !== 'ok') {
    throw new Error(`Google Sheets reportó un error de lectura: ${json.errors?.[0]?.detailed_message || 'Desconocido'}`);
  }
  
  const table = json.table;
  const cols = table.cols.map((col: any, idx: number) => {
    return col ? (col.label ? col.label.trim() : `Col${idx}`) : `Col${idx}`;
  });
  
  const rows = table.rows.map((row: any) => {
    const rowRawData: any = {};
    if (row && row.c) {
      cols.forEach((colLabel: string, idx: number) => {
        const cell = row.c[idx];
        let val = cell ? cell.v : null;
        if (cell && cell.f !== undefined && typeof val === 'string' && val.includes('/')) {
          rowRawData[colLabel] = cell.f;
        } else {
          rowRawData[colLabel] = val;
        }
      });
    }
    
    // Normalizar llaves
    const cleanedRow: any = {};
    Object.entries(rowRawData).forEach(([key, val]) => {
      const cleanKey = sanitizeHeader(key);
      if (cleanKey) {
        cleanedRow[cleanKey] = val;
      }
    });
    return cleanedRow;
  });
  
  return rows;
}

// ----------------------------------------------------
// FETCH DE TODAS LAS HOJAS Y MAPEO AL MODELO DE LA APP
// ----------------------------------------------------

export interface SystemData {
  dashboard: typeof FALLBACK_DASHBOARD;
  avanceObra: Task[];
  bitacora: DailyLog[];
  ordenesServicio: Document[];
  notasPedido: Document[];
  observaciones: QualityCheck[];
  cronograma: Task[];
  certificaciones: typeof FALLBACK_CERTIFICACIONES;
  documentacion: LibraryItem[];
  reportes: typeof FALLBACK_REPORTES;
  source: 'Sheets' | 'Fallback';
  sheetIdUsed?: string;
}

export async function fetchAllSheetsData(sheetId: string): Promise<SystemData> {
  if (!sheetId || sheetId.trim() === '') {
    return {
      dashboard: FALLBACK_DASHBOARD,
      avanceObra: FALLBACK_AVANCE_OBRA,
      bitacora: FALLBACK_BITACORA,
      ordenesServicio: FALLBACK_ORDENES,
      notasPedido: FALLBACK_NOTAS,
      observaciones: FALLBACK_OBSERVACIONES,
      cronograma: FALLBACK_AVANCE_OBRA,
      certificaciones: FALLBACK_CERTIFICACIONES,
      documentacion: FALLBACK_DOCUMENTACION,
      reportes: FALLBACK_REPORTES,
      source: 'Fallback'
    };
  }

  try {
    // 1. Dashboard (Hoja 1)
    let dashboardRaw: any = FALLBACK_DASHBOARD;
    try {
      const rows = await fetchSheetRows(sheetId, 'Dashboard');
      if (rows && rows.length > 0) {
        const r = rows[0];
        dashboardRaw = {
          fecha: r.fecha || FALLBACK_DASHBOARD.fecha,
          avance_fisico: Number(r.avance_fisico) || FALLBACK_DASHBOARD.avance_fisico,
          avance_financiero: Number(r.avance_financiero) || FALLBACK_DASHBOARD.avance_financiero,
          observaciones_abiertas: Number(r.observaciones_abiertas) || FALLBACK_DASHBOARD.observaciones_abiertas,
          ordenes_servicio_abiertas: Number(r.ordenes_servicio_abiertas) || FALLBACK_DASHBOARD.ordenes_servicio_abiertas,
          notas_pedido_abiertas: Number(r.notas_pedido_abiertas) || FALLBACK_DASHBOARD.notas_pedido_abiertas,
          proxima_reunion: r.proxima_reunion || FALLBACK_DASHBOARD.proxima_reunion,
          proxima_certificacion: r.proxima_certificacion || FALLBACK_DASHBOARD.proxima_certificacion,
          estado_general: r.estado_general || FALLBACK_DASHBOARD.estado_general
        };
      }
    } catch (e) {
      console.warn("Falla al cargar hoja 'Dashboard', usando datos por defecto", e);
    }

    // 2. Avance de Obra (Hoja 2)
    let avanceObra: Task[] = FALLBACK_AVANCE_OBRA;
    try {
      const rows = await fetchSheetRows(sheetId, 'Avance de Obra');
      if (rows && rows.length > 0) {
        avanceObra = rows.map((r, i) => ({
          id: `T-AO-${i+1}`,
          rubro: r.rubro || `Rubro ${i+1}`,
          avancePrevisto: Number(r.porcentaje) || 0,
          avanceReal: Number(r.porcentaje) || 0,
          // Mapeos ficticios para compatibilidad de Gantt / Areas
          inicioMes: 1,
          finMes: 16,
          estado: (r.estado as any) || 'En Fecha',
          responsable: r.responsable || 'Dirección de Obra',
          ultimaActualizacion: r.ultima_actualizacion,
          fotoUrl: r.foto_url
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar hoja 'Avance de Obra'", e);
    }

    // 3. Bitácora (Hoja 3)
    let bitacora: DailyLog[] = FALLBACK_BITACORA;
    try {
      const rows = await fetchSheetRows(sheetId, 'Bitácora');
      if (rows && rows.length > 0) {
        bitacora = rows.map((r, i) => ({
          id: `L-${i+100}`,
          fecha: r.fecha || 'Sin Fecha',
          clima: (r.clima as any) || 'Despejado',
          temperatura: r.temperatura || '15°C - 20°C',
          personalActivo: Number(r.cantidad_personal) || 15,
          contratistas: [{ nombre: r.responsable || 'Contratista Gral', especialidad: 'Obras Civiles', personal: Number(r.cantidad_personal) || 15 }],
          tareasDelDia: [r.actividad || 'Sin actividades registradas'],
          novedades: r.comentarios || 'Sin comentarios registrados.',
          firmaDO: true,
          evidenciaFoto: r.foto_url || undefined
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar hoja 'Bitácora'", e);
    }

    // 4. Órdenes de Servicio (Hoja 4)
    let ordenesServicio: Document[] = FALLBACK_ORDENES;
    try {
      const rows = await fetchSheetRows(sheetId, 'Órdenes de Servicio');
      if (rows && rows.length > 0) {
        ordenesServicio = rows.map((r) => ({
          id: r.numero || `OS-${Math.random().toString().slice(2, 5)}`,
          tipo: 'O.S.',
          correlativo: r.numero || '',
          asunto: r.asunto || 'Orden de Servicio',
          descripcion: r.descripcion || '',
          emisor: 'Inspección Dirección de Obra',
          receptor: r.responsable || 'Jefe de Obra',
          fechaEmision: r.fecha || '',
          estado: (r.estado as any) || 'Emitida',
          firmaVisual: 'D.O. - Firma Digital'
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Órdenes de Servicio'", e);
    }

    // 5. Notas de Pedido (Hoja 5)
    let notasPedido: Document[] = FALLBACK_NOTAS;
    try {
      const rows = await fetchSheetRows(sheetId, 'Notas de Pedido');
      if (rows && rows.length > 0) {
        notasPedido = rows.map((r) => ({
          id: r.numero || `NP-${Math.random().toString().slice(2, 5)}`,
          tipo: 'N.P.',
          correlativo: r.numero || '',
          asunto: r.consulta || 'Consulta de Nota',
          descripcion: r.consulta || '',
          emisor: r.emisor || 'Contratista',
          receptor: 'Dirección de Obra',
          fechaEmision: r.fecha || '',
          estado: (r.estado as any) || 'Emitida',
          respuesta: r.respuesta || '',
          firmaVisual: 'Contratista / DO'
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Notas de Pedido'", e);
    }

    // 6. Observaciones (Hoja 6)
    let observaciones: QualityCheck[] = FALLBACK_OBSERVACIONES;
    try {
      const rows = await fetchSheetRows(sheetId, 'Observaciones');
      if (rows && rows.length > 0) {
        observaciones = rows.map((r, i) => ({
          id: `QC-${i+1}`,
          item: r.descripcion || 'Sin descripción',
          sector: r.sector || 'Toda la Obra',
          verificadoPor: r.responsable || 'Dirección de Obra',
          fechaVerificacion: r.fecha_compromiso || '',
          resultado: (r.estado as any) || 'Pendiente',
          observaciones: r.descripcion || '',
          fotoUrl: r.foto_url
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Observaciones'", e);
    }

    // 7. Cronograma (Hoja 7)
    let cronograma: Task[] = FALLBACK_AVANCE_OBRA;
    try {
      const rows = await fetchSheetRows(sheetId, 'Cronograma');
      if (rows && rows.length > 0) {
        cronograma = rows.map((r, i) => {
          // Extraer número de mes o usar por defecto
          const parseMes = (m: any, fallback: number) => {
            if (!m) return fallback;
            const text = String(m).toLowerCase();
            const num = parseInt(text.replace(/[^0-9]/g, ''));
            return isNaN(num) ? fallback : num;
          };

          return {
            id: `T-C-${i+1}`,
            rubro: r.actividad || `Actividad ${i+1}`,
            avancePrevisto: Number(r.avance) || 0,
            avanceReal: Number(r.avance) || 0,
            inicioMes: parseMes(r.inicio, 1),
            finMes: parseMes(r.fin, 16),
            estado: (r.estado as any) || 'En Fecha',
            responsable: 'Contratista Asignado'
          };
        });
      }
    } catch (e) {
      console.warn("Falla al cargar 'Cronograma' de Sheets", e);
    }

    // 8. Certificaciones (Hoja 8)
    let certificaciones = FALLBACK_CERTIFICACIONES;
    try {
      const rows = await fetchSheetRows(sheetId, 'Certificaciones');
      if (rows && rows.length > 0) {
        certificaciones = rows.map((r) => ({
          mes: r.mes || 'Mes',
          previsto: Number(r.avance_fisico) || 0,
          real: Number(r.avance_fisico) || 0,
          certificado: Number(r.avance_financiero) || 0,
          montoCertificado: r.monto_certificado,
          montoAcumulado: r.monto_acumulado,
          estado: r.estado
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Certificaciones'", e);
    }

    // 9. Documentación (Hoja 9)
    let documentacion: LibraryItem[] = FALLBACK_DOCUMENTACION;
    try {
      const rows = await fetchSheetRows(sheetId, 'Documentación');
      if (rows && rows.length > 0) {
        documentacion = rows.map((r, i) => ({
          id: `L-${i+1}`,
          categoria: (r.categoria as any) || 'Planos',
          titulo: r.titulo || 'Planilla de Detalles',
          codigo: `DOC-CHV-${i+100}`,
          revision: 'Rev. 1',
          fecha: r.fecha || 'Sin Fecha',
          tamano: '2.5 MB',
          url: r.url
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Documentación'", e);
    }

    // 10. Reportes (Hoja 10)
    let reportes = FALLBACK_REPORTES;
    try {
      const rows = await fetchSheetRows(sheetId, 'Reportes');
      if (rows && rows.length > 0) {
        reportes = rows.map((r) => ({
          titulo: r.titulo || 'Reporte de Obra',
          fecha: r.fecha || 'Sin fecha',
          tipo: r.tipo || 'PDF',
          url: r.url || '#'
        }));
      }
    } catch (e) {
      console.warn("Falla al cargar 'Reportes'", e);
    }

    return {
      dashboard: dashboardRaw,
      avanceObra,
      bitacora,
      ordenesServicio,
      notasPedido,
      observaciones,
      cronograma,
      certificaciones,
      documentacion,
      reportes,
      source: 'Sheets',
      sheetIdUsed: sheetId
    };

  } catch (error) {
    console.error("Falla catastrófica cargando datos de Google Sheets, usando Fallbacks locales:", error);
    return {
      dashboard: FALLBACK_DASHBOARD,
      avanceObra: FALLBACK_AVANCE_OBRA,
      bitacora: FALLBACK_BITACORA,
      ordenesServicio: FALLBACK_ORDENES,
      notasPedido: FALLBACK_NOTAS,
      observaciones: FALLBACK_OBSERVACIONES,
      cronograma: FALLBACK_AVANCE_OBRA,
      certificaciones: FALLBACK_CERTIFICACIONES,
      documentacion: FALLBACK_DOCUMENTACION,
      reportes: FALLBACK_REPORTES,
      source: 'Fallback'
    };
  }
}
