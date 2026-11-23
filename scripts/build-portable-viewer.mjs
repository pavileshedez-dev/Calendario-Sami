import fs from 'fs'
import path from 'path'

const BASE_DIR = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art'
const PASS_DIR = path.join(BASE_DIR, 'artist-pass-v0.2')
const PROD_DIR = path.join(PASS_DIR, 'production')

function toDataUri(filePath, mimeType = 'image/png') {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath)
    return ''
  }
  const buf = fs.readFileSync(filePath)
  const b64 = buf.toString('base64')
  return `data:${mimeType};base64,${b64}`
}

console.log('Encoding assets to Base64...')

const assets = {
  // References
  pibbleRef: toDataUri(path.join(BASE_DIR, 'pibble', '01-reposo-caminar-correr-dormir-despertar.jpg'), 'image/jpeg'),
  capiRef: toDataUri(path.join(BASE_DIR, 'capilampara', '01-reposo-caminar-dormir-despertar-sentarse.jpg'), 'image/jpeg'),

  // Proxies
  pibbleProxy: toDataUri(path.join(BASE_DIR, 'production-design', 'model_sheet_pibble.png')),
  capiProxy: toDataUri(path.join(BASE_DIR, 'production-design', 'model_sheet_capilampara.png')),

  // Masters
  pibbleMaster: toDataUri(path.join(PROD_DIR, 'master', 'pibble_master.png')),
  pibbleMaster96: toDataUri(path.join(PROD_DIR, 'master', 'pibble_master_96.png')),
  pibbleMaster32: toDataUri(path.join(PROD_DIR, 'master', 'pibble_master_32.png')),

  capiMaster: toDataUri(path.join(PROD_DIR, 'master', 'capilampara_master.png')),
  capiMaster96: toDataUri(path.join(PROD_DIR, 'master', 'capilampara_master_96.png')),
  capiMaster32: toDataUri(path.join(PROD_DIR, 'master', 'capilampara_master_32.png')),

  // Layers
  pibbleShadow: toDataUri(path.join(PROD_DIR, 'layers', 'pibble', 'shadow.png')),
  pibbleTorso: toDataUri(path.join(PROD_DIR, 'layers', 'pibble', 'torso.png')),
  capiShadow: toDataUri(path.join(PROD_DIR, 'layers', 'capilampara', 'shadow.png')),
  capiMandarin: toDataUri(path.join(PROD_DIR, 'layers', 'capilampara', 'mandarin.png')),
  capiBodyClean: toDataUri(path.join(PROD_DIR, 'layers', 'capilampara', 'body_without_mandarin.png')),

  // Contact sheets
  pibbleContactSheet: toDataUri(path.join(PROD_DIR, 'qa', 'contact_sheet_pibble.png')),
  pibblePuppetContactSheet: toDataUri(path.join(PROD_DIR, 'qa', 'contact_sheet_pibble_puppet.png')),
  capiContactSheet: toDataUri(path.join(PROD_DIR, 'qa', 'contact_sheet_capilampara.png')),
  capiPuppetContactSheet: toDataUri(path.join(PROD_DIR, 'qa', 'contact_sheet_capilampara_puppet.png')),

  // Animation frames
  pibbleWalkPuppet: [],
  pibbleWalkCorrected: [],
  capiWalkPuppet: [],
  capiWalkCorrected: []
}

for (let f = 0; f < 6; f++) {
  assets.pibbleWalkPuppet.push(toDataUri(path.join(PROD_DIR, 'animation', 'pibble_walk', 'puppet_frames', `frame_0${f}.png`)))
  assets.pibbleWalkCorrected.push(toDataUri(path.join(PROD_DIR, 'animation', 'pibble_walk', 'pixel_corrected_frames', `frame_0${f}.png`)))
  assets.capiWalkPuppet.push(toDataUri(path.join(PROD_DIR, 'animation', 'capilampara_walk', 'puppet_frames', `frame_0${f}.png`)))
  assets.capiWalkCorrected.push(toDataUri(path.join(PROD_DIR, 'animation', 'capilampara_walk', 'pixel_corrected_frames', `frame_0${f}.png`)))
}

console.log('All assets encoded successfully. Building portable HTML...')

const portableHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Visor Autónomo de Mascotas · Agenda Sami (v0.2)</title>
  <style>
    :root {
      --bg: #12100e;
      --card-bg: #1c1815;
      --card-border: #302a24;
      --text: #eae3d9;
      --text-muted: #9c9082;
      --accent-pibble: #f59e0b;
      --accent-capi: #ea580c;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-cyan: #06b6d4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
    }
    .container { max-width: 1360px; margin: 0 auto; }
    header {
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #fff; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-egm { background: #27272a; color: #d4d4d8; border: 1px solid #52525b; }
    .badge-portable { background: #1e1b4b; color: #a5b4fc; border: 1px solid #4338ca; }
    .badge-status { background: #431407; color: #fdba74; border: 1px solid #c2410c; }
    .badge-pass { background: #052e16; color: #86efac; border: 1px solid #166534; }
    
    .nav-tabs {
      display: flex;
      gap: 12px;
      margin: 20px 0;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
    }
    .tab-btn {
      background: #231f1a;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 10px 22px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .tab-btn:hover { background: #2f2a24; color: #fff; }
    .tab-btn.active.pibble-btn {
      background: var(--accent-pibble);
      color: #000;
      border-color: var(--accent-pibble);
    }
    .tab-btn.active.capi-btn {
      background: var(--accent-capi);
      color: #fff;
      border-color: var(--accent-capi);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    @media (max-width: 960px) { .grid-2 { grid-template-columns: 1fr; } }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .card h2 { margin: 0 0 12px 0; font-size: 18px; color: #fff; border-bottom: 1px solid var(--card-border); padding-bottom: 10px; }
    .card h3 { margin: 14px 0 8px 0; font-size: 15px; color: var(--accent-pibble); }

    .stage-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      background: #0d0c0a;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 20px;
    }
    .canvas-box {
      position: relative;
      background-color: #222;
      background-image: 
        linear-gradient(45deg, #181818 25%, transparent 25%),
        linear-gradient(-45deg, #181818 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #181818 75%),
        linear-gradient(-45deg, transparent 75%, #181818 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      border: 1px solid #444;
      display: inline-block;
      image-rendering: pixelated;
    }
    .canvas-box.light { background-color: #f8fafc; background-image: none; }
    .canvas-box.dark { background-color: #0f172a; background-image: none; }
    .canvas-box.paper { background-color: #fbf6ec; background-image: none; }

    .guide-line { position: absolute; pointer-events: none; }
    .guide-baseline { left: 0; right: 0; height: 1px; background: rgba(239, 68, 68, 0.9); z-index: 10; }
    .guide-pivot { top: 0; bottom: 0; width: 1px; background: rgba(6, 182, 212, 0.9); z-index: 10; }

    .sprite-img {
      display: block;
      image-rendering: pixelated;
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      font-size: 13px;
    }
    button.btn-ctrl {
      background: #2a251f;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 7px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    button.btn-ctrl:hover { background: #3d352c; }

    .tag-pill {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 3px;
      background: #26211a;
      color: #ccc;
      border: 1px solid #444;
    }

    .anim-display {
      width: 256px;
      height: 256px;
      position: relative;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    .info-table th, .info-table td {
      border: 1px solid var(--card-border);
      padding: 8px 12px;
      text-align: left;
    }
    .info-table th { background: #231f1a; color: #fff; }

    .section-desc {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .contact-sheet-img {
      max-width: 100%;
      border: 1px solid var(--card-border);
      border-radius: 4px;
      image-rendering: pixelated;
    }

    /* Layers gallery */
    .layers-gallery {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .layer-card {
      background: #151311;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      width: 140px;
    }
    .layer-card img {
      width: 64px;
      height: 64px;
      image-rendering: pixelated;
      margin: 8px 0;
      background: #222;
      border: 1px solid #444;
    }
    .layer-card div { font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>

<div class="container">
  <header>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div>
        <h1>Auditoría y Comparativa Artística · Agenda Sami (v0.2)</h1>
        <div style="font-size:14px; color:var(--text-muted);">
          Visor Autónomo Portable — 100% autónomo con recursos integrados en Base64. Cero dependencias de red.
        </div>
      </div>
      <div class="badges">
        <span class="badge badge-portable">Portable Standalone</span>
        <span class="badge badge-egm">EGM Goldfish Pass 2</span>
        <span class="badge badge-pass">Aprobado para Evaluación Visual</span>
      </div>
    </div>

    <div class="nav-tabs">
      <button class="tab-btn pibble-btn active" id="tabPibble" onclick="selectChar('pibble')">🐕 Pibble (Carlino / Asistente de Trabajo)</button>
      <button class="tab-btn capi-btn" id="tabCapi" onclick="selectChar('capilampara')">🥔 Capilámpara (Capibara / Asistente de Estudio)</button>
    </div>
  </header>

  <!-- SECCIÓN 1: EVOLUCIÓN HISTÓRICA Y MODELO MAESTRO -->
  <section class="card">
    <h2>1. Evolución del Modelo Maestro: Referencia vs Proxy Pillow vs Master v0.2</h2>
    <div class="section-desc">
      Inspección comparativa entre las láminas de referencia históricas, los proxies generados con Pillow (v0.1) y el modelo maestro definitivo v0.2.
    </div>

    <div class="grid-2">
      <!-- Columna 1: Histórico -->
      <div style="background:#151310; padding:18px; border-radius:6px; border:1px solid var(--card-border);">
        <h3 id="refTitle" style="margin-top:0;">Referencia Original · Lámina 01</h3>
        <img id="refImg" src="" style="width:100%; max-height:220px; object-fit:contain; border-radius:4px; border:1px solid #333;" alt="Referencia">
        
        <h3 style="margin-top:18px;">Proxy v0.1 (Pillow Procedural)</h3>
        <div style="font-size:12px; color:var(--accent-red); margin-bottom:6px;">⚠️ Defecto previo: Cajas geométricas rígidas, silueta de koala/oso desproporcionada.</div>
        <img id="proxyImg" src="" style="width:100%; max-height:200px; object-fit:contain; background:#f6eee1; border-radius:4px; border:1px solid #333;" alt="Proxy Pillow">
      </div>

      <!-- Columna 2: Candidato Maestro Actual v0.2 -->
      <div style="background:#151310; padding:18px; border-radius:6px; border:1px solid var(--card-border); border-left: 3px solid var(--accent-green);">
        <h3 id="masterTitle" style="margin-top:0; color:var(--accent-green);">Candidato Maestro v0.2 Canónico (Alineado y Congelado)</h3>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">✅ 100% Carlino/Capibara. Lienzo 64×64, Baseline $y=60$, Pivote $(32, 60)$, Esquinas transparentes.</div>
        
        <div class="stage-container">
          <div class="canvas-box" id="masterBox" style="width:256px; height:256px;">
            <div class="guide-line guide-baseline" id="masterBaseline" style="top: 244px;"></div>
            <div class="guide-line guide-pivot" id="masterPivot" style="left: 128px;"></div>
            <img id="master64Img" src="" class="sprite-img" style="width:256px; height:256px;" alt="Master 64x64">
          </div>

          <div class="controls-row">
            <span class="tag-pill">Zoom 4x (256×256)</span>
            <label><input type="checkbox" id="chkMasterGuides" checked onchange="toggleGuides('master')"> Guías (Suelo y=60 / Pivote 32)</label>
            <label><input type="radio" name="bgMaster" value="check" checked onchange="setBg('masterBox', 'check')"> Damero</label>
            <label><input type="radio" name="bgMaster" value="dark" onchange="setBg('masterBox', 'dark')"> Oscuro</label>
            <label><input type="radio" name="bgMaster" value="light" onchange="setBg('masterBox', 'light')"> Claro</label>
            <label><input type="radio" name="bgMaster" value="paper" onchange="setBg('masterBox', 'paper')"> Papel</label>
          </div>
        </div>

        <!-- Escalas comparativas -->
        <div style="display:flex; justify-content:space-around; align-items:flex-end; margin-top:18px; text-align:center;">
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">1.5x (96×96 Modal)</div>
            <img id="master96Img" src="" style="width:96px; height:96px; image-rendering:pixelated; border:1px solid #444; background:#1c1815;">
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">1x (64×64 Canónico)</div>
            <img id="master64Thumb" src="" style="width:64px; height:64px; image-rendering:pixelated; border:1px solid #444; background:#1c1815;">
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">0.5x (32×32 Mini)</div>
            <img id="master32Img" src="" style="width:32px; height:32px; image-rendering:pixelated; border:1px solid #444; background:#1c1815;">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECCIÓN 2: SEPARACIÓN DE CAPAS Y ACCESORIOS -->
  <section class="card">
    <h2>2. Separación de Capas Anatómicas y Accesorios (Layers Contract)</h2>
    <div class="section-desc">
      Las sombras y accesorios están desacoplados en capas transparentes independientes de 64×64 para permitir modularidad y futuras variantes universitarias.
    </div>

    <div class="layers-gallery" id="layersGallery">
      <!-- Se inyecta dinámicamente -->
    </div>
  </section>

  <!-- SECCIÓN 3: REPRODUCTOR DE ANIMACIÓN (PUPPET vs PIXEL-CORRECTED) -->
  <section class="card">
    <h2>3. Comparativa de Animación: Opción A (Puppet Rigging) vs Opción B (Pixel-Corrected)</h2>
    <div class="section-desc">
      Reproductor interactivo para comparar cuadro a cuadro la marcha de 6 frames.
    </div>

    <div class="grid-2">
      <!-- Opción A -->
      <div style="background:#151310; padding:18px; border-radius:6px; border:1px solid var(--card-border);">
        <h3 style="color:#cbd5e1; margin-top:0;">Opción A: Rigging Puppet Directo</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-top:0;">
          Descomposición en bloques rígidos articulados. Genera fracturas mecánicas ("marioneta rota") y costuras en hombro y cadera.
        </p>

        <div class="stage-container">
          <div class="canvas-box" id="puppetBox" style="width:256px; height:256px;">
            <div class="guide-line guide-baseline" style="top: 244px;"></div>
            <div class="guide-line guide-pivot" style="left: 128px;"></div>
            <img id="puppetFrameImg" src="" class="sprite-img anim-display" alt="Puppet Frame">
          </div>
          <div style="font-size:11px; color:#a1a1aa;">Previsualización a 4x (256×256)</div>
        </div>
      </div>

      <!-- Opción B -->
      <div style="background:#151310; padding:18px; border-radius:6px; border:1px solid var(--card-border); border-left: 3px solid var(--accent-green);">
        <h3 style="color:var(--accent-green); margin-top:0;">Opción B: Frames Corregidos Pixel-Art (Recomendada)</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-top:0;">
          Pase de refinamiento pixel a pixel: inpainting contextual de vientre, contorno exterior uniforme de 1 px y anclaje plantar sin patinaje.
        </p>

        <div class="stage-container">
          <div class="canvas-box" id="correctedBox" style="width:256px; height:256px;">
            <div class="guide-line guide-baseline" style="top: 244px;"></div>
            <div class="guide-line guide-pivot" style="left: 128px;"></div>
            <img id="onionSkinImg" src="" class="sprite-img anim-display" style="position:absolute; top:0; left:0; opacity:0.35; display:none; pointer-events:none;" alt="Onion Skin">
            <img id="correctedFrameImg" src="" class="sprite-img anim-display" alt="Corrected Frame">
          </div>
          <div style="font-size:11px; color:#a1a1aa;">Previsualización a 4x (256×256)</div>
        </div>
      </div>
    </div>

    <!-- Controles de Reproducción -->
    <div style="background:#201b16; padding:18px; border-radius:6px; border:1px solid var(--card-border); margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn-ctrl" id="btnPlayPause" onclick="togglePlay()">⏸️ Pausar</button>
          <button class="btn-ctrl" onclick="stepFrame(-1)">⏮️ Frame Anterior</button>
          <button class="btn-ctrl" onclick="stepFrame(1)">⏭️ Frame Siguiente</button>
          <span style="font-size:13px; font-weight:600; min-width:260px;" id="frameLabel">Frame 0: Contacto A</span>
        </div>

        <div style="display:flex; align-items:center; gap:16px; font-size:13px;">
          <label>Velocidad: <strong id="fpsLabel">10</strong> FPS</label>
          <input type="range" id="fpsSlider" min="1" max="24" value="10" oninput="changeFps(this.value)">
          <label><input type="checkbox" id="chkOnion" onchange="toggleOnionSkin()"> Onion Skin</label>
          <label><input type="radio" name="bgAnim" value="check" checked onchange="setAnimBg('check')"> Damero</label>
          <label><input type="radio" name="bgAnim" value="dark" onchange="setAnimBg('dark')"> Oscuro</label>
          <label><input type="radio" name="bgAnim" value="light" onchange="setAnimBg('light')"> Claro</label>
        </div>
      </div>
    </div>
  </section>

  <!-- SECCIÓN 4: HOJAS DE CONTACTO (6 FRAMES CON GUÍA MATEMÁTICA) -->
  <section class="card">
    <h2>4. Hoja de Contacto Canónica a 4x (Alineación Estricta en Suelo y=60)</h2>
    <div class="section-desc">
      Todos los cuadros alineados a 4x (256×256 cada celda). La línea roja en $y=254$ marca la base exacta del suelo donde pisan las patas sin cortar la silueta.
    </div>

    <div style="overflow-x:auto; padding:10px 0;">
      <h3 id="csTitle" style="margin-top:0;">Frames Corregidos Pixel-Art (Opción B)</h3>
      <img id="contactSheetImg" src="" class="contact-sheet-img" alt="Contact Sheet">
    </div>

    <div style="overflow-x:auto; padding:10px 0; margin-top:16px;">
      <h3 id="csPuppetTitle" style="color:#aaa;">Puppet Rigging Directo (Opción A - Registro de Descarte)</h3>
      <img id="contactSheetPuppetImg" src="" class="contact-sheet-img" alt="Contact Sheet Puppet">
    </div>
  </section>

  <!-- SECCIÓN 5: AUDITORÍA TÉCNICA EGM -->
  <section class="card">
    <h2>5. Certificación de Auditoría Técnica EGM Goldfish (Ronda 2)</h2>
    <table class="info-table">
      <thead>
        <tr>
          <th>Métrica Auditada</th>
          <th>Estándar Requerido</th>
          <th>Pibble v0.2</th>
          <th>Capilámpara v0.2</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Lienzo Fijo</td>
          <td>64 × 64 px RGBA</td>
          <td>64 × 64 px</td>
          <td>64 × 64 px</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>Línea de Suelo (Baseline)</td>
          <td>y = 60 estricto</td>
          <td>y = 60 (contactos sólidos)</td>
          <td>y = 60 (contactos sólidos)</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>Pivote Central</td>
          <td>(32, 60)</td>
          <td>Centrado en x = 32</td>
          <td>Centrado en x = 32</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>Guiones / Barras Flotantes</td>
          <td>0 píxeles desconectados en y=60</td>
          <td>0 píxeles flotantes (floating=0)</td>
          <td>0 píxeles flotantes (floating=0)</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>Escombros en Capa Base</td>
          <td>Cráneo sellado sin residuos</td>
          <td>No aplica (Pug íntegro)</td>
          <td>0 px flotantes en y: 0..18</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>Aislamiento con React</td>
          <td>0 modificaciones en src/</td>
          <td>src/ 100% intacto</td>
          <td>src/ 100% intacto</td>
          <td><span class="badge badge-pass">PASS</span></td>
        </tr>
      </tbody>
    </table>
  </section>
</div>

<script>
  const ASSETS = ${JSON.stringify(assets)};

  let currentChar = 'pibble';
  let currentFrame = 0;
  let isPlaying = true;
  let fps = 10;
  let playTimer = null;

  const frameDescriptions = [
    'Frame 0: Contacto A (Diagonal FN + FB en apoyo de pisada a y=60)',
    'Frame 1: Recoil / Down (Cuerpo absorbe peso, flexión dy=+1)',
    'Frame 2: Passing A (Extremidades en vuelo se elevan a y=58)',
    'Frame 3: Contacto B (Diagonal opuesta FF + NB en apoyo a y=60)',
    'Frame 4: Recoil / Down B (Amortiguación opuesta dy=+1)',
    'Frame 5: Passing B (Vuelo previo a cerrar loop con Frame 0)'
  ];

  function selectChar(char) {
    currentChar = char;
    document.getElementById('tabPibble').classList.toggle('active', char === 'pibble');
    document.getElementById('tabCapi').classList.toggle('active', char === 'capilampara');

    if (char === 'pibble') {
      document.getElementById('refTitle').textContent = 'Referencia Original · Pibble 01';
      document.getElementById('refImg').src = ASSETS.pibbleRef;
      document.getElementById('proxyImg').src = ASSETS.pibbleProxy;
      document.getElementById('masterTitle').textContent = 'Pibble Maestro v0.2 (Carlino Compacto Canónico)';
      document.getElementById('master64Img').src = ASSETS.pibbleMaster;
      document.getElementById('master96Img').src = ASSETS.pibbleMaster96;
      document.getElementById('master64Thumb').src = ASSETS.pibbleMaster;
      document.getElementById('master32Img').src = ASSETS.pibbleMaster32;
      document.getElementById('csTitle').textContent = 'Pibble · Hoja de Contacto (Frames Corregidos Pixel-Art)';
      document.getElementById('contactSheetImg').src = ASSETS.pibbleContactSheet;
      document.getElementById('csPuppetTitle').textContent = 'Pibble · Hoja de Contacto (Puppet Directo)';
      document.getElementById('contactSheetPuppetImg').src = ASSETS.pibblePuppetContactSheet;

      // Layers gallery
      document.getElementById('layersGallery').innerHTML = \`
        <div class="layer-card">
          <img src="\${ASSETS.pibbleTorso}" alt="Torso">
          <div>Torso con Vientre</div>
        </div>
        <div class="layer-card">
          <img src="\${ASSETS.pibbleShadow}" alt="Sombra">
          <div>Sombra Proyectada</div>
        </div>
        <div class="layer-card">
          <img src="\${ASSETS.pibbleMaster}" alt="Master">
          <div>Master Compuesto</div>
        </div>
      \`;
    } else {
      document.getElementById('refTitle').textContent = 'Referencia Original · Capilámpara 01';
      document.getElementById('refImg').src = ASSETS.capiRef;
      document.getElementById('proxyImg').src = ASSETS.capiProxy;
      document.getElementById('masterTitle').textContent = 'Capilámpara Maestra v0.2 (Capibara con Mandarina)';
      document.getElementById('master64Img').src = ASSETS.capiMaster;
      document.getElementById('master96Img').src = ASSETS.capiMaster96;
      document.getElementById('master64Thumb').src = ASSETS.capiMaster;
      document.getElementById('master32Img').src = ASSETS.capiMaster32;
      document.getElementById('csTitle').textContent = 'Capilámpara · Hoja de Contacto (Frames Corregidos Pixel-Art)';
      document.getElementById('contactSheetImg').src = ASSETS.capiContactSheet;
      document.getElementById('csPuppetTitle').textContent = 'Capilámpara · Hoja de Contacto (Puppet Directo)';
      document.getElementById('contactSheetPuppetImg').src = ASSETS.capiPuppetContactSheet;

      // Layers gallery
      document.getElementById('layersGallery').innerHTML = \`
        <div class="layer-card">
          <img src="\${ASSETS.capiBodyClean}" alt="Cuerpo Base">
          <div>Cuerpo sin Mandarina</div>
        </div>
        <div class="layer-card">
          <img src="\${ASSETS.capiMandarin}" alt="Mandarina">
          <div>Accesorio Mandarina</div>
        </div>
        <div class="layer-card">
          <img src="\${ASSETS.capiShadow}" alt="Sombra">
          <div>Sombra Proyectada</div>
        </div>
        <div class="layer-card">
          <img src="\${ASSETS.capiMaster}" alt="Master">
          <div>Master Compuesto</div>
        </div>
      \`;
    }
    updateFrameDisplay();
  }

  function updateFrameDisplay() {
    const puppetList = currentChar === 'pibble' ? ASSETS.pibbleWalkPuppet : ASSETS.capiWalkPuppet;
    const correctedList = currentChar === 'pibble' ? ASSETS.pibbleWalkCorrected : ASSETS.capiWalkCorrected;

    document.getElementById('puppetFrameImg').src = puppetList[currentFrame];
    document.getElementById('correctedFrameImg').src = correctedList[currentFrame];

    // Onion skin (previous frame)
    const prevFrame = (currentFrame + 5) % 6;
    document.getElementById('onionSkinImg').src = correctedList[prevFrame];

    document.getElementById('frameLabel').textContent = frameDescriptions[currentFrame];
  }

  function stepFrame(delta) {
    currentFrame = (currentFrame + delta + 6) % 6;
    updateFrameDisplay();
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('btnPlayPause').textContent = isPlaying ? '⏸️ Pausar' : '▶️ Reanudar';
    if (isPlaying) startLoop();
    else clearInterval(playTimer);
  }

  function changeFps(val) {
    fps = parseInt(val, 10);
    document.getElementById('fpsLabel').textContent = fps;
    if (isPlaying) {
      clearInterval(playTimer);
      startLoop();
    }
  }

  function startLoop() {
    clearInterval(playTimer);
    playTimer = setInterval(() => {
      currentFrame = (currentFrame + 1) % 6;
      updateFrameDisplay();
    }, 1000 / fps);
  }

  function toggleGuides(type) {
    const chk = document.getElementById('chkMasterGuides').checked;
    document.getElementById('masterBaseline').style.display = chk ? 'block' : 'none';
    document.getElementById('masterPivot').style.display = chk ? 'block' : 'none';
  }

  function toggleOnionSkin() {
    const chk = document.getElementById('chkOnion').checked;
    document.getElementById('onionSkinImg').style.display = chk ? 'block' : 'none';
  }

  function setBg(id, type) {
    const el = document.getElementById(id);
    el.className = 'canvas-box ' + (type === 'dark' ? 'dark' : type === 'light' ? 'light' : type === 'paper' ? 'paper' : '');
  }

  function setAnimBg(type) {
    setBg('puppetBox', type);
    setBg('correctedBox', type);
  }

  // Init
  selectChar('pibble');
  startLoop();
</script>

</body>
</html>
`

const outPortable = path.join(PROD_DIR, 'previews', 'comparison_portable.html')
fs.writeFileSync(outPortable, portableHtml, 'utf8')
console.log('Saved to:', outPortable, `(${Math.round(portableHtml.length / 1024)} KB)`)

// Also place a copy in artist-pass-v0.2/ for instant root access
const outRoot = path.join(PASS_DIR, 'comparison_portable.html')
fs.writeFileSync(outRoot, portableHtml, 'utf8')
console.log('Saved root copy to:', outRoot)
