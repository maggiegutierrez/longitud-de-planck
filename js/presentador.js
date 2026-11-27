// =====================================================================
// presentador.js — controla la presentación desde el proyector.
//
// Idea central: el proyector es el ÚNICO que cambia el "estado" de la
// sala (qué paso se muestra). Los teléfonos solo lo escuchan.
// Cada vez que Firebase avisa de un cambio, volvemos a dibujar la
// pantalla con dibujar(). Este patrón se llama "la interfaz es una
// función del estado": estado → dibujar() → pantalla.
// =====================================================================
import { GUION, PREGUNTAS, SEGUNDOS_POR_PREGUNTA } from "./contenido.js";
import {
  conectar, crearSala, leerSala, cambiarEstado, escucharSala,
  calcularPuntajes, conteoRespuestas, ahoraServidor,
} from "./sala.js";
import {
  instalarFiltros, animarTitulo, pintarAura, crearRegla, moverRegla,
  exponente, textoConGlosario, activarGlosario, el,
} from "./ui.js";

const $ = (id) => document.getElementById(id);
const escenario = $("escenario");
const regla = $("regla");

let uid = null;
let codigo = null;
let sala = null;              // última copia de la sala que nos mandó Firebase
let ultimoDibujo = "";        // para no redibujar si nada visible cambió
let temporizador = null;

instalarFiltros();
activarGlosario();
crearRegla(regla);

// ---------------------------------------------------------------------
// ARRANQUE
// ---------------------------------------------------------------------
iniciar().catch((error) => {
  console.error(error);
  escenario.replaceChildren(mensajeError(error));
});

async function iniciar() {
  uid = await conectar();

  // Si recargas la página, retomamos la misma sala (la guardamos en
  // sessionStorage, que dura mientras la pestaña esté abierta).
  const guardada = leerGuardado();
  if (guardada) {
    const existente = await leerSala(guardada);
    if (existente?.host === uid) codigo = guardada;
  }
  if (!codigo) {
    codigo = await crearSala(uid);
    guardar(codigo);
  }

  escucharSala(codigo, (datos) => {
    sala = datos;
    dibujar();
    revisarCierreAutomatico();
  });

  // Revisamos 4 veces por segundo la cuenta regresiva.
  temporizador = setInterval(() => { actualizarReloj(); revisarCierreAutomatico(); }, 250);
}

function leerGuardado() { try { return sessionStorage.getItem("planck-sala"); } catch { return null; } }
function guardar(c) { try { sessionStorage.setItem("planck-sala", c); } catch { /* modo privado */ } }

// ---------------------------------------------------------------------
// NAVEGACIÓN
// ---------------------------------------------------------------------
function siguiente() {
  if (!sala) return;
  const { paso, fase } = sala.estado;

  // Si hay una pregunta abierta, "siguiente" la cierra antes de tiempo.
  if (fase === "abierta") return cerrarPregunta();
  irA(paso + 1);
}

function anterior() {
  if (!sala) return;
  const { paso } = sala.estado;
  if (paso <= -1) return;
  irA(paso - 1, { volviendo: true });
}

function irA(paso, { volviendo = false } = {}) {
  if (paso < -1) return;
  if (paso >= GUION.length) {
    return cambiarEstado(codigo, { paso: GUION.length, fase: "final", pregunta: null, abiertaHasta: 0 });
  }
  if (paso === -1) {
    return cambiarEstado(codigo, { paso: -1, fase: "espera", pregunta: null, abiertaHasta: 0 });
  }
  const destino = GUION[paso];
  if (destino.tipo === "capitulo") {
    return cambiarEstado(codigo, { paso, fase: "capitulo", pregunta: null, abiertaHasta: 0 });
  }
  // Es una pregunta. Si ya se respondió antes (volviendo atrás), solo
  // mostramos su resultado; no se puede volver a abrir.
  const yaRespondida = volviendo || sala.respuestas?.[destino.id];
  if (yaRespondida) {
    return cambiarEstado(codigo, { paso, fase: "resultado", pregunta: destino.id, abiertaHasta: 0 });
  }
  return cambiarEstado(codigo, {
    paso,
    fase: "abierta",
    pregunta: destino.id,
    abiertaHasta: ahoraServidor() + SEGUNDOS_POR_PREGUNTA * 1000,
  });
}

function cerrarPregunta() {
  const e = sala.estado;
  return cambiarEstado(codigo, { ...e, fase: "resultado" });
}

// Cierra sola la pregunta cuando se acaba el tiempo o ya respondió todo el mundo.
let cerrando = false;
function revisarCierreAutomatico() {
  if (!sala || sala.estado.fase !== "abierta" || cerrando) return;
  const total = Object.keys(sala.jugadores || {}).length;
  const respondieron = Object.keys(sala.respuestas?.[sala.estado.pregunta] || {}).length;
  const seAcabo = ahoraServidor() > sala.estado.abiertaHasta;
  const todos = total > 0 && respondieron >= total;
  if (seAcabo || todos) {
    cerrando = true;
    // Una pausa breve si respondieron todos, para que se vea el 100 %.
    setTimeout(() => { cerrarPregunta().finally(() => { cerrando = false; }); }, todos && !seAcabo ? 900 : 0);
  }
}

// Teclado y controles. Los presentadores inalámbricos envían
// PageDown/PageUp, así que también funcionan.
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); siguiente(); }
  if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); anterior(); }
  if (e.key === "f" || e.key === "F") pantallaCompleta();
});
$("btn-siguiente").addEventListener("click", siguiente);
$("btn-anterior").addEventListener("click", anterior);
$("btn-pantalla").addEventListener("click", pantallaCompleta);

function pantallaCompleta() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

// ---------------------------------------------------------------------
// DIBUJAR — decide qué pantalla mostrar según la fase
// ---------------------------------------------------------------------
function dibujar() {
  const { paso, fase } = sala.estado;
  const jugadores = Object.values(sala.jugadores || {});
  const total = jugadores.length;

  // Barra superior y controles (se actualizan siempre)
  $("barra-sala").hidden = fase === "espera";
  $("codigo-mini").textContent = codigo;
  $("url-mini").textContent = urlJugar().replace(/^https?:\/\//, "");
  $("cuenta-jugadores").textContent = total;
  $("progreso").textContent = `${Math.max(0, Math.min(paso + 1, GUION.length))} / ${GUION.length}`;
  $("btn-siguiente").textContent =
    fase === "espera" ? "Empezar →" :
    fase === "abierta" ? "Cerrar pregunta" :
    fase === "final" ? "Fin" : "Siguiente →";
  $("btn-siguiente").disabled = fase === "final";

  // Color, regla y zoom según el paso
  const actual = GUION[paso];
  const escala = actual ? actual.escala : fase === "final" ? -35 : 0;
  pintarAura(actual ? actual.color : fase === "final" ? ["#ff4d2e", "#3b1696"] : ["#3a14b8", "#6a2cff"]);
  moverRegla(regla, escala);
  $("escala-actual").textContent = `${exponente(escala)} m`;
  document.querySelector(".zoom").style.setProperty("--intensidad", String(-escala / 35));

  // Firma de lo que se ve: si no cambió, no reconstruimos la pantalla
  // (evita que las animaciones de entrada se repitan con cada voto).
  const conteo = fase === "resultado" ? conteoRespuestas(sala, sala.estado.pregunta).join() : "";
  const firma = [paso, fase, conteo, fase === "espera" || fase === "final" || fase === "resultado" ? jugadores.map((j) => j.apodo).join() : ""].join("|");
  const cambioDePaso = !ultimoDibujo.startsWith(`${paso}|${fase}|`);

  if (fase === "abierta") actualizarRespondieron();
  if (firma === ultimoDibujo) return;
  ultimoDibujo = firma;

  // En la sala de espera, si solo llegó alguien nuevo, actualizamos
  // únicamente las fichas de nombres (sin repetir animaciones).
  if (fase === "espera" && !cambioDePaso && escenario.querySelector(".fichas")) {
    escenario.querySelector(".fichas").replaceWith(fichasJugadores(jugadores));
    return;
  }

  let vista;
  if (fase === "espera") vista = vistaEspera(jugadores);
  else if (fase === "final") vista = vistaFinal();
  else if (actual.tipo === "capitulo") vista = vistaCapitulo(actual);
  else vista = vistaPregunta(actual, fase);

  escenario.replaceChildren(vista);
  if (cambioDePaso) animarTitulo(escenario.querySelector(".titulo-grano"));
  if (fase === "abierta") { actualizarReloj(); actualizarRespondieron(); }
}

// ---------- Sala de espera ----------
function urlJugar() {
  const url = new URL("jugar.html", location.href);
  url.searchParams.set("sala", codigo);
  if (new URLSearchParams(location.search).has("emulador")) url.searchParams.set("emulador", "");
  return url.href;
}

function vistaEspera(jugadores) {
  const caja = el("section", "espera");

  const izq = el("div");
  izq.append(
    el("p", "antetitulo aparece", "Un viaje de 35 potencias de diez"),
    el("h1", "titulo-grano", "Longitud de Planck"),
    el("p", "subtitulo aparece", "Escanea el código para jugar"),
  );

  const der = el("div", "qr-tarjeta vidrio aparece");
  const qr = el("div", "qr");
  qr.innerHTML = generarQR(urlJugar());   // SVG que generamos nosotros: seguro
  der.append(qr, el("p", "etiqueta", "o entra con el código"), el("p", "codigo", codigo), el("p", "url", urlJugar()));

  caja.append(izq, der, fichasJugadores(jugadores));
  return caja;
}

function fichasJugadores(jugadores) {
  const fichas = el("div", "fichas");
  if (jugadores.length === 0) fichas.append(el("p", "etiqueta", "Esperando participantes…"));
  for (const j of jugadores) fichas.append(el("span", "ficha", j.apodo));
  return fichas;
}

function generarQR(texto) {
  if (typeof qrcode !== "function") return "<p style='color:#000;padding:1em'>No se pudo cargar el QR</p>";
  const qr = qrcode(0, "M");      // 0 = tamaño automático, M = corrección de errores media
  qr.addData(texto);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

// ---------- Capítulo ----------
function vistaCapitulo(c) {
  const caja = el("section", "capitulo");
  const lista = el("ul");
  c.puntos.forEach((texto, i) => {
    const li = el("li", "aparece");
    li.style.setProperty("--i", i + 1);
    li.append(textoConGlosario(texto));
    lista.append(li);
  });
  caja.append(
    el("p", "antetitulo aparece", c.antetitulo),
    el("h1", "titulo-grano", c.titulo),
    el("p", "subtitulo aparece", c.subtitulo),
    lista,
  );
  return caja;
}

// ---------- Pregunta ----------
function vistaPregunta(p, fase) {
  const enResultado = fase === "resultado";
  const caja = el("section", `pregunta ${enResultado ? "resultado" : ""}`);
  const numero = PREGUNTAS.indexOf(p) + 1;

  const enunciado = el("h1", "enunciado aparece", p.enunciado);
  const meta = el("p", "etiqueta respondieron", "");
  meta.id = "respondieron";

  const conteo = conteoRespuestas(sala, p.id);
  const totalVotos = conteo.reduce((a, b) => a + b, 0);
  const opciones = el("div", "opciones");
  p.opciones.forEach((texto, i) => {
    const op = el("div", "opcion vidrio aparece");
    op.dataset.i = i;
    op.style.setProperty("--i", i * 0.4 + 1);
    if (enResultado && i === p.correcta) op.classList.add("correcta");
    op.append(el("span", "letra", "ABCD"[i]), el("span", "", texto));
    if (enResultado) {
      op.append(el("span", "votos", `${conteo[i]}`));
      const pista = el("div", "barra-pista");
      const relleno = el("i");
      pista.append(relleno);
      op.append(pista);
      // Ponemos el ancho un instante después para que la barra se anime.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        relleno.style.width = totalVotos ? `${(conteo[i] / totalVotos) * 100}%` : "0";
      }));
    }
    opciones.append(op);
  });

  caja.append(el("p", "antetitulo", `Pregunta ${numero} de ${PREGUNTAS.length}`), enunciado);

  if (!enResultado) {
    caja.append(relojSVG(), meta, opciones);
  } else {
    meta.textContent = `${totalVotos} respuestas`;
    caja.append(meta, opciones);
    const pie = el("div", "pie-resultado");
    const exp = el("p", "explicacion aparece");
    exp.style.setProperty("--i", 2);
    exp.append(el("strong", "etiqueta", `Respuesta: ${"ABCD"[p.correcta]}`), p.explicacion);
    const lado = el("div", "aparece");
    lado.style.setProperty("--i", 3);
    lado.append(el("p", "etiqueta", "Top 5"), listaTop(5));
    pie.append(exp, lado);
    caja.append(pie);
  }
  return caja;
}

function relojSVG() {
  const caja = el("div", "reloj");
  caja.id = "reloj";
  caja.innerHTML = `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="degradado-reloj"><stop offset="0" stop-color="#7a3cff"/><stop offset=".5" stop-color="#ff3fb4"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs>
      <circle class="fondo" cx="50" cy="50" r="44"/>
      <circle class="avance" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/>
    </svg><span>20</span>`;
  return caja;
}

function actualizarReloj() {
  const reloj = $("reloj");
  if (!reloj || !sala || sala.estado.fase !== "abierta") return;
  const restante = Math.max(0, sala.estado.abiertaHasta - ahoraServidor());
  const fraccion = restante / (SEGUNDOS_POR_PREGUNTA * 1000);
  reloj.querySelector("span").textContent = Math.ceil(restante / 1000);
  reloj.querySelector(".avance").setAttribute("stroke-dashoffset", String(276.5 * (1 - fraccion)));
}

function actualizarRespondieron() {
  const meta = $("respondieron");
  if (!meta) return;
  const total = Object.keys(sala.jugadores || {}).length;
  const n = Object.keys(sala.respuestas?.[sala.estado.pregunta] || {}).length;
  meta.textContent = `${n} de ${total} respondieron`;
}

function listaTop(n) {
  const lista = el("ol", "top");
  const tabla = calcularPuntajes(sala).slice(0, n);
  if (tabla.length === 0) lista.append(el("li", "", "Sin participantes"));
  tabla.forEach((fila, i) => {
    const li = el("li");
    li.style.setProperty("--i", i);
    li.append(el("span", "pos", `${fila.puesto}.º`), el("span", "", fila.apodo), el("span", "pts", `${fila.puntos} pts`));
    lista.append(li);
  });
  return lista;
}

// ---------- Final ----------
function vistaFinal() {
  const caja = el("section", "final");
  const izq = el("div");
  izq.append(
    el("p", "antetitulo aparece", "Llegamos a 10⁻³⁵ m"),
    el("h1", "titulo-grano", "Resultados"),
    el("p", "subtitulo aparece", "Mira tu tarjeta en tu teléfono"),
  );
  const der = el("div", "aparece");
  der.style.setProperty("--i", 1);
  der.append(el("p", "etiqueta", "Top 5"), listaTop(5));
  caja.append(izq, der);
  return caja;
}

// ---------- Errores ----------
function mensajeError(error) {
  const caja = el("div", "aviso");
  caja.append(el("h1", "titulo-grano", "Sin conexión"));
  const p = el("p", "", `No pudimos conectar con Firebase: ${error.message}. `);
  const ayuda = el("p", "", "Revisa js/firebase-config.js y la sección «Configurar Firebase» de APRENDE.md.");
  caja.append(p, ayuda);
  return caja;
}
