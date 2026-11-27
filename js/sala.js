// =====================================================================
// sala.js — todo lo que habla con Firebase vive aquí.
//
// Usamos Firebase Realtime Database: una gran estructura JSON en la nube.
// Cuando alguien escribe en ella, quienes "escuchan" esa ruta reciben el
// cambio en menos de un segundo. Así se sincronizan proyector y teléfonos.
//
// Así se ve una sala por dentro:
//
//   salas/
//     K7PX/                         ← código de la sala
//       host: "uid-del-proyector"   ← solo este usuario controla la sala
//       estado:
//         paso: 3                   ← posición en GUION (-1 = sala de espera)
//         fase: "abierta"           ← espera | capitulo | abierta | resultado | final
//         pregunta: "p2"            ← pregunta en curso (o null)
//         abiertaHasta: 1732650000000  ← hora del servidor en que se cierra
//       jugadores/
//         uid-ana:  { apodo: "Ana" }
//       respuestas/
//         p2/
//           uid-ana: { opcion: 0, t: 1732649990000 }
// =====================================================================

// Importamos Firebase directamente desde su CDN oficial (módulos ES).
// No hace falta npm ni un "bundler": el navegador descarga estos archivos.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set, onValue, serverTimestamp, connectDatabaseEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig } from "./firebase-config.js";
import { GUION, PREGUNTAS, PUNTOS_POR_ACIERTO } from "./contenido.js";

export const configurado = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");

// Para probar sin internet ni proyecto real: abre la página con ?emulador
// (necesita los emuladores de Firebase corriendo; ver APRENDE.md).
const usarEmulador = new URLSearchParams(location.search).has("emulador");

let db, auth;
let desfaseReloj = 0;   // diferencia entre el reloj del servidor y el de este dispositivo

// Conecta e inicia sesión de forma anónima (sin correo ni contraseña).
// Devuelve el "uid": un identificador único de este navegador.
export async function conectar() {
  if (!configurado && !usarEmulador) {
    throw new Error("Falta la configuración de Firebase en js/firebase-config.js");
  }
  const config = usarEmulador
    // El emulador aplica database.rules.json a la base "<proyecto>-default-rtdb".
    ? { apiKey: "demo", projectId: "demo-planck", databaseURL: "http://127.0.0.1:9000?ns=demo-planck-default-rtdb" }
    : firebaseConfig;
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getDatabase(app);
  if (usarEmulador) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
  }

  // Firebase nos dice cuánto se desvía nuestro reloj del suyo.
  // Lo usamos para que la cuenta regresiva sea igual en todos los teléfonos.
  onValue(ref(db, ".info/serverTimeOffset"), (snap) => { desfaseReloj = snap.val() || 0; });

  // La sesión anónima se recuerda en el navegador: si recargas, eres el mismo uid.
  // Primero esperamos a saber si ya había sesión; si no, creamos una.
  const previo = await new Promise((resolver) => {
    const dejar = onAuthStateChanged(auth, (u) => { dejar(); resolver(u); });
  });
  const usuario = previo || (await signInAnonymously(auth)).user;
  return usuario.uid;
}

export const ahoraServidor = () => Date.now() + desfaseReloj;
const rutaSala = (codigo) => ref(db, `salas/${codigo}`);

// ---------- Proyector ----------

// Letras y números sin confusiones (sin O/0, I/1/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function codigoAleatorio() {
  let c = "";
  for (let i = 0; i < 4; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return c;
}

export async function crearSala(uid) {
  for (let intento = 0; intento < 5; intento++) {
    const codigo = codigoAleatorio();
    const existe = (await get(rutaSala(codigo))).exists();
    if (existe) continue;
    await set(rutaSala(codigo), {
      host: uid,
      creada: serverTimestamp(),
      estado: { paso: -1, fase: "espera", pregunta: null, abiertaHasta: 0 },
    });
    return codigo;
  }
  throw new Error("No se pudo crear una sala. Intenta de nuevo.");
}

export async function leerSala(codigo) {
  return (await get(rutaSala(codigo))).val();
}

export function cambiarEstado(codigo, estado) {
  return set(ref(db, `salas/${codigo}/estado`), estado);
}

// ---------- Teléfono ----------

export function unirse(codigo, uid, apodo) {
  return set(ref(db, `salas/${codigo}/jugadores/${uid}`), { apodo, unido: serverTimestamp() });
}

export function responder(codigo, uid, preguntaId, opcion) {
  return set(ref(db, `salas/${codigo}/respuestas/${preguntaId}/${uid}`), { opcion, t: serverTimestamp() });
}

// ---------- Ambos ----------

// Llama a "alCambiar" cada vez que algo cambie en la sala.
// Devuelve una función para dejar de escuchar.
export function escucharSala(codigo, alCambiar) {
  return onValue(rutaSala(codigo), (snap) => alCambiar(snap.val()));
}

// Calcula los puntos de cada jugador a partir de sus respuestas.
// No guardamos los puntos en la base de datos: se calculan siempre a
// partir de las respuestas, así nunca pueden quedar desincronizados.
export function calcularPuntajes(sala) {
  const jugadores = sala?.jugadores || {};
  const respuestas = sala?.respuestas || {};
  const tabla = Object.entries(jugadores).map(([uid, j]) => {
    let aciertos = 0;
    for (const p of PREGUNTAS) {
      const r = respuestas[p.id]?.[uid];
      if (r && r.opcion === p.correcta) aciertos++;
    }
    return { uid, apodo: j.apodo, aciertos, puntos: aciertos * PUNTOS_POR_ACIERTO };
  });
  // Ordena: más puntos primero; en empate, por apodo.
  tabla.sort((a, b) => b.puntos - a.puntos || a.apodo.localeCompare(b.apodo));
  // Puesto con empates (dos personas con 50 pts comparten el 1.º).
  tabla.forEach((fila, i) => {
    fila.puesto = i > 0 && fila.puntos === tabla[i - 1].puntos ? tabla[i - 1].puesto : i + 1;
  });
  return tabla;
}

// Cuántas personas eligieron cada opción de una pregunta: [3, 0, 7, 1]
export function conteoRespuestas(sala, preguntaId) {
  const conteo = [0, 0, 0, 0];
  const resp = sala?.respuestas?.[preguntaId] || {};
  for (const r of Object.values(resp)) conteo[r.opcion]++;
  return conteo;
}

export const pasoActual = (sala) => GUION[sala?.estado?.paso] || null;
