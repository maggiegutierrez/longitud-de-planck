# Contexto para Claude Code

## Quién trabaja aquí
Una persona desarrolladora web junior que quiere **aprender** con este proyecto. En cada cambio:
- Explica en español qué vas a hacer y por qué, antes de hacerlo.
- Mantén los comentarios del código en español y explicativos.
- Prefiere soluciones simples y legibles a soluciones ingeniosas.
- No añadas frameworks, npm ni pasos de compilación sin preguntar: el proyecto es HTML/CSS/JS puro a propósito.

## Qué es
Reportaje interactivo sobre la longitud de Planck para una presentación de 10-15 min con hasta ~15 personas en la misma red de hogar.
- `index.html`: modo lectura con scroll (sin Firebase).
- `presentador.html`: proyector; crea la sala, muestra el QR y controla los pasos.
- `jugar.html`: teléfono del público; apodo, respuestas y tarjeta final.
- Publicado en GitHub Pages (repo `longitud-de-planck`). PWA con `sw.js`.

## Decisiones tomadas (no cambiar sin preguntar)
- Estética: fondo oscuro, halos difuminados violeta → magenta → rojo → naranja que cambian por capítulo; regla de potencias de diez (10⁰ → 10⁻³⁵) a la derecha; títulos en Unbounded 800 mayúsculas con efecto de grano (filtro SVG en `ui.js`).
- Quiz: 20 s por pregunta, 10 puntos fijos por acierto, top 5 con apodos en el proyector, tarjeta final por persona.
- Firebase Realtime Database + inicio de sesión anónimo. Los puntajes se calculan a partir de las respuestas, no se guardan.
- Todo el texto vive en `js/contenido.js`. Usa `[[término]]` para enlazar al glosario.
- Contenido solo de fuentes verificables (NIST/CODATA, Fermilab, NASA/Nature, arXiv). Sin afirmaciones especulativas presentadas como hechos (p. ej., "el espacio está hecho de píxeles").

## Pruebas
- Servidor local: extensión Live Server. Los módulos ES no funcionan con `file://`.
- Emuladores: `firebase emulators:start --project demo-planck --only auth,database` y abrir las páginas con `?emulador`.
- Al cambiar archivos publicados, sube `VERSION` en `sw.js`.
