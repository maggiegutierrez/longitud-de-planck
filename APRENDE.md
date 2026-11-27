# Aprende cómo está hecho

Esta guía explica el proyecto de principio a fin: qué hace cada archivo, cómo se comunican, cómo configurar Firebase, cómo publicarlo y qué conceptos de desarrollo web usa. Léela con el código abierto al lado.

---

## 1. Mapa del proyecto

```
longitud-de-planck/
├── index.html            Modo lectura (scrollytelling)
├── presentador.html      Pantalla del proyector
├── jugar.html            Teléfono del público
├── css/
│   ├── base.css          Colores, tipografía, títulos granulados, regla, botones
│   ├── lectura.css       Estilos solo de index.html
│   ├── presentador.css   Estilos solo del proyector (16:9)
│   └── jugar.css         Estilos solo del teléfono
├── js/
│   ├── contenido.js      ★ TODO el texto: capítulos, preguntas, glosario, enlaces
│   ├── ui.js             Piezas visuales compartidas (grano, glosario, regla, halo)
│   ├── sala.js           Todo lo que habla con Firebase
│   ├── firebase-config.js  ★ Aquí pegas la configuración de tu proyecto
│   ├── lectura.js        Lógica del modo lectura
│   ├── presentador.js    Lógica del proyector
│   ├── jugar.js          Lógica del teléfono
│   └── pwa.js            Registra el service worker
├── sw.js                 Service worker: permite instalarla y abrirla sin internet
├── manifest.webmanifest  Nombre, colores e íconos de la app instalada
├── icons/                Íconos de la app
├── database.rules.json   ★ Reglas de seguridad de la base de datos
└── firebase.json         Configuración de los emuladores (solo para pruebas)
```

Los archivos con ★ son los que vas a tocar con más frecuencia.

**¿Quieres cambiar una pregunta o un texto?** Edita solo `js/contenido.js`. Las tres pantallas lo leen de ahí.

---

## 2. Cómo se conectan las piezas

Cada HTML carga sus estilos y **un** archivo JavaScript principal con `<script type="module">`. Ese archivo importa lo que necesita de los demás:

```
presentador.js ──┐
jugar.js ────────┼──► contenido.js   (datos)
lectura.js ──────┤──► ui.js          (efectos visuales)
                 └──► sala.js ──► firebase-config.js ──► Firebase (en la nube)
                      (lectura.js no usa sala.js: funciona sin Firebase)
```

### El modo en vivo, paso a paso

Firebase Realtime Database es un gran objeto JSON en la nube. Quien "escucha" una ruta recibe cada cambio al instante.

1. **El proyector crea una sala** con un código de 4 letras y guarda en `salas/CODIGO/host` su identificador.
2. **Cada teléfono** escanea el QR (`jugar.html?sala=CODIGO`), inicia sesión de forma anónima y se guarda en `salas/CODIGO/jugadores/SU_ID`.
3. **El proyector es el único que cambia `estado`**: en qué paso del guion vamos y si la pregunta está abierta.
4. **Todos escuchan la sala**. Cuando `estado` cambia, cada pantalla se vuelve a dibujar (función `dibujar()` en `presentador.js` y `jugar.js`).
5. **Al responder**, el teléfono escribe en `respuestas/PREGUNTA/SU_ID`.
6. **Los puntos no se guardan**: se calculan a partir de las respuestas (`calcularPuntajes()` en `sala.js`). Así nunca pueden quedar desincronizados.

### ¿Cómo sabe todo el mundo cuándo terminan los 20 segundos?

El proyector guarda `abiertaHasta`: la hora exacta **del servidor** en que se cierra la pregunta. Cada dispositivo corrige su propio reloj con `.info/serverTimeOffset`, que Firebase entrega gratis. Así la cuenta regresiva coincide en todos los teléfonos aunque sus relojes estén desajustados.

---

## 3. Probar en tu computadora

Los módulos de JavaScript (`import`/`export`) **no funcionan** si abres el HTML con doble clic (`file://`). Necesitas un servidor local:

1. En VS Code, instala la extensión **Live Server** (de Ritwick Dey).
2. Clic derecho en `index.html` → **Open with Live Server**.
3. Se abre `http://127.0.0.1:5500/index.html`.

El **modo lectura** funciona en cuanto lo abres. El **modo en vivo** necesita Firebase (sección 4).

**Para simular público en tu computadora:** abre `presentador.html` en una ventana normal y `jugar.html?sala=CODIGO` en **ventanas de incógnito**, una por participante. Firebase recuerda la sesión por navegador, así que dos pestañas normales serían la misma persona.

Para ver el teléfono, abre las DevTools (`F12`) y pulsa el icono de dispositivo móvil (`Ctrl+Shift+M`).

---

## 4. Configurar Firebase (una sola vez, ~10 min)

1. Entra a <https://console.firebase.google.com> con tu cuenta de Google y pulsa **Crear un proyecto**. Nómbralo, por ejemplo, `longitud-de-planck`. Google Analytics no es necesario.
2. **Base de datos:** menú *Compilación* → **Realtime Database** → **Crear base de datos**. Elige una ubicación (la de Estados Unidos sirve) y empieza en **modo bloqueado**.
3. **Reglas:** en la pestaña **Reglas** de Realtime Database, borra lo que haya, pega el contenido de `database.rules.json` y pulsa **Publicar**. *Este paso es el que protege tus datos.*
4. **Inicio de sesión anónimo:** *Compilación* → **Authentication** → **Comenzar** → pestaña **Método de acceso** → **Anónimo** → actívalo y guarda.
5. **Registrar la app web:** ⚙️ (junto a "Descripción general") → **Configuración del proyecto** → sección *Tus apps* → icono **`</>`** → ponle un nombre → **Registrar app**.
6. Copia el objeto `firebaseConfig` que aparece y pégalo en `js/firebase-config.js`, reemplazando los valores de ejemplo.
7. Comprueba que tenga `databaseURL`. Si no aparece, cópiala de la parte superior de la página de Realtime Database (algo como `https://longitud-de-planck-default-rtdb.firebaseio.com`).

### ¿Por qué las claves pueden estar en GitHub?

La `apiKey` de Firebase **identifica** tu proyecto, pero no da permisos. Lo que decide quién lee y escribe son las **reglas** del paso 3. Léelas en `database.rules.json`:

- Solo quien creó la sala (`host`) puede cambiar el estado.
- Cada persona solo puede escribir **su propio** registro y **su propia** respuesta.
- Una respuesta solo se acepta una vez, mientras la pregunta está abierta y antes de que se acabe el tiempo.
- Un apodo debe tener entre 1 y 16 caracteres.

---

## 5. Publicar en GitHub Pages desde VS Code

1. Abre la carpeta del proyecto en VS Code (*Archivo → Abrir carpeta*).
2. Abre el panel **Source Control** (icono de ramitas, o `Ctrl+Shift+G`).
3. Pulsa **Publish to GitHub**. Si te lo pide, inicia sesión en GitHub en el navegador y vuelve a VS Code.
4. Elige **Publish to GitHub public repository** y nómbralo `longitud-de-planck`. VS Code crea el repositorio, hace el primer *commit* y lo sube (*push*).
5. En github.com, abre tu repositorio → **Settings** → **Pages**.
6. En *Build and deployment*, elige **Deploy from a branch**, la rama **main** y la carpeta **/ (root)**. Pulsa **Save**.
7. En 1-2 minutos estará en: `https://TU-USUARIO.github.io/longitud-de-planck/`

### Para cada cambio futuro

1. Edita y guarda.
2. En Source Control, escribe un mensaje que diga qué cambiaste (por ejemplo, "Corrige la pregunta 3") y pulsa **Commit**.
3. Pulsa **Sync Changes** (o *Push*). GitHub Pages se actualiza solo en uno o dos minutos.

Cuando cambies archivos, sube el número de `VERSION` en `sw.js` (por ejemplo, `planck-v2`) para que las apps instaladas descarguen la versión nueva.

---

## 6. El día de la presentación

- [ ] Abre `https://TU-USUARIO.github.io/longitud-de-planck/presentador.html` en la computadora conectada al proyector.
- [ ] Pulsa `F` (o ⛶) para pantalla completa.
- [ ] Espera a que aparezcan los nombres del público y pulsa **→** o **Espacio** para empezar.
- [ ] En una pregunta, **→** la cierra antes de tiempo. Se cierra sola a los 20 s o cuando ya respondió todo el mundo.
- [ ] **←** vuelve atrás. Una pregunta ya respondida no se vuelve a abrir.
- [ ] Un control inalámbrico de presentaciones también funciona: envía las mismas teclas.
- [ ] Si recargas el proyector por accidente, retoma la misma sala.
- [ ] Si alguien recarga el teléfono, vuelve a su sala con sus puntos.

---

## 7. Conceptos que vale la pena estudiar en este código

| Concepto | Dónde verlo | Qué hace |
|---|---|---|
| Módulos ES (`import`/`export`) | Todos los `.js` | Dividir el código en archivos con responsabilidades claras |
| Separar datos y presentación | `contenido.js` | El texto se edita en un solo lugar |
| "La interfaz es una función del estado" | `dibujar()` en `presentador.js` | Con el mismo estado, la pantalla siempre se dibuja igual |
| Delegación de eventos | `activarGlosario()` en `ui.js` | Un solo escuchador para todos los términos del glosario |
| `IntersectionObserver` | `lectura.js` | Saber qué sección está en pantalla sin escuchar el scroll |
| Filtros SVG | `filtroSVG()` en `ui.js` | El efecto de grano en los títulos |
| `@property` y variables CSS | `base.css` | Animar el cambio de color del halo |
| `clamp()`, `vw`, `svh`, `dvh` | Los `.css` | Tamaños que se adaptan a la pantalla |
| `env(safe-area-inset-*)` | `jugar.css` | Respetar el notch del iPhone |
| `textContent` frente a `innerHTML` | `el()` en `ui.js` | Mostrar texto escrito por usuarios sin riesgo de inyectar HTML |
| Service worker | `sw.js` | App instalable y disponible sin conexión |
| Base de datos en tiempo real y reglas | `sala.js`, `database.rules.json` | Sincronizar dispositivos de forma segura |

---

## 8. Límites conocidos

- **Las respuestas correctas están en el código público** (`contenido.js`). Alguien muy curioso podría verlas con las DevTools. Para una presentación entre amistades o en clase está bien; ocultarlas requeriría un servidor (Cloud Functions de Firebase).
- **El plan gratuito de Firebase** (Spark) admite 100 conexiones simultáneas: de sobra para 15 personas.
- **Las salas viejas se quedan en la base de datos.** Puedes borrarlas desde la consola de Firebase (Realtime Database → los tres puntos junto a `salas` → Eliminar).

---

## 9. (Opcional) Probar con los emuladores de Firebase

Los emuladores son una copia local de Firebase, ideal para probar sin tocar tu proyecto real. Necesitan Node.js y Java.

```bash
npm install -g firebase-tools
```

```bash
firebase emulators:start --project demo-planck --only auth,database
```

Luego abre `presentador.html?emulador` con Live Server. El parámetro `?emulador` hace que `sala.js` se conecte a tu computadora en lugar de a la nube.
