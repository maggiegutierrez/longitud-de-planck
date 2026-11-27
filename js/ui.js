// =====================================================================
// ui.js — piezas visuales reutilizables.
// Cada función se "exporta" para que otros archivos la importen con:
//   import { pintarAura } from "./ui.js";
// =====================================================================
import { GLOSARIO } from "./contenido.js";

// ---------------------------------------------------------------------
// FILTROS SVG DEL TÍTULO GRANULADO
// Cómo funciona el efecto (paso a paso, dentro del filtro):
//   1. Desenfoca la forma de las letras (feGaussianBlur). Los bordes
//      quedan con transparencia gradual: opaco dentro, transparente fuera.
//   2. Genera ruido aleatorio (feTurbulence), como estática de TV.
//   3. Resta el ruido a esa transparencia y aplica un umbral
//      (feComponentTransfer "discrete"): cada píxel queda 100 % visible
//      o 100 % invisible. Donde el borde era semitransparente, sobreviven
//      solo algunos puntos → aspecto de spray / grano.
//   4. Recupera el color original y lo recorta con esos puntos.
// Hay dos filtros: "grano" (fijo) y "grano-vivo" (lo animamos al entrar).
// ---------------------------------------------------------------------
function filtroSVG(id, desenfoque) {
  return `
  <filter id="${id}" x="-15%" y="-30%" width="130%" height="160%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${desenfoque}" result="borde"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="7" result="ruido"/>
    <feColorMatrix in="ruido" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="ruidoCrudo"/>
    <!-- Subimos el contraste del ruido: así va de 0 a 1 y los puntos se dispersan más -->
    <feComponentTransfer in="ruidoCrudo" result="ruidoAlfa">
      <feFuncA type="linear" slope="3.2" intercept="-1.1"/>
    </feComponentTransfer>
    <feComposite in="borde" in2="ruidoAlfa" operator="arithmetic" k2="1.6" k3="-1" k4="0" result="resta"/>
    <feComponentTransfer in="resta" result="puntos">
      <feFuncA type="discrete" tableValues="0 1"/>
    </feComponentTransfer>
    <feGaussianBlur in="SourceGraphic" stdDeviation="${desenfoque}" result="colorBorroso"/>
    <feColorMatrix in="colorBorroso" type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="colorPleno"/>
    <feComposite in="colorPleno" in2="puntos" operator="in"/>
  </filter>`;
}

// Desenfoque [horizontal, vertical]: más difuso arriba y abajo, como en la
// imagen de referencia. Los títulos miden en "vw" (un % del ancho de la
// pantalla), así que la dispersión también se calcula según el ancho:
// en un proyector de 1920 px da [3, 10]; en un teléfono de 390 px, [0.6, 2].
const ANCHO = Math.min(window.innerWidth, 2400);
const DESENFOQUE_BASE = [ANCHO * 0.0016, ANCHO * 0.0052].map((n) => +n.toFixed(2));
const DESENFOQUE_INICIAL = DESENFOQUE_BASE.map((n) => n * 4.5);

export function instalarFiltros() {
  if (document.getElementById("filtros-grano")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "filtros-grano";
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  const base = DESENFOQUE_BASE.join(" ");
  svg.innerHTML = filtroSVG("grano", base) + filtroSVG("grano-vivo", base);
  document.body.prepend(svg);
}

// Anima la entrada de un título: empieza muy disperso y se "condensa".
// requestAnimationFrame llama a nuestra función en cada fotograma (~60/s).
export function animarTitulo(elemento, duracion = 1400) {
  if (!elemento) return;
  const blur = document.querySelector("#grano-vivo feGaussianBlur");
  const blurColor = document.querySelectorAll("#grano-vivo feGaussianBlur")[1];
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!blur || sinMovimiento) return;

  document.querySelectorAll(".titulo-grano.entrando").forEach((t) => t.classList.remove("entrando"));
  elemento.classList.add("entrando");
  const inicio = performance.now();

  function fotograma(ahora) {
    const t = Math.min(1, (ahora - inicio) / duracion);
    const suave = 1 - Math.pow(1 - t, 3);           // "ease-out": rápido al inicio, lento al final
    const [x0, y0] = DESENFOQUE_INICIAL;
    const [x1, y1] = DESENFOQUE_BASE;
    const x = x0 - (x0 - x1) * suave;
    const y = y0 - (y0 - y1) * suave;
    blur.setAttribute("stdDeviation", `${x} ${y}`);
    blurColor.setAttribute("stdDeviation", `${x} ${y}`);
    if (t < 1) requestAnimationFrame(fotograma);
    else elemento.classList.remove("entrando");
  }
  requestAnimationFrame(fotograma);
}

// ---------------------------------------------------------------------
// HALO DE FONDO: cambia los dos colores del aura.
// Como --aura-1/--aura-2 están registradas con @property en base.css,
// el navegador anima la transición entre colores.
// ---------------------------------------------------------------------
export function pintarAura([color1, color2]) {
  document.documentElement.style.setProperty("--aura-1", color1);
  document.documentElement.style.setProperty("--aura-2", color2);
}

// ---------------------------------------------------------------------
// POTENCIAS DE DIEZ
// ---------------------------------------------------------------------
const SUPER = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function exponente(n) {
  return "10" + String(n).split("").map((c) => SUPER[c]).join("");
}

// Crea la regla: marcas cada 5 potencias, de 10⁰ a 10⁻³⁵.
export function crearRegla(contenedor) {
  contenedor.classList.add("regla");
  contenedor.setAttribute("aria-hidden", "true");
  for (let e = 0; e >= -35; e -= 5) {
    const marca = document.createElement("span");
    marca.textContent = exponente(e);
    contenedor.append(marca);
  }
  const punto = document.createElement("i");
  punto.className = "regla-marca";
  contenedor.append(punto);
}

// Mueve el punto luminoso a la escala indicada (0 … -35).
export function moverRegla(contenedor, escala) {
  const punto = contenedor.querySelector(".regla-marca");
  const marcas = contenedor.querySelectorAll("span");
  const primera = marcas[0];
  const ultima = marcas[marcas.length - 1];
  // Interpolamos entre el centro de la primera y la última marca.
  const y0 = primera.offsetTop + primera.offsetHeight / 2;
  const y1 = ultima.offsetTop + ultima.offsetHeight / 2;
  const fraccion = Math.min(1, Math.max(0, -escala / 35));
  punto.style.top = `${y0 + (y1 - y0) * fraccion}px`;
}

// ---------------------------------------------------------------------
// GLOSARIO
// textoConGlosario("La [[entropía]] crece") devuelve nodos del DOM:
// texto normal + un <button class="termino"> para la palabra marcada.
// Usamos createElement/textContent en lugar de innerHTML: es más seguro,
// porque nunca interpreta texto como HTML.
// ---------------------------------------------------------------------
export function textoConGlosario(texto) {
  const fragmento = document.createDocumentFragment();
  const partes = texto.split(/(\[\[[^\]]+\]\])/);   // separa conservando las marcas
  for (const parte of partes) {
    const marca = parte.match(/^\[\[(.+)\]\]$/);
    if (marca) {
      const palabra = marca[1];
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "termino";
      boton.dataset.termino = palabra.toLowerCase();
      boton.textContent = palabra;
      fragmento.append(boton);
    } else if (parte) {
      fragmento.append(parte);
    }
  }
  return fragmento;
}

// Un solo "escuchador" en el documento atiende todos los términos
// (esto se llama delegación de eventos).
export function activarGlosario() {
  let pop = null;
  const cerrar = () => { pop?.remove(); pop = null; };

  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".termino");
    if (!boton) {
      if (pop && !pop.contains(evento.target)) cerrar();
      return;
    }
    cerrar();
    const definicion = GLOSARIO[boton.dataset.termino];
    if (!definicion) return;
    pop = document.createElement("div");
    pop.className = "glosario-pop vidrio";
    pop.setAttribute("role", "dialog");
    const titulo = document.createElement("strong");
    titulo.textContent = boton.textContent;
    const cuerpo = document.createElement("span");
    cuerpo.textContent = definicion;
    const x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", "Cerrar definición");
    x.textContent = "×";
    x.addEventListener("click", cerrar);
    pop.append(titulo, cuerpo, x);
    document.body.append(pop);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
}

// Atajo para crear elementos: el("p", "clase", "texto")
export function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}
