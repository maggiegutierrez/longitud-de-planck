// =====================================================================
// lectura.js — la historia con scroll, para leer por tu cuenta.
// No usa Firebase: los puntos se cuentan solo en este navegador.
//
// Pieza clave: IntersectionObserver. Es una API del navegador que nos
// avisa cuando un elemento entra o sale de la pantalla. Con ella:
//   • revelamos el texto poco a poco,
//   • cambiamos el color del halo,
//   • movemos la regla de escala.
// =====================================================================
import { GUION, PREGUNTAS, PUNTOS_POR_ACIERTO, PUNTAJE_MAXIMO } from "./contenido.js";
import {
  instalarFiltros, animarTitulo, pintarAura, crearRegla, moverRegla,
  exponente, textoConGlosario, activarGlosario, el,
} from "./ui.js";

document.documentElement.classList.add("js");   // activa las animaciones de revelado
instalarFiltros();
activarGlosario();

const historia = document.getElementById("historia");
const regla = document.getElementById("regla");
crearRegla(regla);

let puntos = 0;
let respondidas = 0;

// ---------------------------------------------------------------------
// 1. Construir las secciones a partir de GUION
// ---------------------------------------------------------------------
for (const paso of GUION) {
  historia.append(paso.tipo === "capitulo" ? seccionCapitulo(paso) : seccionPregunta(paso));
}

function seccionCapitulo(c) {
  const s = el("section", "seccion");
  s.id = c.id;
  s.dataset.paso = GUION.indexOf(c);

  const lista = el("ul");
  c.puntos.forEach((texto, i) => {
    const li = el("li", "revelar");
    li.style.setProperty("--i", i + 3);
    li.append(textoConGlosario(texto));
    lista.append(li);
  });

  const saber = el("nav", "saber-mas revelar");
  saber.style.setProperty("--i", 6);
  saber.setAttribute("aria-label", "Saber más");
  saber.append(el("span", "etiqueta", "Saber más"));
  for (const enlace of c.saberMas) {
    const a = el("a", "", enlace.texto);
    a.href = enlace.url;
    a.target = "_blank";              // abre en otra pestaña
    a.rel = "noopener";               // seguridad: la otra pestaña no controla esta
    saber.append(a);
  }

  const ante = el("p", "antetitulo revelar", c.antetitulo);
  const titulo = el("h2", "titulo-grano", c.titulo);
  const sub = el("p", "subtitulo revelar", c.subtitulo);
  sub.style.setProperty("--i", 1);
  s.append(ante, titulo, sub, lista, saber);
  return s;
}

function seccionPregunta(p) {
  const s = el("section", "seccion");
  s.id = p.id;
  s.dataset.paso = GUION.indexOf(p);
  const numero = PREGUNTAS.indexOf(p) + 1;

  const tarjeta = el("div", "quiz vidrio revelar");
  const opciones = el("div", "quiz-opciones");

  p.opciones.forEach((texto, i) => {
    const b = el("button", "quiz-opcion");
    b.type = "button";
    b.append(el("span", "letra", "ABCD"[i]), el("span", "", texto), el("span", "marca", ""));
    b.addEventListener("click", () => responder(p, i, opciones, tarjeta));
    opciones.append(b);
  });

  tarjeta.append(
    el("p", "etiqueta", `Pregunta ${numero} de ${PREGUNTAS.length} · ${PUNTOS_POR_ACIERTO} puntos`),
    el("h3", "", p.enunciado),
    opciones,
  );
  s.append(tarjeta);
  return s;
}

function responder(p, elegida, opciones, tarjeta) {
  if (opciones.classList.contains("respondido")) return;
  opciones.classList.add("respondido");
  const botones = opciones.querySelectorAll("button");
  botones.forEach((b) => (b.disabled = true));
  botones[p.correcta].classList.add("correcta");
  botones[p.correcta].querySelector(".marca").textContent = "✓";

  const acerto = elegida === p.correcta;
  if (!acerto) {
    botones[elegida].classList.add("incorrecta");
    botones[elegida].querySelector(".marca").textContent = "✕";
  }

  const exp = el("p", `quiz-explicacion ${acerto ? "" : "mal"}`);
  exp.append(el("strong", "", acerto ? `¡Correcto! +${PUNTOS_POR_ACIERTO}. ` : "No esta vez. "), p.explicacion);
  tarjeta.append(exp);

  respondidas++;
  if (acerto) puntos += PUNTOS_POR_ACIERTO;
  const marcador = document.getElementById("marcador");
  document.getElementById("puntos").textContent = puntos;
  marcador.classList.add("activo");
  if (acerto) {
    marcador.classList.remove("sube");
    void marcador.offsetWidth;
    marcador.classList.add("sube");
  }
  actualizarFinal();
}

// ---------------------------------------------------------------------
// 2. Final
// ---------------------------------------------------------------------
document.getElementById("puntaje-max").textContent = PUNTAJE_MAXIMO;
function actualizarFinal() {
  document.getElementById("puntaje-final").textContent = puntos;
  const faltan = PREGUNTAS.length - respondidas;
  document.getElementById("mensaje-final").textContent = faltan > 0
    ? `Te faltan ${faltan} preguntas por responder.`
    : puntos === PUNTAJE_MAXIMO
      ? "Llegaste hasta la escala de Planck. Puntaje perfecto."
      : `Acertaste ${puntos / PUNTOS_POR_ACIERTO} de ${PREGUNTAS.length}. Puedes repasar los enlaces de «Saber más».`;
}
actualizarFinal();
document.getElementById("reiniciar").addEventListener("click", () => location.reload());

// ---------------------------------------------------------------------
// 3. Observadores de scroll
// ---------------------------------------------------------------------
// a) Revelar: añade .visible cuando el 25 % de la sección es visible.
const revelador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revelador.unobserve(e.target);    // solo la primera vez
    }
  }
}, { threshold: 0.25 });

// b) Sección activa: la que cruza la línea media de la pantalla.
//    rootMargin "-50% 0px -50% 0px" reduce el área observada a una línea.
let activa = null;
const activador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (!e.isIntersecting || e.target === activa) continue;
    activa = e.target;
    const paso = GUION[e.target.dataset.paso];
    const escala = paso ? paso.escala : -35;
    pintarAura(paso ? paso.color : ["#ff4d2e", "#3b1696"]);
    moverRegla(regla, escala);
    document.getElementById("escala-actual").textContent = `${exponente(escala)} m`;
    animarTitulo(e.target.querySelector(".titulo-grano"));
  }
}, { rootMargin: "-50% 0px -50% 0px" });

document.querySelectorAll(".seccion").forEach((s) => {
  revelador.observe(s);
  activador.observe(s);
});

// La portada también: vuelve al color inicial al subir.
const portada = document.querySelector(".portada");
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    activa = portada;
    pintarAura(["#3a14b8", "#6a2cff"]);
    moverRegla(regla, 0);
    document.getElementById("escala-actual").textContent = "10⁰ m";
  }
}, { rootMargin: "-50% 0px -50% 0px" }).observe(portada);

animarTitulo(document.getElementById("titulo-portada"), 2000);
window.addEventListener("resize", () => moverRegla(regla, GUION[activa?.dataset?.paso]?.escala ?? 0));
