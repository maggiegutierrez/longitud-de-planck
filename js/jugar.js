// =====================================================================
// jugar.js — lo que ve cada participante en su teléfono.
//
// Flujo:
//   1. Lee el código de sala de la URL (?sala=K7PX), que viene en el QR.
//   2. Pide un apodo y registra al jugador en Firebase.
//   3. Escucha la sala y dibuja la pantalla según la fase que decide
//      el proyector: espera → capítulo → pregunta → resultado → final.
// =====================================================================
import { GUION, PREGUNTAS, PUNTAJE_MAXIMO, PUNTOS_POR_ACIERTO, SEGUNDOS_POR_PREGUNTA } from "./contenido.js";
import {
  conectar, leerSala, unirse, responder, escucharSala, calcularPuntajes, ahoraServidor,
} from "./sala.js";
import { instalarFiltros, animarTitulo, pintarAura, textoConGlosario, activarGlosario, el } from "./ui.js";

const pantalla = document.getElementById("pantalla");
const cabSala = document.getElementById("cab-sala");
const cabPuntos = document.getElementById("cab-puntos");

const parametros = new URLSearchParams(location.search);
let codigo = (parametros.get("sala") || "").toUpperCase();
let uid = null;
let sala = null;
let firmaAnterior = "";
let dejarDeEscuchar = null;

instalarFiltros();
activarGlosario();

iniciar().catch((e) => {
  console.error(e);
  mostrar(aviso("Sin conexión", `No pudimos conectar: ${e.message}`));
});

async function iniciar() {
  uid = await conectar();
  if (codigo) {
    const datos = await leerSala(codigo);
    // ¿Ya estaba en esta sala? (por ejemplo, si recargó la página)
    if (datos?.jugadores?.[uid]) return entrar();
  }
  mostrar(formularioEntrada());
}

// ---------------------------------------------------------------------
// FORMULARIO: código de sala (si no vino en el QR) + apodo
// ---------------------------------------------------------------------
function formularioEntrada(mensajeError = "") {
  const caja = el("div");
  caja.append(
    el("p", "antetitulo", "Un viaje de 35 potencias de diez"),
    el("h1", "titulo-grano", "Longitud de Planck"),
  );

  const form = el("form", "formulario vidrio");
  form.noValidate = true;

  const etCodigo = el("label", "", "Código de sala");
  const inCodigo = el("input");
  Object.assign(inCodigo, { id: "codigo", name: "codigo", maxLength: 4, autocomplete: "off", value: codigo });
  inCodigo.setAttribute("autocapitalize", "characters");
  etCodigo.append(inCodigo);
  etCodigo.hidden = Boolean(codigo);   // si vino en el QR, no hace falta pedirlo

  const etApodo = el("label", "", "Tu apodo");
  const inApodo = el("input");
  Object.assign(inApodo, { id: "apodo", name: "apodo", maxLength: 16, autocomplete: "nickname", placeholder: "Ej. Neutrino", required: true });
  try { inApodo.value = localStorage.getItem("planck-apodo") || ""; } catch { /* sin almacenamiento */ }
  etApodo.append(inApodo);

  const error = el("p", "error", mensajeError);
  error.setAttribute("role", "alert");
  const boton = el("button", "boton principal", "Entrar a la sala");
  boton.type = "submit";

  form.append(etCodigo, etApodo, error, boton);

  // "submit" se dispara con el botón y también con Enter en el teclado.
  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();          // evita que el navegador recargue la página
    const c = inCodigo.value.trim().toUpperCase();
    const apodo = inApodo.value.trim().replace(/\s+/g, " ");
    if (c.length !== 4) return (error.textContent = "El código tiene 4 caracteres.");
    if (!apodo) return (error.textContent = "Escribe un apodo para aparecer en el ranking.");

    boton.disabled = true;
    boton.textContent = "Entrando…";
    try {
      const datos = await leerSala(c);
      if (!datos) throw new Error(`No existe la sala ${c}. Revisa el código en la pantalla.`);
      codigo = c;
      await unirse(codigo, uid, apodo);
      try { localStorage.setItem("planck-apodo", apodo); } catch { /* sin almacenamiento */ }
      // Ponemos el código en la URL: si recarga, vuelve a la misma sala.
      history.replaceState(null, "", `?${new URLSearchParams({ ...Object.fromEntries(parametros), sala: codigo })}`);
      entrar();
    } catch (e) {
      error.textContent = e.message;
      boton.disabled = false;
      boton.textContent = "Entrar a la sala";
    }
  });

  caja.append(form);
  setTimeout(() => (codigo ? inApodo : inCodigo).focus(), 400);
  return caja;
}

function entrar() {
  cabSala.textContent = `Sala ${codigo}`;
  dejarDeEscuchar?.();
  dejarDeEscuchar = escucharSala(codigo, (datos) => {
    sala = datos;
    if (!sala) return mostrar(aviso("La sala se cerró", "Pide a quien presenta un nuevo código."));
    dibujar();
  });
}

// ---------------------------------------------------------------------
// DIBUJAR según la fase
// ---------------------------------------------------------------------
function dibujar() {
  const { paso, fase, pregunta } = sala.estado;
  const yo = calcularPuntajes(sala).find((f) => f.uid === uid);
  cabPuntos.textContent = yo ? `${yo.puntos} pts` : "";

  const actual = GUION[paso];
  pintarAura(actual ? actual.color : ["#3a14b8", "#6a2cff"]);

  // Solo redibujamos si cambia lo que esta persona debe ver.
  const miRespuesta = pregunta ? sala.respuestas?.[pregunta]?.[uid]?.opcion : undefined;
  const firma = [paso, fase, miRespuesta, fase === "final" ? yo?.puntos : ""].join("|");
  if (firma === firmaAnterior) return;
  const cambioDePaso = !firmaAnterior.startsWith(`${paso}|${fase}|`);
  firmaAnterior = firma;

  if (fase === "espera") mostrar(vistaEspera());
  else if (fase === "final") mostrar(vistaFinal(yo));
  else if (actual.tipo === "capitulo") mostrar(vistaCapitulo(actual));
  else if (fase === "abierta") mostrar(vistaPregunta(actual, miRespuesta), !cambioDePaso);
  else mostrar(vistaResultado(actual, miRespuesta, yo));

  if (cambioDePaso) animarTitulo(pantalla.querySelector(".titulo-grano"));
}

// Reemplaza el contenido. "sinAnimar" evita repetir la animación de entrada.
function mostrar(nodo, sinAnimar = false) {
  pantalla.replaceChildren(nodo);
  if (!sinAnimar) {
    pantalla.style.animation = "none";
    void pantalla.offsetWidth;         // truco: fuerza al navegador a reiniciar la animación
    pantalla.style.animation = "";
  }
}

function vistaEspera() {
  const caja = el("div", "pantalla-interna");
  const apodo = sala.jugadores?.[uid]?.apodo || "";
  caja.append(
    el("p", "antetitulo", `Hola, ${apodo}`),
    el("h1", "titulo-grano", "Ya estás dentro"),
    el("p", "mira", "Esperando a que empiece la presentación"),
  );
  return caja;
}

function vistaCapitulo(c) {
  const caja = el("div");
  const resumen = el("p", "texto");
  resumen.append(textoConGlosario(c.resumen));
  caja.append(
    el("p", "antetitulo", c.antetitulo),
    el("h1", "titulo-grano", c.titulo),
    el("p", "subtitulo", c.subtitulo),
    el("div", "", ""),
    resumen,
    el("p", "mira", "Mira la pantalla"),
  );
  caja.style.cssText = "display:grid;gap:12px";
  return caja;
}

function vistaPregunta(p, miRespuesta) {
  const caja = el("div");
  caja.style.cssText = "display:grid;gap:16px";
  const numero = PREGUNTAS.indexOf(p) + 1;

  // Barra de tiempo: la animamos con una transición CSS que dura
  // exactamente lo que falta para cerrar la pregunta.
  const tiempo = el("div", "tiempo");
  const relleno = el("i");
  tiempo.append(relleno);
  const restante = Math.max(0, sala.estado.abiertaHasta - ahoraServidor());
  relleno.style.transform = `scaleX(${restante / (SEGUNDOS_POR_PREGUNTA * 1000)})`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    relleno.style.transition = `transform ${restante}ms linear`;
    relleno.style.transform = "scaleX(0)";
  }));

  const botones = el("div", "botones");
  const yaRespondio = miRespuesta !== undefined;
  if (yaRespondio) botones.classList.add("bloqueado");

  p.opciones.forEach((texto, i) => {
    const b = el("button", "boton-opcion");
    b.type = "button";
    b.dataset.i = i;
    b.disabled = yaRespondio;
    if (miRespuesta === i) b.classList.add("elegida");
    b.append(el("span", "letra", "ABCD"[i]), el("span", "", texto));
    b.addEventListener("click", async () => {
      botones.classList.add("bloqueado");
      b.classList.add("elegida");
      botones.querySelectorAll("button").forEach((x) => (x.disabled = true));
      navigator.vibrate?.(30);             // pequeña vibración en Android
      try {
        await responder(codigo, uid, p.id, i);
      } catch {
        // La regla de la base de datos rechaza respuestas fuera de tiempo.
        estado.textContent = "Se acabó el tiempo: esta respuesta no contó.";
      }
    });
    botones.append(b);
  });

  const estado = el("p", "mira", yaRespondio ? "Respuesta enviada. Espera el resultado." : `Pregunta ${numero} de ${PREGUNTAS.length} · ${PUNTOS_POR_ACIERTO} puntos`);
  caja.append(tiempo, el("h1", "enunciado-movil", p.enunciado), botones, estado);
  return caja;
}

function vistaResultado(p, miRespuesta, yo) {
  const caja = el("div");
  caja.style.cssText = "display:grid;gap:14px";
  const acerto = miRespuesta === p.correcta;
  const veredicto = el("div", `veredicto vidrio ${acerto ? "bien" : "mal"}`);
  if (miRespuesta === undefined) {
    veredicto.append(el("span", "icono", "—"), el("h2", "", "Sin respuesta"));
  } else {
    veredicto.append(
      el("span", "icono", acerto ? "✓" : "✕"),
      el("h2", "", acerto ? `+${PUNTOS_POR_ACIERTO} puntos` : "Esta vez no"),
    );
  }
  veredicto.append(el("p", "", `Correcta: ${"ABCD"[p.correcta]} · ${p.opciones[p.correcta]}`));
  caja.append(
    veredicto,
    el("p", "texto", p.explicacion),
    el("p", "mira", `Llevas ${yo?.puntos ?? 0} de ${PUNTAJE_MAXIMO} puntos`),
  );
  return caja;
}

// Nivel según el porcentaje de aciertos: cuanto mejor, más pequeña la escala.
function nivel(porcentaje) {
  if (porcentaje >= 100) return ["Escala de Planck", "10⁻³⁵ m"];
  if (porcentaje >= 80) return ["Casi Planck", "10⁻³⁰ m"];
  if (porcentaje >= 60) return ["Escala del LHC", "10⁻¹⁹ m"];
  if (porcentaje >= 40) return ["Escala del protón", "10⁻¹⁵ m"];
  if (porcentaje >= 20) return ["Escala atómica", "10⁻¹⁰ m"];
  return ["Escala humana", "10⁰ m"];
}

function vistaFinal(yo) {
  const caja = el("div", "acciones");
  const tabla = calcularPuntajes(sala);
  const puntos = yo?.puntos ?? 0;
  const [nombreNivel, escala] = nivel((puntos / PUNTAJE_MAXIMO) * 100);

  const tarjeta = el("article", "tarjeta");
  const total = el("p", "total", String(puntos));
  total.append(el("small", "", ` / ${PUNTAJE_MAXIMO}`));
  const datos = el("div", "datos");
  const d1 = el("div", "dato"); d1.append(el("b", "", `${yo?.aciertos ?? 0}/${PREGUNTAS.length}`), el("span", "etiqueta", "aciertos"));
  const d2 = el("div", "dato"); d2.append(el("b", "", `${yo?.puesto ?? "–"}.º`), el("span", "etiqueta", `de ${tabla.length}`));
  datos.append(d1, d2);
  const niv = el("p", "nivel", "Llegaste a: ");
  niv.append(el("span", "", `${nombreNivel} · ${escala}`));

  tarjeta.append(
    el("p", "etiqueta", "Longitud de Planck · tarjeta final"),
    el("p", "apodo", yo?.apodo || ""),
    total,
    datos,
    niv,
  );

  const leer = el("a", "boton", "Saber más: leer la historia completa");
  leer.href = "index.html";
  caja.append(tarjeta, el("p", "mira", "Haz una captura de pantalla para guardarla"), leer);
  return caja;
}

function aviso(titulo, texto) {
  const caja = el("div");
  caja.style.cssText = "display:grid;gap:12px";
  const boton = el("a", "boton", "Volver a empezar");
  boton.href = "jugar.html";
  caja.append(el("h1", "titulo-grano", titulo), el("p", "texto", texto), boton);
  return caja;
}
