// =====================================================================
// contenido.js — TODO el texto de la presentación vive aquí.
//
// ¿Por qué separar el contenido del código?
//   Las tres pantallas (lectura, proyector y teléfono) muestran la misma
//   información. Si el texto estuviera repetido en cada HTML, cambiar una
//   pregunta obligaría a editar tres archivos. Así, editas solo este.
//
// Formato especial en los textos:
//   [[horizonte de eventos]]  → se convierte en una palabra tocable que
//   abre su definición del GLOSARIO (ver ui.js → textoConGlosario).
// =====================================================================

// Puntos por respuesta correcta y segundos para responder.
export const PUNTOS_POR_ACIERTO = 10;
export const SEGUNDOS_POR_PREGUNTA = 20;

// ---------------------------------------------------------------------
// GUION: la secuencia de la presentación, en orden.
// Cada paso es un capítulo o una pregunta.
//   escala: potencia de diez (en metros) que marca la regla lateral.
//   color:  dos colores para el halo de fondo de ese paso.
// ---------------------------------------------------------------------
export const GUION = [
  {
    tipo: "capitulo",
    id: "c1",
    escala: 0,
    color: ["#3a14b8", "#6a2cff"],
    antetitulo: "Capítulo 1",
    titulo: "Lo más pequeño",
    subtitulo: "que podemos nombrar",
    resumen: "Vamos a bajar 35 potencias de diez: de tu tamaño hasta la longitud de Planck.",
    puntos: [
      "Una persona mide cerca de 1 metro: 10⁰ m.",
      "Una célula, 10⁻⁵ m. Un átomo, 10⁻¹⁰ m. Un protón, 10⁻¹⁵ m.",
      "La longitud de Planck está 20 escalones más abajo que el protón.",
    ],
    saberMas: [
      { texto: "Constantes fundamentales (NIST)", url: "https://physics.nist.gov/cuu/Constants/" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p1",
    escala: -10,
    color: ["#4b1ad0", "#8a2cff"],
    enunciado: "¿Qué es más pequeño?",
    opciones: ["Una célula", "Un virus", "Un átomo", "Un protón"],
    correcta: 3,
    explicacion: "Un átomo mide unos 10⁻¹⁰ m. El protón, que vive en su núcleo, mide unos 10⁻¹⁵ m: cien mil veces menos.",
  },
  {
    tipo: "capitulo",
    id: "c2",
    escala: -10,
    color: ["#6a2cff", "#c03cff"],
    antetitulo: "Capítulo 2 · 1899",
    titulo: "La regla de Planck",
    subtitulo: "unidades para cualquier civilización",
    resumen: "Max Planck combinó tres constantes de la naturaleza y obtuvo una longitud universal.",
    puntos: [
      "Usó [[G]] (gravedad), [[c]] (velocidad de la luz) y la [[constante de Planck]] (mundo cuántico).",
      "Quería unidades que no dependieran de objetos humanos, como el metro patrón de París.",
      "Escribió que conservarían su significado «para todas las épocas y culturas, incluso extraterrestres».",
    ],
    saberMas: [
      { texto: "Historia de las unidades de Planck (Living Reviews in Relativity)", url: "https://www.maths.tcd.ie/EMIS/journals/LRG/Articles/lrr-2013-2/articlese2.html" },
      { texto: "¿Qué es el tiempo de Planck? (Space.com, en inglés)", url: "https://www.space.com/what-is-the-planck-time" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p2",
    escala: -12,
    color: ["#8a2cff", "#d03cf0"],
    enunciado: "¿Qué tres constantes forman la longitud de Planck?",
    opciones: [
      "G, c y ħ",
      "c, la masa del electrón y π",
      "La carga del electrón, c y π",
      "G, la masa del protón y c",
    ],
    correcta: 0,
    explicacion: "ℓP = √(ħG/c³). Une la gravedad (G), la relatividad (c) y la física cuántica (ħ).",
  },
  {
    tipo: "capitulo",
    id: "c3",
    escala: -15,
    color: ["#b03cff", "#e43ce0"],
    antetitulo: "Capítulo 3",
    titulo: "Cuánto mide",
    subtitulo: "1,616 × 10⁻³⁵ metros",
    resumen: "Valor oficial: 1,616 255 × 10⁻³⁵ m (CODATA 2022). No se mide: se calcula.",
    puntos: [
      "Valor recomendado por [[CODATA]] en 2022: 1,616 255(18) × 10⁻³⁵ m.",
      "Un protón es unas 10²⁰ veces más ancho.",
      "Si un protón fuera del tamaño de la Vía Láctea, ℓP mediría unos 10 m: como un autobús.",
    ],
    saberMas: [
      { texto: "Valor oficial de la longitud de Planck (NIST)", url: "https://physics.nist.gov/cgi-bin/cuu/Value?plkl" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p3",
    escala: -17,
    color: ["#d03cf0", "#ff3fb4"],
    enunciado: "¿Cuántas longitudes de Planck caben, en fila, a lo ancho de un protón?",
    opciones: ["10⁵ (cien mil)", "10¹⁰", "10²⁰ (cien trillones)", "10³⁵"],
    correcta: 2,
    explicacion: "1,7 × 10⁻¹⁵ m ÷ 1,6 × 10⁻³⁵ m ≈ 10²⁰.",
  },
  {
    tipo: "capitulo",
    id: "c4",
    escala: -19,
    color: ["#e43ce0", "#ff2f7a"],
    antetitulo: "Capítulo 4",
    titulo: "Dos teorías chocan",
    subtitulo: "lo grande contra lo pequeño",
    resumen: "En la escala de Planck, la gravedad y la física cuántica importan a la vez, y no sabemos unirlas.",
    puntos: [
      "La [[relatividad general]] explica lo enorme. La [[mecánica cuántica]], lo diminuto.",
      "A la escala de Planck se necesitan las dos al mismo tiempo: hace falta una [[gravedad cuántica]].",
      "El LHC del CERN explora hasta ~10⁻¹⁹ m. Llegar a Planck exigiría unas 10¹⁵ veces más energía.",
    ],
    saberMas: [
      { texto: "¿Planck, longitud mínima? (Fermilab, en inglés)", url: "https://www.fnal.gov/pub/today/archive/archive_2013/today13-11-01_NutshellReadMore.html" },
      { texto: "El Gran Colisionador de Hadrones (CERN)", url: "https://home.cern/science/accelerators/large-hadron-collider" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p4",
    escala: -22,
    color: ["#ff2f7a", "#ff3b3b"],
    enunciado: "¿Qué nos falta para describir la física a la escala de Planck?",
    opciones: [
      "Un microscopio más potente",
      "Una teoría cuántica de la gravedad",
      "Medir mejor la velocidad de la luz",
      "Nada: ya está resuelto",
    ],
    correcta: 1,
    explicacion: "Hay candidatas, como la teoría de cuerdas o la gravedad cuántica de lazos, pero ninguna está confirmada por experimentos.",
  },
  {
    tipo: "capitulo",
    id: "c5",
    escala: -25,
    color: ["#ff2f5a", "#ff4d2e"],
    antetitulo: "Capítulo 5",
    titulo: "Agujeros negros",
    subtitulo: "información en la superficie",
    resumen: "La entropía de un agujero negro se cuenta en «cuadritos» de Planck sobre su horizonte.",
    puntos: [
      "El [[horizonte de eventos]] es la frontera de la que ni la luz escapa.",
      "Bekenstein y Hawking: [[entropía]] = área del horizonte ÷ (4 ℓP²).",
      "Sorpresa: la información crece con el área, no con el volumen.",
    ],
    saberMas: [
      { texto: "La entropía de los agujeros negros: introducción (D. Page, arXiv, en inglés)", url: "https://arxiv.org/abs/hep-th/0401160" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p5",
    escala: -27,
    color: ["#ff4d2e", "#ff5a2a"],
    enunciado: "Según Bekenstein y Hawking, la entropía de un agujero negro crece con…",
    opciones: ["Su volumen", "El área de su horizonte", "La luz que emite", "Nada: no tiene entropía"],
    correcta: 1,
    explicacion: "S = A / 4ℓP². Es una pista de que el espacio a escala de Planck guarda información de forma extraña.",
  },
  {
    tipo: "capitulo",
    id: "c6",
    escala: -30,
    color: ["#ff5a2a", "#ff7a2f"],
    antetitulo: "Capítulo 6",
    titulo: "¿Píxeles del espacio?",
    subtitulo: "lo que sí se ha puesto a prueba",
    resumen: "Nadie ha demostrado que el espacio sea granular. Dos experimentos ya descartaron algunas versiones.",
    puntos: [
      "2009 · El telescopio Fermi (NASA) vio fotones de un [[estallido de rayos gamma]] de energías muy distintas llegar juntos tras ~7 000 millones de años.",
      "Eso descarta modelos donde el espacio «frena» la luz de forma lineal hasta la escala de Planck.",
      "2015 · El Holómetro de Fermilab, un par de [[interferómetro]]s láser, no encontró el «temblor» que predecía un modelo holográfico.",
    ],
    saberMas: [
      { texto: "Abdo et al., Nature 462, 331 (2009)", url: "https://doi.org/10.1038/nature08574" },
      { texto: "El Holómetro descarta una primera teoría (Fermilab, en inglés)", url: "https://news.fnal.gov/2015/12/holometer-rules-out-first-theory-of-space-time-correlations/" },
      { texto: "¿El espacio es continuo o discreto? (PBS NOVA, en inglés)", url: "https://www.pbs.org/wgbh/nova/article/are-space-and-time-discrete-or-continuous/" },
    ],
  },
  {
    tipo: "pregunta",
    id: "p6",
    escala: -33,
    color: ["#ff7a2f", "#ff9a4a"],
    enunciado: "¿Qué encontró el Holómetro de Fermilab?",
    opciones: [
      "Los píxeles del espacio",
      "Un agujero negro diminuto",
      "Ninguna señal del temblor que predecía ese modelo",
      "Una partícula nueva",
    ],
    correcta: 2,
    explicacion: "No detectó el ruido previsto y descartó ese modelo con 4,6 sigmas de confianza. Otros modelos siguen abiertos.",
  },
  {
    tipo: "capitulo",
    id: "c7",
    escala: -35,
    color: ["#ff4d2e", "#3b1696"],
    antetitulo: "Capítulo 7",
    titulo: "El umbral",
    subtitulo: "donde terminan nuestras teorías",
    resumen: "La longitud de Planck no es «lo más pequeño que existe»: es donde nuestras teorías dejan de funcionar.",
    puntos: [
      "Es la mejor estimación de dónde la gravedad se vuelve cuántica.",
      "No es un píxel comprobado. Es una pregunta abierta.",
      "Quizá la responda alguien de tu generación.",
    ],
    saberMas: [
      { texto: "¿Planck, longitud mínima? (Fermilab, en inglés)", url: "https://www.fnal.gov/pub/today/archive/archive_2013/today13-11-01_NutshellReadMore.html" },
    ],
  },
];

// Atajos útiles para el resto del código.
export const PREGUNTAS = GUION.filter((paso) => paso.tipo === "pregunta");
export const PUNTAJE_MAXIMO = PREGUNTAS.length * PUNTOS_POR_ACIERTO;

// ---------------------------------------------------------------------
// GLOSARIO: definiciones cortas, sin jerga.
// La clave debe coincidir con lo que escribes entre [[ ]] en los textos
// (sin importar mayúsculas).
// ---------------------------------------------------------------------
export const GLOSARIO = {
  "g": "Constante de gravitación universal. Dice qué tan fuerte se atraen dos masas. Es la constante peor medida de las tres.",
  "c": "La velocidad de la luz en el vacío: 299 792 458 m/s. Nada viaja más rápido.",
  "constante de planck": "Número (h, o ħ = h/2π) que marca el tamaño de los «paquetes» de energía del mundo cuántico.",
  "codata": "Comité internacional que cada pocos años publica los valores oficiales de las constantes físicas.",
  "relatividad general": "Teoría de Einstein (1915): la gravedad es la curvatura del espacio y el tiempo. Explica planetas, galaxias y agujeros negros.",
  "mecánica cuántica": "Teoría de lo muy pequeño: átomos y partículas, donde todo ocurre en saltos y probabilidades.",
  "gravedad cuántica": "La teoría que aún buscamos: una que describa la gravedad con las reglas del mundo cuántico.",
  "horizonte de eventos": "La frontera alrededor de un agujero negro. Lo que la cruza, incluida la luz, ya no puede salir.",
  "entropía": "Medida de cuánta información (o desorden) hay en un sistema.",
  "estallido de rayos gamma": "Explosión cósmica brevísima y muy brillante, probablemente el choque de dos estrellas de neutrones o el colapso de una estrella.",
  "interferómetro": "Instrumento que divide un rayo láser en dos y los vuelve a juntar para detectar cambios de distancia diminutos.",
};
