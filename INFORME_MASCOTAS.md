# Informe de auditoría e implementación · Pibble y Capilámpara

Fecha: 14 de noviembre de 2026  
Proyecto: `Agenda Sami`  
Alcance: sistema visual e interactivo de las mascotas, su integración y la regla de comunicación. No se ha reconstruido la aplicación ni se ha cambiado la lógica del backend, la base de datos o las personalidades de las IA.

---

## 1. Punto de partida real

No se encontró en el repositorio ningún informe de Antigravity ni documentación de auditoría previa. La auditoría se hizo leyendo el código y los recursos reales del proyecto.

### Lo que había

- **No existían spritesheets, secuencias de imágenes ni estados de animación.** `public/` solo contenía logotipos, iconos PWA y favicons.
- Pibble y Capilámpara eran **SVG estáticos de 32×32** dibujados con rectángulos. Los cambios de estado solo intercambiaban unos pocos rectángulos (ojos, boca, gafas, birrete).
- Las animaciones existentes eran **CSS sobre la ilustración completa**: `animate-bounce`, `animate-pulse`, `hover:scale-105`, `active:scale-90`, `animate-float-heart` y `animate-ping`. No había cambio de postura entre frames.
- Pibble solo tenía tres estados reales: dormido, despierto y una boca abierta. **No había** despertar secuenciado, caminar, sentarse, tumbarse, rascarse, felicidad ni animación especial de Pibblino.
- Pibblino era un cambio de nombre y un `animate-pulse`; no había animación propia.
- Capilámpara no tenía reposo, caminar, sentarse, leer, estudiar, dormir ni reacción a caricias. El atuendo era mostrar/ocultar un birrete y una bufanda.
- La lámpara funcionaba con un `setInterval` que **volvía a encenderla cada minuto** aunque se apagara a mano; tampoco se apagaba automáticamente al salir del tramo 00:00–06:00.
- La luz era un círculo `blur-xl` detrás de la mascota y partículas de `Sparkles` de Lucide; no afectaba al entorno ni era pixel art.
- No había desplazamiento ni interacción entre mascotas. El panel flotante era `hidden md:block` y no aparecía en móvil.
- Los bocadillos eran rectángulos redondeados con `animate-bounce`, no bocadillos pixel art.
- En AsesorIA, las mascotas completas se renderizaban **dentro de un `<button>`**, creando botones anidados, y sus etiquetas de 32/40 px desbordaban las pestañas.
- Había emojis en mensajes de mascotas, en la interfaz y en respuestas del backend: patitas, palomitas, sofá, estrella, bombilla, luna, birrete, hoja, perro y destellos, entre otros.

---

## 2. Referencias nuevas: auditoría visual e inventario

Las cuatro imágenes incorporadas están en `referencias/mascotas/` (se copiaron desde `Calendario/`, que es donde aparecían realmente; no existía la carpeta `referencias/mascotas/`). Se conservan intactas como JPG originales.

| Archivo | Personaje | Contenido observado |
|---|---|---|
| `pibble-referencia.jpg` | Pibble | 8 poses: idle sentado, feliz de pie, rascándose, ladrando con «Woof» dibujado, dormido, boca abajo, boca arriba y caminando. Pelaje crema, máscara y orejas negras, hocico negro, cola enroscada. **Sin collar ni gafas en la referencia**. |
| `capilampara-referencia.jpg` | Capilámpara normal | Las mismas 8 poses. Carpincho tostado, panza crema, naranja con hoja verde sobre la cabeza. **Sin birrete ni mochila**. |
| `capilampara-universitaria.jpg` | Capilámpara UCM | Las mismas 8 poses, con birrete negro de borla dorada, mochila negra y correas cruzadas. La naranja-lámpara se apoya sobre el birrete. |
| `capilampara-universitaria-gafas.jpg` | Capilámpara UCM con gafas | Variante de la anterior con gafas redondas de montura fina. |

### 2.1 Qué se puede aprovechar directamente

- La **dirección de arte**: proporciones, paleta, grosor de contorno, forma de la máscara de Pibble, hocico de carpincho, orejas, cola, panza y accesorios.
- Los **accesorios**: naranja con hoja, birrete con borla, mochila, correas y gafas redondas.
- Las **8 poses por hoja** se separaron en PNG individuales con transparencia: 32 recortes de alta resolución y su versión normalizada a 48×48 para comparación.
- El **fondo, las etiquetas y la sombra** se eliminaron por segmentación; las letras y destellos sueltos se descartaron conservando el componente principal del personaje.

Los recortes están en `referencias/mascotas/poses/<hoja>/` y la hoja de contacto en `docs/auditoria-mascotas/12-referencias-separadas.png`.

### 2.2 Qué no se puede usar directamente como animación

Las hojas son **poses estáticas**, no ciclos. No hay frames intermedios de caminar, correr, despertar, ladrar, gruñir, saludar ni transformarse. Usar los 8 recortes como si fueran una animación habría sido exactamente el fallo que había que evitar.

Por eso:

- los recortes quedan como archivo de referencia y QA;
- el atlas de runtime se **redibujó a 48×48** respetando la nueva identidad, para que cada estado tenga frames propios y coherentes;
- no se deformó ningún recorte para encajarlo en la rejilla antigua.

### 2.3 Comprobación de la resolución 48×48

Se redujeron las poses de referencia a 48×48 y se comprobó que siguen distinguiéndose la hoja de la naranja, el birrete, la borla, la mochila, las correas y las gafas. El detalle no exigía aumentar el lienzo: el problema anterior no era solo la resolución, sino la silueta, la paleta y los accesorios. Se mantiene 48×48 para conservar el renderizado nítido a 2× y no romper el hábitat, la tarjeta inline ni los avatares.

### 2.4 Poses y frames nuevos que hizo falta dibujar

A partir de las poses de referencia se añadieron o completaron, con dibujo procedural coherente:

- **Pibble**: correr, jugar boca arriba, gruñir, gruñido juguetón, saludo con pata, despertar secuenciado, transformación y reposo de Pibblino. La referencia no trae estos ciclos.
- **Capilámpara**: despertar, tumbarse, saludo, vestirse y los objetos de lectura/estudio (libro, cuaderno y lápiz). La referencia solo trae una pose de estudio.
- **Gafas de Pibble al dormir**: no están en la referencia de Pibble, pero se conservan porque son un requisito funcional previo. Se dibujaron con montura oscura acorde a la nueva paleta.
- **Pibblino**: la corona no aparece en la referencia; se conserva la identidad especial existente y se dibuja sobre la nueva cabeza.

No se ha generado ninguna imagen con IA ni se han inventado personajes nuevos.

---

## 3. Lo implementado

### 3.1 Animación real por frames

- Generador reproducible: `scripts/generate-pixel-sprites.mjs`.
- Lienzo y codificador PNG sin dependencias: `scripts/pixel/png.mjs`.
- Dibujo procedural de Pibble, Capilámpara, lámpara, luz, partículas y UI: `scripts/pixel/*.mjs`.
- Hojas de sprites de 48×48 y manifiesto generado en `src/components/mascots/spriteManifest.js`.
- Renderizador `PixelSprite` que cambia `background-position` por frame; `image-rendering: pixelated`; sin transformaciones CSS que simulen la animación.
- Reloj de frames `useSpriteFrame` / `useStripFrame`.
- **Pibble: 17 estados y 62 frames distintos.**
  - dormido con gafas, despertar, reposo, caminar, correr, sentarse, tumbarse, jugar boca arriba, rascarse, caricias, felicidad, ladrido mudo, gruñido, gruñido juguetón, saludo, intro de Pibblino y reposo de Pibblino.
- **Capilámpara: 11 estados y 37 frames por hoja**, en tres variantes:
  - sin atuendo (`capilampara.png`), con birrete y mochila UCM (`capilampara-outfit.png`) y con gafas de lectura (`capilampara-outfit-glasses.png`).
  - reposo, caminar, sentarse, tumbarse, leer, estudiar, dormir, despertar, caricias, saludo y vestirse.
- El atuendo UCM ya no usa la bufanda azul anterior: sigue la referencia con birrete de borla y mochila negra.
- La variante con gafas se usa automáticamente al leer y estudiar; el resto del tiempo el atuendo va sin gafas.
- Todas las filas de frames se verificaron con hash: **no hay frames duplicados dentro de un estado** (ver pruebas).
- Las poses separadas de las referencias y su extracción están documentadas en la sección 2; no se usan como frames de runtime.

### 3.2 Pibble

- Nuevo diseño basado en la referencia: pelaje crema, máscara y orejas negras, hocico negro, papada y cola enroscada. Se retiró el collar y el blanco de la versión anterior.
- Empieza dormido con gafas al abrir la aplicación.
- Animación de despertar secuenciada.
- Movimiento autónomo, caminar, correr, sentarse, tumbarse, jugar boca arriba, rascarse, reacción a caricias, felicidad y ladrido mudo con mandíbula, cabeza y cuerpo.
- Gruñido y gruñido juguetón (posición de reverencia) sin sonido.
- Saludo con pata levantada.
- Al acariciarlo aparece **exclusivamente**: `¡Te quiero! ❤️`.
- Tras cinco caricias consecutivas:
  - animación especial de transformación con corona y destellos;
  - nombre temporal **Pibblino** en la tarjeta inline y en la barandilla del hábitat;
  - mensaje **¿Vemos La que se avecina?**;
  - vuelta automática a Pibble a los 30 segundos.
- El contador de caricias se reinicia si pasa demasiado tiempo entre ellas (ventana de 6 s).
- Partículas de corazones dibujadas como PNG pixel art, no como emojis.

### 3.3 Capilámpara

- Nuevo diseño basado en la referencia: carpincho tostado, panza crema, hocico oscuro y orejas pequeñas.
- Reposo, caminar, sentarse, tumbarse, leer, estudiar, dormir, despertar, caricias, saludo y vestirse.
- Naranja-lámpara con hoja verde y frames propios de apagada y encendida. Es una capa separada para conservar su zona pulsable y su anclaje sobre la cabeza o el birrete.
- La lámpara se enciende automáticamente de **00:00 a 05:59 en `Europe/Madrid`**.
- Se puede apagar y encender **pulsando directamente la naranja** (zona táctil de 40 px), además del botón «Luz».
- El apagado manual se respeta dentro del tramo nocturno; al cambiar de tramo se aplica de nuevo el horario.
- Atuendo universitario con birrete de borla dorada y mochila negra; se guarda en `localStorage` y se puede poner o quitar.
- La hoja con gafas redondas se usa en lectura y estudio, siguiendo la referencia `capilampara-universitaria-gafas`.
- La luz cálida afecta al entorno:
  - capa fija con gradiente ámbar y dithering pixelado;
  - halo y cono de luz pixel art alrededor de la lámpara;
  - la iluminación del hábitat y de la página se actualiza siguiendo la posición de Capilámpara.
- Al encenderse, la capa de luz y el estado `aria-pressed` cambian de forma verificable.

### 3.4 Hábitat, movimiento e interacciones

- `MascotStage` montado en `Layout`: hábitat fijo presente en todas las pantallas, con suelo pixel art y barandilla de controles.
- Los personajes caminan, corren, se sientan, se tumban, juegan, gruñen, leen, estudian, duermen y reaccionan autónomamente.
- Capilámpara pasa de dormir a `wake` antes de elegir otra conducta, para que el despertar sea visible.
- Cambian de orientación al caminar y están limitados al hábitat.
- Se acercan, se saludan y comparten una lectura:
  - saludo con aproximación, mirada enfrentada y diálogo sin emojis;
  - lectura compartida con Pibble tumbado y Capilámpara leyendo.
- Se puede forzar el saludo en desarrollo con el evento `sami:mascotas:saludo` y el estado con `window.__SAMI_STAGE__` (solo `import.meta.env.DEV`).
- Botón «Ocultar» y botón «Mascotas» para recuperar el hábitat.
- El contenedor del hábitat no captura clics fuera de los botones y las mascotas; la barandilla reserva espacio para el FAB y para la navegación móvil.
- Se añadió padding inferior al contenido para que el final de cada página pueda quedar por encima del hábitat.

### 3.5 Bocadillos y comunicación

- `PixelBubble`: borde 9-slice pixel art, cola triangular pixel art, tipografía monoespaciada y animación de aparición por pasos.
- `aria-live="polite"` para que el texto sea anunciado.
- El único emoji de la aplicación es `❤️`, y solo en `¡Te quiero! ❤️`.
- Se limpiaron emojis de:
  - mensajes de Pibble y Capilámpara;
  - tarjeta del hábitat, AsesorIA y Mi Semana;
  - respuestas locales del backend (`server/ai.js`);
  - reflexiones semanales (`server/routes/semana.js`);
  - textos de Agenda, Calendario, Dashboard y Horario;
  - logs del servidor.
- Las respuestas libres de la IA se limpian antes de mostrarse con `sinEmojis()` (`src/lib/texto.js`), incluidas las propuestas. Esto no cambia la lógica de la IA; solo evita que un emoji llegue a la interfaz.

### 3.6 Integración

- `App.jsx`: `MascotProvider` envuelve toda la aplicación para compartir estado entre pantallas.
- `Layout.jsx`: `LampLight` + `MascotStage`; padding inferior; retirada del panel flotante antiguo (sustituido por el hábitat).
- `Hoy.jsx` y `Dashboard.jsx`: conservan `MascotsCompanion inline`, ahora con figuras animadas, nombre, estado y acciones.
- `AsesorIA.jsx`: avatares animados no interactivos en pestañas y mensajes; sin botones anidados; mensajes de bienvenida sin emojis; contenido de chat saneado.
- `MiSemana.jsx`: avatares animados y textos saneados.
- No se modificaron el backend de IA, la base de datos, las rutas de datos ni las personalidades, salvo las cadenas de mensajes de mascotas y los logs indicados.

---

## 4. Recursos gráficos generados

En `public/sprites/`:

| Archivo | Dimensiones | Contenido |
|---|---:|---|
| `pibble.png` | 288×816 | 6 columnas × 17 filas, frames 48×48, 62 frames |
| `capilampara.png` | 192×528 | 4 columnas × 11 filas, sin atuendo, 37 frames |
| `capilampara-outfit.png` | 192×528 | 4 columnas × 11 filas, con birrete y mochila |
| `capilampara-outfit-glasses.png` | 192×528 | 4 columnas × 11 filas, con gafas de lectura |
| `lamp.png` | 48×12 | naranja-lámpara apagada + 3 frames encendida |
| `glow.png` | 192×64 | 3 frames de halo/cono de luz |
| `zzz.png` | 48×16 | 3 frames de Z |
| `heart.png` | 22×10 | 2 frames de corazón pixel art |
| `sparkle.png` | 36×12 | 3 frames de destello |
| `bubble.png` | 24×24 | bocadillo 9-slice |
| `bubble-tail.png` | 16×8 | cola pixel art |
| `floor.png` | 32×24 | suelo pixel art |
| `dither.png` | 8×8 | tramado de la luz |
| `manifest.json` | — | metadatos de hojas, estados y anclajes |

- Referencias originales: `referencias/mascotas/*.jpg`.
- Recortes individuales: `referencias/mascotas/poses/` (32 poses de alta resolución + 32 versiones de comparación a 48×48).
- Herramienta de extracción: `scripts/extract-reference-poses.py`.

- Manifiesto: `src/components/mascots/spriteManifest.js`.
- Página de inspección: `public/sprites/preview.html`.
- Regeneración: `node scripts/generate-pixel-sprites.mjs`.
- Las hojas están versionadas como PNG; el generador es la fuente de verdad.
- No se añadió ninguna dependencia npm. `package.json` no cambió.

### Recursos que no existen todavía

- Archivos fuente `.aseprite` editables a mano. El arte de runtime es procedural y reproducible desde código; los JPG de referencia y sus recortes sí están conservados.
- Frames de referencia para correr, jugar, gruñir, saludar y despertar: no venían en las hojas y se dibujaron de forma procedural. Si se quiere un acabado pintado a mano, haría falta que un artista entregue esos ciclos.
- Variantes de Pibblino caminando, sentándose o tumbándose; Pibblino permanece en reposo durante sus 30 segundos.
- Posturas específicas de Capilámpara al accionar la lámpara (la reacción es la luz y el bocadillo, no un frame dedicado).
- Sonido de ladrido: se excluyó deliberadamente porque el requisito es un ladrido visual sin sonido.
- Fondos o mobiliario de escenario más allá del suelo, el dithering y la luz.
- Hojas específicas para móvil a menor resolución; el navegador escala las mismas hojas con `image-rendering: pixelated`.

---

## 5. Pruebas realizadas y resultados

### 5.1 Pruebas automáticas de lógica

```bash
node scripts/mascot-logic.test.mjs
```

Resultado: **4/4 pruebas correctas**.

- Horario de Madrid: encendido a las 02:00, 05:59 y 00:00; apagado a las 06:00.
- Reinicio de caricias fuera de la ventana y umbral de cinco.
- Mensajes exactos `¡Te quiero! ❤️` y `¿Vemos La que se avecina?`.
- Limpieza de emojis en texto libre.

### 5.2 Validación de hojas de sprites

Se comprobaron dimensiones, número de filas/columnas, contenido no vacío y hashes por frame con Pillow:

- `pibble.png`: 288×816; 17 estados; **62 frames, todos distintos dentro de su estado**.
- `capilampara.png`, `capilampara-outfit.png` y `capilampara-outfit-glasses.png`: 192×528; 11 estados; **37 frames por hoja, todos distintos**.
- `lamp`, `glow`, `zzz`, `heart`, `sparkle`, `bubble`, `tail`, `floor` y `dither` con dimensiones válidas y contenido.
- Las 32 poses de referencia se extrajeron con transparencia y se revisó que no quedaran etiquetas, fondo ni sombra azulada.

### 5.3 Pruebas de navegador (Chrome headless + CDP)

Se usaron páginas reales con backend y Vite. Resultados verificados:

| Prueba | Resultado |
|---|---|
| Pibble empieza dormido con gafas | Sí: `data-action="sleep"`, `data-state="sleep"` |
| Clic en el actor del hábitat lo despierta | Sí: `wake` a los 180 ms; después `idle` |
| Cuatro caricias muestran el amor | Sí: burbuja `¡Te quiero! ❤️`; único emoji encontrado: `❤` |
| Cinco caricias activan Pibblino | Sí: `pibblino_intro`, nombre `Pibblino`, burbuja exacta |
| Vuelta automática | Sí: tras 31 s vuelve a `Pibble` y desaparece Pibblino |
| Ladrido desde el hábitat | Sí: `data-action="bark"`, burbuja `Guau.` |
| Movimiento autónomo | Sí: `left` cambia con el tiempo |
| Animación por frames | Sí: `data-frame` cambia con el tiempo |
| Estados de Pibble | `walk`, `run`, `sit`, `lie`, `play`, `scratch`, `bark`, `growl`, `playful_growl`, `happy` verificados por acción y frame |
| Estados de Capilámpara | `sit`, `lie`, `read`, `study`, `sleep`, `wake`, `pet`, `greet`, `dress` verificados |
| Atuendo | Sí: `aria-pressed` true → false → true; archivo `capilampara-outfit.png` ↔ `capilampara.png` |
| Gafas de lectura | Sí: `capilampara-outfit-glasses.png` al forzar `read`/`study`; vuelve a `capilampara-outfit.png` al cambiar de estado |
| Despertar de Capilámpara | Sí: tras `sleep` pasa a `wake` y después elige otra conducta |
| Referencias separadas | 32 PNG transparentes; sin fondo, etiquetas ni sombra; hoja de contacto revisada |
| Detalle a 48×48 | Sí: hoja, birrete, borla, mochila y gafas siguen legibles en la reducción de comparación |
| Lámpara manual | Sí: clic directo en la lámpara; `aria-pressed` y capa de luz cambian |
| Lámpara automática 00:00–06:00 | Sí con fecha simulada a las 02:00; capa de luz encendida |
| Apagado manual persistente | Sí: sigue apagada tras 31 s de intervalo |
| Transición 06:30 / 00:15 | Sí con reloj simulado y `setInterval` acelerado: apaga a las 06:30 y enciende a las 00:15 |
| Saludo entre mascotas | Sí: ambas acciones `greet`, se acercan y aparece «Hola, Capilámpara.» |
| Persistencia al cambiar de pantalla | Sí: el hábitat sigue montado y conserva posiciones al ir a Mi Semana |
| AsesorIA | 3 avatares animados, 0 botones anidados, frames cambian |
| Mi Semana | 2 avatares animados con estado idle |
| Móvil 390×844 | Hábitat justo encima de la nav; mascotas por encima de la barandilla; sin desbordamiento horizontal; bocadillo dentro del viewport; lámpara con zona de 40×40 |
| Contenido inferior | La última tarjeta queda por encima del hábitat al hacer scroll completo |
| Emojis en interfaz | Solo `❤` en el mensaje de amor; 0 en el resto del texto comprobado |
| Consola | 0 errores/excepciones en las pruebas |
| Build de producción | `npm run build` correcto; PWA con 34 entradas |
| Producción en `:3001` | Hábitat montado, 2 mascotas, avatares creados, API de desarrollo ausente |
| Producción con arte nuevo | Pibble dormido, Capilámpara con naranja/birrete/mochila y 0 errores de consola |

### 5.4 Lint

```bash
node node_modules/eslint/bin/eslint.js src/components/mascots src/App.jsx \
  src/components/Layout.jsx src/pages/AsesorIA.jsx src/pages/MiSemana.jsx \
  src/pages/Agenda.jsx src/pages/Calendario.jsx src/pages/Dashboard.jsx src/pages/Horario.jsx
```

Resultado: **sin errores ni warnings**.

### 5.5 Build

```bash
npm run build
```

Resultado: compilación correcta; 1773 módulos; PWA generada con 34 entradas de precache.

### 5.6 Evidencias visuales

Todas las capturas están en `docs/auditoria-mascotas/`.

**Estado inicial: Pibble dormido con gafas y hábitat montado**

![Estado inicial](docs/auditoria-mascotas/01-inicial-escritorio.png)

**Mensaje exacto de cariño**

![Te quiero](docs/auditoria-mascotas/02-te-quiero.png)

**Pibblino y su mensaje especial**

![Pibblino](docs/auditoria-mascotas/03-pibblino.png)

**Lámpara encendida y luz cálida pixel art**

![Lámpara](docs/auditoria-mascotas/04-lampara-encendida.png)

**Móvil: hábitat sobre la navegación y bocadillo dentro del viewport**

![Móvil](docs/auditoria-mascotas/05-movil-habitat.png)

**Hojas de sprites generadas**

![Sprites](docs/auditoria-mascotas/07-hojas-de-sprites.png)

**Referencias separadas y limpias (32 poses)**

![Referencias separadas](docs/auditoria-mascotas/12-referencias-separadas.png)

---

## 6. Limitaciones y cosas no probadas

- **Navegadores**: las pruebas visuales se hicieron con Chromium headless. No se probó en Safari/iOS, Firefox ni un Android físico.
- **Táctil real**: se emuló viewport y touch, y se comprobó el hit-test de los botones; no se probó en una pantalla táctil física.
- **Horario**: el tramo 00:00–06:00 se probó con `Date` simulado y un `setInterval` acelerado, no esperando seis horas reales.
- **IA en vivo**: no se dispone de claves reales en el entorno de prueba. Se probó el fallback local sin emojis y el saneado de respuestas almacenadas. Una respuesta futura del modelo se limpia en pantalla, pero no se ha validado con DeepSeek/Gemini reales.
- **Audio**: el ladrido es deliberadamente mudo.
- **Movimiento por la página**: las mascotas se desplazan por un hábitat global fijo, no por encima de las tarjetas y controles de cada página. Es una decisión de diseño para no tapar la interfaz; no se implementó deambulación libre sobre el contenido.
- **Duplicidad visual**: en Hoy y Dashboard se ve la tarjeta inline y también el hábitat. La tarjeta es el resumen de estado; el hábitat es la instancia viva. Si se prefiere una sola instancia, se puede ocultar el hábitat en esas dos rutas o convertir la tarjeta en un resumen no interactivo.
- **Cobertura del hábitat**: en móvil ocupa 168 px + 56 px de navegación. No bloquea controles (el contenedor no captura clics fuera de botones/mascotas), pero visualmente cubre la franja inferior; el contenido tiene padding y el botón «Ocultar» permite retirarlo.
- **Arte**: el atlas de runtime es pixel art procedural de 48×48, redibujado a partir de las referencias. No es una copia pixel a pixel de los JPG ni un proyecto de Aseprite. Las referencias son estáticas y no contienen todos los ciclos; las posturas que faltaban se dibujaron a mano en código. Un artista podría refinar aún más las expresiones de gruñido, juego y saludo.
- **Recortes de referencia**: la extracción elimina fondo, etiquetas y sombra, pero parte de un JPG con compresión. Se conservan como archivo de comparación, no como recurso de runtime. La sombra azulada se retiró por color; si se necesitara un recorte perfecto para impresión, habría que vectorizarlo o redibujarlo.
- **Resolución**: 48×48 conserva los accesorios y la silueta, pero no permite el mismo detalle de un original de 2752×1536. Se eligió por nitidez a 2× y compatibilidad con el hábitat; no se deformó el personaje para encajarlo.
- **Gafas de Capilámpara**: la variante con gafas se activa automáticamente en lectura/estudio, no con un botón independiente. La referencia existe para todos los estados; el runtime solo la usa donde aporta significado.
- **Pibblino**: sigue sin variantes de caminar, sentarse o tumbarse; permanece en reposo durante sus 30 segundos.
- **Accesibilidad**: hay etiquetas ARIA, `aria-pressed`, `aria-live` y foco visible; no se ha hecho una auditoría completa con lector de pantalla.

---

## 7. Cómo ejecutar y comprobar

### Arranque normal

```bash
npm install
npm run server    # API + SQLite en :3001
npm run dev       # Vite (proxy /api)
```

Abrir la URL que indique Vite (por defecto `http://localhost:5173`). En producción:

```bash
npm run build
npm start         # http://localhost:3001
```

### Comprobación manual de las mascotas

1. Abrir `/` con el almacenamiento local limpio. Pibble debe aparecer **dormido con gafas** y con Zzz.
2. Pulsar a Pibble: se reproduce la animación de despertar.
3. Volver a pulsar cuatro veces: cada caricia muestra `¡Te quiero! ❤️`.
4. Pulsar una quinta vez seguida: Pibble se transforma en **Pibblino**, aparece la corona y el mensaje `¿Vemos La que se avecina?`.
5. Esperar 30 s: vuelve a Pibble.
6. Pulsar «Ladrar»: boca y cuerpo se mueven; no hay sonido.
7. En Capilámpara, pulsar la naranja-lámpara: se enciende/apaga y la página recibe luz cálida. Pulsar «Atuendo»: birrete, borla y mochila UCM; al leer o estudiar usa la hoja con gafas.
8. Dejar pasar unos segundos: las mascotas caminan, corren, se sientan, juegan, se tumban, leen, estudian, duermen, se despiertan o gruñen. Pueden acercarse y saludarse.
9. Cambiar de pantalla: el hábitat permanece.
10. En móvil: comprobar que el hábitat queda encima de la nav y que «Ocultar» / «Mascotas» funcionan.

### Comprobación de la lámpara nocturna sin esperar

La prueba `scripts/audit-lamp-night.mjs` simula las 02:00 de Madrid. Para una prueba manual, cambiar la hora del sistema o usar las DevTools de Chrome con `Date` simulado. El código usa `Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'`.

### Regenerar recursos

```bash
node scripts/generate-pixel-sprites.mjs
python scripts/extract-reference-poses.py
```

Abrir `/sprites/preview.html` para ver todos los frames de 48×48 ampliados. Las poses separadas de las referencias quedan en `referencias/mascotas/poses/` y la hoja de contacto en `docs/auditoria-mascotas/12-referencias-separadas.png`.

### Herramientas de QA incluidas

`scripts/audit-*.mjs` y `scripts/lib/cdp.mjs` usan Chrome DevTools Protocol. Requieren:

- Chrome iniciado con `--remote-debugging-port=9222`.
- Vite escuchando en `http://127.0.0.1:5199`.
- Backend en `http://127.0.0.1:3001` para las páginas con datos.

No añaden dependencias al proyecto. Las capturas y resultados seleccionados están en `docs/auditoria-mascotas/`.

---

## 8. Archivos principales modificados o añadidos

### Mascotas

- `src/components/mascots/MascotProvider.jsx` (nuevo)
- `src/components/mascots/MascotStage.jsx` (nuevo)
- `src/components/mascots/MascotFigure.jsx` (nuevo)
- `src/components/mascots/MascotAvatar.jsx` (nuevo)
- `src/components/mascots/LampAttachment.jsx` (nuevo)
- `src/components/mascots/LampLight.jsx` (nuevo)
- `src/components/mascots/PixelSprite.jsx` (nuevo)
- `src/components/mascots/PixelBubble.jsx` (nuevo)
- `src/components/mascots/PetParticles.jsx` (nuevo)
- `src/components/mascots/SleepZs.jsx` (nuevo)
- `src/components/mascots/useSpriteFrame.js` (nuevo)
- `src/components/mascots/assets.js` (nuevo)
- `src/components/mascots/mascotLogic.js` (nuevo)
- `src/components/mascots/mascot.css` (nuevo)
- `src/components/mascots/spriteManifest.js` (generado)
- `src/components/mascots/PibbleMascot.jsx` (reescrito)
- `src/components/mascots/CapilamparaMascot.jsx` (reescrito)
- `src/components/mascots/MascotsCompanion.jsx` (reescrito)

### Integración y regla de emojis

- `src/App.jsx`
- `src/components/Layout.jsx`
- `src/pages/AsesorIA.jsx`
- `src/pages/MiSemana.jsx`
- `src/pages/Agenda.jsx`
- `src/pages/Calendario.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Horario.jsx`
- `src/lib/texto.js` (nuevo)
- `server/ai.js` (solo cadenas de fallback de las mascotas)
- `server/routes/semana.js` (solo cadenas de reflexión de las mascotas)
- `server/index.js` (solo logs, sin emojis)

### Recursos y documentación

- `referencias/mascotas/*.jpg` (4 originales conservados)
- `referencias/mascotas/poses/` (32 poses transparentes + 32 versiones de comparación)
- `public/sprites/*.png` (13 recursos; tres hojas de Capilámpara)
- `public/sprites/manifest.json`
- `public/sprites/preview.html`
- `scripts/generate-pixel-sprites.mjs`
- `scripts/extract-reference-poses.py`
- `scripts/pixel/{png,palette,pibble,capilampara,ui}.mjs`
- `docs/auditoria-mascotas/` (capturas, hoja de referencias y resultados de pruebas)
- `README.md`
- `INFORME_MASCOTAS.md`

### No modificado

- `package.json` / dependencias.
- Esquema y datos de SQLite.
- Rutas de IA, prompts y personalidades (salvo las cadenas de fallback indicadas).
- Resto de módulos funcionales.
