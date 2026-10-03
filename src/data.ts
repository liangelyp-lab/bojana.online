import { Task, Alert, DailyLog, Document, QualityCheck, ConcreteTest, LibraryItem } from './types';

// Avance Físico Actual: 53.0% (Mes 8 de 16)
// Avance Teórico Planificado: 53.0%
// Avance Financiero Certificado: 52.5%

export const MONTHS = Array.from({ length: 16 }, (_, i) => `Mes ${i + 1}`);

export const GURVE_S_DATA = [
  { mes: 'Mes 1', previsto: 2.5, real: 2.1, certificado: 2.0 },
  { mes: 'Mes 2', previsto: 6.0, real: 5.5, certificado: 5.0 },
  { mes: 'Mes 3', previsto: 11.5, real: 10.1, certificado: 9.5 },
  { mes: 'Mes 4', previsto: 18.0, real: 16.5, certificado: 15.5 },
  { mes: 'Mes 5', previsto: 26.0, real: 24.0, certificado: 22.8 },
  { mes: 'Mes 6', previsto: 34.5, real: 31.5, certificado: 30.2 },
  { mes: 'Mes 7', previsto: 43.5, real: 39.8, certificado: 38.0 },
  { mes: 'Mes 8', previsto: 53.0, real: 53.0, certificado: 52.5 },
  { mes: 'Mes 9', previsto: 62.5, real: null, certificado: null },
  { mes: 'Mes 10', previsto: 71.5, real: null, certificado: null },
  { mes: 'Mes 11', previsto: 80.0, real: null, certificado: null },
  { mes: 'Mes 12', previsto: 87.5, real: null, certificado: null },
  { mes: 'Mes 13', previsto: 93.5, real: null, certificado: null },
  { mes: 'Mes 14', previsto: 97.0, real: null, certificado: null },
  { mes: 'Mes 15', previsto: 99.0, real: null, certificado: null },
  { mes: 'Mes 16', previsto: 100.0, real: null, certificado: null }
];

export const INITIAL_TASKS: Task[] = [
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
    id: 'T-09',
    rubro: 'Revestimientos de Piedra y Pisos de Solárium',
    avancePrevisto: 0,
    avanceReal: 0,
    inicioMes: 12,
    finMes: 15,
    estado: 'En Fecha',
    responsable: 'Mármoles del Norte'
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
  },
  {
    id: 'T-11',
    rubro: 'Pintura, Revestimiento Acrílico y Terminaciones',
    avancePrevisto: 0,
    avanceReal: 0,
    inicioMes: 14,
    finMes: 16,
    estado: 'En Fecha',
    responsable: 'Albañilería Integral Nordelta'
  },
  {
    id: 'T-12',
    rubro: 'Paisajismo, Parquización y Limpieza de Entrega',
    avancePrevisto: 0,
    avanceReal: 0,
    inicioMes: 15,
    finMes: 16,
    estado: 'En Fecha',
    responsable: 'VerdePaisaje Nordelta'
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'A-01',
    titulo: 'Alerta de Suministro: Importación de Perfiles DVH',
    descripcion: 'Demora en la aduana para el ingreso de matriz de perfiles anodizados importados para el sistema de Curtain Wall de la playa. Afectará el inicio de la envoltura en el Mes 10.',
    gravedad: 'Alta',
    estado: 'Activa',
    accionMitigadora: 'Gerencia y D.O. evalúan propuesta técnica de Alumax S.A. para homologar perfiles nacionales de igual prestación acústica y térmica según pliego, evitando desvíos de plazo.',
    fechaEmision: '04-06-2026',
    moduloAfectado: 'Carpintería de Aluminio'
  },
  {
    id: 'A-02',
    titulo: 'Desviación en Curva de Llenado de Hormigón H30 en Losa 1°',
    descripcion: 'Pérdida de 3 jornadas de bombeo debido a ráfagas de viento mayores a 48 km/h provenientes del lago que imposibilitaron el izado de la pluma distribuidores.',
    gravedad: 'Media',
    estado: 'Activa',
    accionMitigadora: 'Autorización excepcional de la Dirección de Obra para colado en turnos ampliados nocturnos durante días de calma según plan de contingencia acústica de Nordelta.',
    fechaEmision: '07-06-2026',
    moduloAfectado: 'Estructura de Hormigón'
  },
  {
    id: 'A-03',
    titulo: 'Fisuración Superficial por Retracción Plástica en Muro Cochera',
    descripcion: 'Se observaron fisuras de mapa en cara externa de muro de hormigón en subsuelo, causadas por desecación prematura post-desmolde.',
    gravedad: 'Media',
    estado: 'Mitigada',
    accionMitigadora: 'Se efectuó el picado de fisuras, sellado elástico con material de poliuretano y revestimiento impermeabilizante de doble acción. Certificado por laboratorio el 02-06-2026.',
    fechaEmision: '28-05-2026',
    moduloAfectado: 'Control de Fisuras / Calidad'
  }
];

export const INITIAL_DAILY_LOGS: DailyLog[] = [
  {
    id: 'L-152',
    fecha: '09-06-2026', // Hoy
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
      'Tendido de montantes pluviales en plenos de cañerías de sector vestuarios.',
      'Replanteo e hincado de cañerías eléctricas en losa previo a hormigonado.'
    ],
    novedades: 'Excelente ritmo de colado. El camión mezclador ingresó por el camino de obra sin demoras. Se tomaron muestras correspondientes en probetas (6 cilindros) para control de compresión a los 7 y 28 días.',
    hormigonadoInfo: {
      volumenM3: 45,
      remito: 'Remis-LomaNegra-N8491',
      probetasMoldeadas: 6,
      slumpCm: 8
    },
    firmaDO: true,
    evidenciaFoto: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600'
  } as DailyLog,
  {
    id: 'L-151',
    fecha: '08-06-2026',
    clima: 'Nublado',
    temperatura: '14°C - 18°C',
    personalActivo: 28,
    contratistas: [
      { nombre: 'TecnoLagos S.A.', especialidad: 'Estructuras', personal: 14 },
      { nombre: 'Albañilería Integral', especialidad: 'Frentes', personal: 8 },
      { nombre: 'Instalar Hidráulica', especialidad: 'Servicios', personal: 3 },
      { nombre: 'VoltObra Soluciones', especialidad: 'Fuerza Motriz', personal: 3 }
    ],
    tareasDelDia: [
      'Encofrado metálico de losa L-02 en sector de restaurant.',
      'Colocación de armadura superior de refuerzo y estribos de vigas perimetrales en Losa 1°.',
      'Levantamiento de tabiques interiores de bloque portante en sector de baños deportivos.'
    ],
    novedades: 'Se controló el doblado de la armadura según plano de estructuras Rev.2. Se ordenó corregir recubrimientos en faja norte usando separadores plásticos adicionales (se cumplió de inmediato).',
    firmaDO: true,
    evidenciaFoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'L-150',
    fecha: '05-06-2026',
    clima: 'Lluvia',
    temperatura: '12°C - 15°C',
    personalActivo: 12,
    contratistas: [
      { nombre: 'TecnoLagos S.A.', especialidad: 'Carpinterías de Encofrado', personal: 6 },
      { nombre: 'VoltObra Soluciones', especialidad: 'Talleres', personal: 6 }
    ],
    tareasDelDia: [
      'Trabajos de herrería y preparación de encofrados bajo tinglado de obrador.',
      'Armado de cañerías eléctricas y cajas en taller de obra.'
    ],
    novedades: 'Lluvia persistente durante toda la jornada (acumulado 22mm). Se suspendieron los trabajos a la intemperie (costa y restaurant). La cuadrilla realizó tareas bajo cubierta en obrador. Se supervisaron las barreras de sedimentación fluviales en la costa para evitar escurrimiento al lago de Nordelta.',
    firmaDO: true
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'OS-012',
    tipo: 'O.S.',
    correlativo: 'OS-012',
    asunto: 'Corrección de recubrimientos y espaciado de armaduras de refuerzo en Losa L-02',
    descripcion: 'Durante la inspección de armaduras de la losa del restaurante, se constató que los hierros de la malla superior tocaban el encofrado por carencia de separadores. Se ordena colocar separadores ("pochoclos") reglamentarios cada 80 cm en ambas direcciones para garantizar el recubrimiento de 2.5cm previsto en el Pliego Técnico de Estructuras.',
    emisor: 'Inspección Dirección de Obra (Estudio Arq. Benítez & Asoc.)',
    receptor: 'Jefe de Obra (TecnoLagos S.A. - Arq. Rossi)',
    fechaEmision: '08-06-2026',
    fechaLimiteRespuesta: '09-06-2026',
    estado: 'Cerrada',
    respuesta: 'Se colocaron un total de 120 separadores plásticos de alta densidad de 25mm. Se realizó una reinspección conjunta pre-colado de hormigón a las 08:30 Hs del 09-06, quedando autorizada la colada de losa de restaurant.',
    firmaVisual: 'D.O. - Arq. Gabriel Benítez',
    fechaFirma: '09-06-2026'
  },
  {
    id: 'OS-013',
    tipo: 'O.S.',
    correlativo: 'OS-013',
    asunto: 'Protección de bordes costeros ante vertido accidental de lechada',
    descripcion: 'Se solicita de manera URGENTE reforzar las geo-textiles flotantes en el sector del tabique de coronamiento costero. Se observó película de lechada de cemento en la orilla del lago producto de la limpieza de herramientas de encofrado. En Nordelta rige tolerancia CERO para impacto ambiental en lagos.',
    emisor: 'Inspección Dirección de Obra (Estudio Arq. Benítez & Asoc.)',
    receptor: 'Jefe de Obra (TecnoLagos S.A. - Arq. Rossi)',
    fechaEmision: '09-06-2026',
    fechaLimiteRespuesta: '10-06-2026',
    estado: 'Emitida',
    firmaVisual: 'D.O. - Arq. Gabriel Benítez'
  },
  {
    id: 'NP-015',
    tipo: 'N.P.',
    correlativo: 'NP-015',
    asunto: 'Propuesta de Reemplazo de bomba de recirculación de Piscina por cambio de stock',
    descripcion: 'El modelo homologado en pliego (Bomba Vulcano BAE-300 de 3HP) se encuentra temporalmente sin entrega por demoras del fabricante. Proponemos su reemplazo por la bomba marca Speck modelo BADU-90, fabricada en Alemania, de idéntica curva hidráulica de caudal de 28 m3/h a 10 mca, sin costo adicional para el Fideicomiso Virazón.',
    emisor: 'Contratista de Instalaciones (FiltroSur S.A.)',
    receptor: 'Dirección de Obra (Benítez & Asoc.)',
    fechaEmision: '06-06-2026',
    fechaLimiteRespuesta: '11-06-2026',
    estado: 'Respondida',
    respuesta: 'Se autoriza la propuesta Speck BADU-90. Unidades superiores técnica y robustamente. Se requiere la entrega de manuales técnicos en carpeta final y fichas de garantía extendida de 24 meses como mejora de pliego presentada.',
    firmaVisual: 'Arq. Gabriel Benítez'
  },
  {
    id: 'NP-016',
    tipo: 'N.P.',
    correlativo: 'NP-016',
    asunto: 'Solicitud de definición de terminación de cielorrasos en sector Spa / Sauna',
    descripcion: 'Frente a la pronta llegada del contratista DrySec, solicitamos definir si el cielorraso del sector Sauna Seco llevará terminación de placas antihumedad tradicionales (yeso) o revestimiento transitable de listones de madera de pino de Oregón, según contradicciones detectadas entre plano de detalles y pliego general de especificaciones.',
    emisor: 'Jefe de Obra (TecnoLagos S.A.)',
    receptor: 'Dirección de Obra (Benítez & Asoc.)',
    fechaEmision: '09-06-2026',
    fechaLimiteRespuesta: '15-06-2026',
    estado: 'Emitida'
  }
];

export const INITIAL_QUALITY_CHECKS: QualityCheck[] = [
  {
    id: 'QC-01',
    item: 'Inspección de Armadura y Encofrados Losa Restaurant L-02',
    sector: 'Restaurant Planta Alta',
    verificadoPor: 'Estudio Benítez (D.O.)',
    fechaVerificacion: '08-06-2026',
    resultado: 'Aprobado',
    observaciones: 'Inicialmente observado por falta de espaciadores de recubrimiento. Corregido satisfactoriamente, aprobado pre-hormigonado.'
  },
  {
    id: 'QC-02',
    item: 'Nivelación y Alineación de Tabiques de Contención Cocheras Subsuelo',
    sector: 'Subsuelo Cocheras',
    verificadoPor: 'Estudio Benítez (D.O.)',
    fechaVerificacion: '02-06-2026',
    resultado: 'Observado',
    observaciones: 'Se detectó desvío de verticalidad de +2.2 cm en módulo de acceso sur. Contratista deberá realizar picado y revoque con aditivo hidrófugo Sika 1 de corrección de plomo.'
  },
  {
    id: 'QC-03',
    item: 'Verificación de Impermeabilización de Fundación en contacto con el lago',
    sector: 'Talud de Costa',
    verificadoPor: 'D.O. & Asesor Ambiental Nordelta',
    fechaVerificacion: '29-05-2026',
    resultado: 'Aprobado',
    observaciones: 'Prueba de estanqueidad de 72 horas aprobada sin infiltraciones detectadas.'
  }
];

export const INITIAL_CONCRETE_TESTS: ConcreteTest[] = [
  {
    id: 'CT-301',
    fechaMoldeo: '12-05-2026',
    sectorColocacion: 'Bases de Fundación y Cabezales de Pilotes (Pilares 1 a 12)',
    asentamientoCm: 7,
    resistencia7dMPa: 22.8,
    resistencia28dMPa: 34.5, // Required: 30 MPa (H30)
    estado: 'Conforme'
  },
  {
    id: 'CT-302',
    fechaMoldeo: '26-05-2026',
    sectorColocacion: 'Muro de Contención de Cocheras y Tabiques Perimetrales',
    asentamientoCm: 8,
    resistencia7dMPa: 21.1,
    resistencia28dMPa: 31.8, // Required: 30 MPa (H30)
    estado: 'Conforme'
  },
  {
    id: 'CT-303',
    fechaMoldeo: '09-06-2026', // Moldeado Hoy
    sectorColocacion: 'Losa Restaurant y Vigas de Coronado L-02',
    asentamientoCm: 8,
    resistencia7dMPa: 0,
    resistencia28dMPa: 0,
    estado: 'En Cursado'
  }
];

export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
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
  },
  {
    id: 'L-004',
    categoria: 'Renders',
    titulo: 'Perspectivas 3D Finales Homologadas para Vistas del Lago y Muelle',
    codigo: 'CHV-REN-3D-024',
    revision: 'Aprobado Nordelta',
    fecha: '05-11-2025',
    tamano: '43.1 MB'
  },
  {
    id: 'L-005',
    categoria: 'Informes',
    titulo: 'Informe de Impacto Ambiental Fluvial y Medidas Mitigadoras de Erosión de Riberas',
    codigo: 'CHV-ECO-IN-007-R1',
    revision: 'Rev. 1',
    fecha: '20-01-2026',
    tamano: '6.4 MB'
  },
  {
    id: 'L-006',
    categoria: 'Certificados',
    titulo: 'Certificado de Amortización Física y Curva de Avance Finero Acumulado Mes 7',
    codigo: 'CHV-FIN-CE-007',
    revision: 'Firmado DO/Cont.',
    fecha: '02-06-2026',
    tamano: '4.1 MB'
  }
];
