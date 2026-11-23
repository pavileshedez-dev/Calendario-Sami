# Agenda Sami

**Agenda Sami** es un centro integral de organización personal, académica y laboral diseñado a medida para **Sami** (Universidad Complutense de Madrid · Grado en Logopedia y actividad laboral en Guadalajara, Castilla-La Mancha).

La aplicación conserva la estética editorial y minimalista tipo Apple del proyecto original, complementada con un hábitat de dos personajes pixel-art reales, animados por secuencias de frames, y un backend persistente en SQLite.

---

## Mascotas pixel art

Las mascotas se redibujaron siguiendo las nuevas referencias artísticas de `referencias/mascotas/`: Pibble es un perro de tipo pug de pelaje crema con máscara y orejas negras; Capilámpara es un carpincho tostado con una naranja-lámpara de hoja verde, birrete y mochila universitaria.

### Pibble

- Sprite de 48×48 píxeles, paleta cerrada y contorno de un píxel.
- **17 estados y 62 frames**: dormir con gafas, despertar, reposo, caminar, correr, sentarse, tumbarse, jugar boca arriba, rascarse, caricias, felicidad, ladrido mudo, gruñido, gruñido juguetón, saludo, transformación en Pibblino y reposo de Pibblino.
- Empieza **dormido con gafas** al abrir la aplicación.
- Al acariciarlo muestra exclusivamente **«¡Te quiero! ❤️»**.
- Tras cinco caricias consecutivas se activa **Pibblino** durante 30 segundos, con animación propia, corona y el mensaje **«¿Vemos La que se avecina?»**. Después vuelve solo a Pibble.
- El ladrido es visual (mandíbula, cabeza y cuerpo), sin audio; los gruñidos también son mudos.
- Partículas de corazones dibujadas como sprites pixel-art, no como emojis.

### Capilámpara

- Carpincho de 48×48 píxeles con naranja-lámpara de hoja verde sobre la cabeza o el birrete.
- **11 estados y 37 frames**: reposo, caminar, sentarse, tumbarse, leer, estudiar, dormir, despertar, caricias, saludo y ponerse el atuendo.
- Tres hojas de sprites: cuerpo natural, cuerpo con atuendo universitario (birrete con borla y mochila) y la variante con gafas redondas para lectura/estudio.
- La lámpara se enciende automáticamente **entre las 00:00 y las 05:59 de Europe/Madrid**.
- La lámpara se puede apagar y encender pulsando directamente sobre ella. El apagado manual se respeta dentro del tramo nocturno.
- La luz cálida se proyecta sobre la página mediante una capa de gradiente y tramado pixelado, y sobre el suelo del hábitat mediante un halo de píxeles.
- El atuendo se guarda en `localStorage` y puede activarse o quitarse.

### Referencias y extracción

- Originales conservados en `referencias/mascotas/`: `pibble-referencia.jpg`, `capilampara-referencia.jpg`, `capilampara-universitaria.jpg` y `capilampara-universitaria-gafas.jpg`.
- `scripts/extract-reference-poses.py` separa las 32 poses, elimina fondo, etiquetas y sombra, y guarda PNG individuales con transparencia en `referencias/mascotas/poses/`.
- Las poses extraídas son el archivo de comparación y QA. **No se usan como frames de runtime**: no forman ciclos coherentes. El atlas de animación se redibujó a 48×48 respetando silueta, paleta y accesorios de las referencias; el detalle de hoja, birrete, borla, mochila y gafas cabe y se lee a esa resolución.
- No se han generado imágenes nuevas con IA ni se han deformado las referencias para encajarlas.

### Hábitat, movimiento e interacciones

- Hábitat fijo en la parte inferior, presente en todas las pantallas, con suelo pixel-art y barandilla de controles.
- Pibble y Capilámpara caminan, corren, se sientan, se tumban, juegan, gruñen, leen, estudian, duermen y reaccionan de forma autónoma.
- Se acercan, se saludan y comparten una lectura tranquila; el saludo se puede forzar en desarrollo con el evento `sami:mascotas:saludo`.
- Los personajes no bloquean la interfaz: el contenedor del hábitat no captura clics fuera de los botones y las mascotas. La barandilla reserva espacio para el FAB de escritorio y para la navegación móvil.
- El hábitat se puede ocultar y volver a mostrar.

### Regla de comunicación

- El único emoji permitido en toda la aplicación es **❤️**, y solo dentro del mensaje exacto **«¡Te quiero! ❤️»** de Pibble.
- Los avisos, la lámpara, el atuendo, las reflexiones semanales, las respuestas del asistente y el resto de mensajes usan texto normal y pixel-art.
- Las respuestas libres de la IA se limpian de emojis antes de mostrarse.

### Recursos gráficos

Generados y versionados en `public/sprites/`:

| Archivo | Contenido |
|---|---|
| `pibble.png` | 6 columnas × 17 filas de frames de 48×48 (62 frames) |
| `capilampara.png` | 4 columnas × 11 filas de frames de 48×48, sin atuendo (37 frames) |
| `capilampara-outfit.png` | La misma rejilla con birrete y mochila |
| `capilampara-outfit-glasses.png` | La misma rejilla con gafas de lectura |
| `lamp.png` | Naranja-lámpara apagada y tres frames encendida |
| `glow.png` | Halo cálido y cono de luz en tres frames |
| `zzz.png`, `heart.png`, `sparkle.png` | Partículas pixel-art |
| `bubble.png`, `bubble-tail.png` | Bocadillo 9-slice y cola |
| `floor.png`, `dither.png` | Suelo y tramado de la luz |
| `manifest.json` | Metadatos de las hojas, anclajes y recursos |

- Manifiesto de animaciones: `src/components/mascots/spriteManifest.js`.
- Página de inspección de frames: `public/sprites/preview.html`.
- Regeneración reproducible:

```bash
node scripts/generate-pixel-sprites.mjs
```

---

## Características principales

### Trabajo (Sistema D)

- **Fichaje en vivo**: fichar entrada, iniciar pausa café/comida, reanudar y fichar salida con contador activo.
- **Cálculo de tiempos**: horas netas trabajadas, pausas acumuladas y cómputo de horas extra respecto a la jornada planificada.
- **Planificación de turnos**: calendario de turnos previstos (ordinario, mañana, tarde, noche, guardia).
- **Festivos locales y autonómicos**: reconocimiento de festivos de Guadalajara y nacionales.

### Mi Semana

- Retrospectiva semanal navegable históricamente.
- Balance de progreso académico UCM, cumplimiento laboral y tiempo libre.
- Comentarios de Pibble y Capilámpara mostrados con avatares animados.

### Gestor universitario y horario

- Tablero Kanban por asignaturas para el Grado en Logopedia.
- Catálogo unificado de 15 asignaturas.
- Horario semanal interactivo con aulas y horas lectivas.

### Asistentes de IA

- **Pibble** conectado a DeepSeek (`deepseek-chat`).
- **Capilámpara** conectado a Google Gemini (`gemini-2.5-flash`).
- Arquitectura de consentimiento explícito: cualquier cambio en la agenda se presenta como propuesta y requiere confirmación manual.
- Memoria compartida configurable desde Ajustes.
- Si no hay claves configuradas, la aplicación funciona con un modo local heurístico.

---

## Identidad visual y logotipo

- Logotipo procesado a partir de `logo.app.jpg`.
- Adaptaciones en `public/`: `logo.png`, `pwa-512x512.png`, `pwa-192x192.png`, `apple-touch-icon.png`, `favicon.png`.

---

## Persistencia y base de datos

- **Motor**: SQLite persistente mediante `node:sqlite` (Node.js 24 LTS).
- **Ubicación**: `server/data/agenda_sami.sqlite`.
- **Independencia**: recompilar el frontend no sobrescribe la base de datos.
- **Copias de seguridad**: exportación e importación JSON desde Ajustes.

---

## Instalación y puesta en marcha

Requisitos: Node.js 24 LTS (no usar 22.5–22.12: `node:sqlite` requiere flag hasta 22.13).

```bash
npm install

# Terminal 1: API + SQLite
npm run server

# Terminal 2: frontend con proxy /api
npm run dev
```

### Producción

```bash
npm run build
npm start
```

La aplicación queda disponible en `http://localhost:3001`.

---

## Claves de IA

Las claves son opcionales. Se pueden introducir desde **Ajustes** o mediante `.env`:

```bash
cp .env.example .env
```

Variables: `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`.

---

## Comprobaciones rápidas

```bash
# Lógica pura de mensajes, caricias y horario de Madrid
node scripts/mascot-logic.test.mjs

# Regenerar hojas de sprites
node scripts/generate-pixel-sprites.mjs

# Build de producción con PWA
npm run build
```

Los scripts de `scripts/audit-*.mjs` son herramientas de QA visual con Chrome DevTools Protocol; requieren Chrome con `--remote-debugging-port=9222` y Vite en el puerto 5199.
