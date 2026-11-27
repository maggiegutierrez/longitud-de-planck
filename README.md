# Longitud de Planck

Un reportaje interactivo sobre la longitud de Planck (1,616 × 10⁻³⁵ m) que se puede **leer con scroll** o **presentar en vivo**: el público escanea un QR, responde preguntas desde su teléfono y suma 10 puntos por acierto. Al final, cada participante recibe una tarjeta con su puntaje.

| Página | Para qué sirve |
|---|---|
| `index.html` | Modo lectura: la historia con scroll, preguntas y glosario. Funciona sin Firebase. |
| `presentador.html` | Se proyecta. Muestra el QR, controla los capítulos y las preguntas, y enseña el top 5. |
| `jugar.html` | Se abre en el teléfono del público al escanear el QR. |

Hecho con HTML, CSS y JavaScript sin frameworks ni compilación. Firebase Realtime Database sincroniza el modo en vivo. Se puede instalar como app (PWA).

**¿Primera vez?** Lee [APRENDE.md](APRENDE.md): explica cómo está hecho, cómo configurar Firebase y cómo publicarlo en GitHub Pages.

## Fuentes

- Valor de ℓP: [NIST, CODATA 2022](https://physics.nist.gov/cgi-bin/cuu/Value?plkl)
- Historia: [Living Reviews in Relativity](https://www.maths.tcd.ie/EMIS/journals/LRG/Articles/lrr-2013-2/articlese2.html)
- Contexto: [Fermilab Today, D. Lincoln (2013)](https://www.fnal.gov/pub/today/archive/archive_2013/today13-11-01_NutshellReadMore.html)
- GRB 090510: [Abdo et al., Nature 462, 331 (2009)](https://doi.org/10.1038/nature08574)
- Holómetro: [Fermilab News (2015)](https://news.fnal.gov/2015/12/holometer-rules-out-first-theory-of-space-time-correlations/)
- Entropía de agujeros negros: [D. Page, arXiv:hep-th/0401160](https://arxiv.org/abs/hep-th/0401160)
