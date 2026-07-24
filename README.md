# 🎸 Wrapping Tune

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-9B87F5?style=flat-square)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🦊 Descripción

**Wrapping Tune** es un afinador de guitarra en tiempo real desarrollado con **HTML5**, **CSS3** y **JavaScript puro**, utilizando la **Web Audio API** para el procesamiento de señal y detección de frecuencias por autocorrelación.

Diseñado con un enfoque minimalista y moderno — inspirado en la estética de apps como GuitarTuna en mobile, y con la identidad visual original de **WrappingMati** en desktop — forma parte del ecosistema de proyectos de [WrappingMati](https://wrappingmati.com.ar) 🎧

---

## 🚀 Características principales

- 🔊 **Detección de notas en tiempo real** mediante el micrófono, con suavizado de la lectura para evitar saltos bruscos.
- 🎼 **6 afinaciones disponibles**: Estándar, Drop D, ½ tono abajo (Eb), Drop C#, 1 tono abajo (D estándar) y Drop C.
- 🎸 **Las 6 cuerdas siempre visibles**, con su nota correspondiente actualizada según la afinación elegida — se ven aunque todavía no encendiste el micrófono.
- 🔒 **Modo manual**: podés fijar una cuerda específica tocándola en pantalla, para que el afinador mida solo contra esa nota (útil si estás muy desafinado y el modo automático dudaría entre cuerdas vecinas).
- 🎚️ **Medidor visual en cents** (no en Hz crudos), con zona central de "afinado" y color según precisión (verde / amarillo / rojo).
- 📱 Diseño **responsive**: interfaz compacta al estilo GuitarTuna en celular, y la estética original de WrappingMati en desktop/notebook.
- 🎨 Paleta de colores inspirada en la marca **WrappingMati**.
- 💡 Frecuencias calculadas en temperamento igual, referencia **A4 = 440 Hz**.

---

## 🧠 Tecnologías utilizadas

| Tecnología | Uso |
|-------------|-----|
| **HTML5** | Estructura del proyecto y acceso al micrófono. |
| **CSS3** | Diseño visual, tipografía y estilos responsive (mobile/desktop). |
| **JavaScript** | Lógica de detección de frecuencia, afinaciones y notas musicales. |
| **Web Audio API** | Captura y análisis del audio en tiempo real (`AnalyserNode` + autocorrelación). |

---

## 🎸 Cómo usarlo

1. Abrí la web y elegí una afinación en el selector de arriba (Estándar, Drop D, etc.).
2. Opcional: tocá una de las 6 cuerdas en pantalla para fijarla como objetivo, o dejalo en modo automático.
3. Hacé clic en el botón del micrófono 🎙️ y permití el acceso al micrófono de tu dispositivo.
4. Tocá una cuerda de la guitarra y observá:
   - La **nota detectada** (ej: E4)
   - La **frecuencia exacta** (ej: 329.6 Hz)
   - El **desvío en cents** y el medidor visual, que te dice si estás bajo, alto o afinado.
5. Tocá el botón de mic de nuevo para detener el afinador.

---

## 🔬 ¿Cómo funciona la detección? (resumen)

El afinador usa el algoritmo de **autocorrelación** sobre la señal cruda del micrófono para estimar la frecuencia fundamental de la nota tocada, la compara contra las frecuencias objetivo de la afinación elegida, y expresa la diferencia en **cents** para un medidor preciso en todo el rango de la guitarra. El detalle completo del algoritmo está documentado en los comentarios de `app.js`.

---

## 🧩 Próximas mejoras

- 🎵 Animación de **cuerdas vibrantes** según frecuencia.
- 💾 Posibilidad de **guardar afinaciones personalizadas**.
- 🎻 Soporte para otros instrumentos (bajo, ukelele).

---

## 🪪 Licencia

Este proyecto está bajo la licencia **MIT**, lo que significa que podés usarlo, modificarlo y distribuirlo libremente siempre que se mencione al autor original.
© 2025 WrappingMati. Todos los derechos reservados.

---

## 💻 Demo en vivo

👉 [https://wrapping-tuner.netlify.app/]

---

## 🧑‍🎤 Autor

**Desarrollado por:**
💻 [Matías Casas](https://wrappingmati.com.ar) — *WrappingMati*
📸 [Instagram](https://instagram.com/wrappingmati)
💼 [LinkedIn](https://www.linkedin.com/in/matias-casas-413910257/)
🐙 [GitHub](https://github.com/wrappingmati)

---

> 🎶 *"Afina tu guitarra, afina tu código." — WrappingMati*
