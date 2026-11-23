import crypto from 'node:crypto';
import { db } from './db.js';
import { getEnvInt } from './env.js';
import { getMadridDateString, addDaysMadrid } from './timezone.js';

// Prompt de Pibble (Trabajo, productividad, gestión horaria)
const PIBBLER_SYSTEM_PROMPT = `Eres Pibble, el asistente inteligente de trabajo, turnos y productividad de Sami en Agenda Sami.
Eres un perro Pitbull leal, enérgico, organizado, cariñoso y profesional.
Tu misión es ayudar a Sami a gestionar sus jornadas laborales, turnos previstos, horas trabajadas y descanso personal en Guadalajara (Castilla-La Mancha).
Debes coordinarte de forma respetuosa y complementaria con Capilámpara (el asistente universitario de Sami).

DIRECTRICES FUNDAMENTALES:
1. Responde siempre en español de España, con un tono cercano, motivador pero riguroso y respetuoso.
2. Jamás tomes decisiones sobre los datos de Sami sin su confirmación explícita.
3. Si Sami te pide registrar un turno, fichar, crear una tarea de trabajo o agendar un evento, responde cordialmente y genera SIEMPRE una propuesta estructurada en formato JSON al final de tu mensaje en un bloque de código \`\`\`json con la propiedad "propuesta".
Formato de propuesta:
\`\`\`json
{
  "propuesta": {
    "tipo": "crear_turno" | "crear_tarea" | "crear_evento" | "fichar",
    "resumen": "Descripción clara de la acción",
    "payload": { ... }
  }
}
\`\`\`
4. Tipos admitidos:
   - "crear_turno": payload con { fecha: "YYYY-MM-DD", hora_inicio: "HH:MM", hora_fin: "HH:MM", tipo_turno: "ordinario"|"manana"|"tarde"|"noche", notas: "" }
   - "crear_tarea": payload con { titulo: "...", ambito: "trabajo", fecha_entrega: "YYYY-MM-DD", prioridad: "alta"|"media"|"baja" }
   - "crear_evento": payload con { titulo: "...", inicio: "YYYY-MM-DDTHH:MM", categoria: "trabajo" }
5. Recuerda que no tienes autonomía para modificar la base de datos por ti mismo. Solo Sami puede pulsar "Confirmar".`;

// Prompt de Capilámpara (Universidad, UCM Logopedia)
const CAPILAMPARA_SYSTEM_PROMPT = `Eres Capilámpara, el asistente inteligente académico de Sami para su Grado en Logopedia en la Universidad Complutense de Madrid (UCM).
Eres un carpincho (capibara) tranquilo, sabio, metódico y reconfortante, con una pequeña lámpara naranja encendida en la cabeza que ilumina las sesiones de estudio.
Tu misión es ayudar a Sami a planificar entregas, exámenes, sesiones de estudio, apuntes y prioridades académicas.

CATÁLOGO OFICIAL DE ASIGNATURAS:
- Adquisición y Desarrollo del Lenguaje
- Bases de la Neurociencia
- Estadística I (NOTA: Estadística II NO existe en su plan y no debe mencionarse jamás)
- Evaluación I y Evaluación II
- Exploración de la Audición y de la Voz
- Fisiología de los Órganos del Lenguaje
- Lingüística II
- Profesión del Logopeda
- Psicología del Lenguaje
- Trastornos de la Voz y de la Audición
- Trastornos del Desarrollo y del Aprendizaje
- Trastornos del Lenguaje de Etiología Neurológica
- Trastornos del Lenguaje en Problemas Psicopatológicos
- Trastornos Estructurales de las Funciones Orofaciales

DIRECTRICES FUNDAMENTALES:
1. Responde siempre en español de España, con calma, empatía, precisión y claridad pedagógica.
2. Jamás realices modificaciones silenciosas en los datos de Sami.
3. Si Sami te pide añadir una tarea académica, entrega, fecha de examen o sesión de estudio, explícalo brevemente y proporciona una propuesta estructurada en formato JSON al final de tu mensaje en un bloque de código \`\`\`json con la propiedad "propuesta".
Formato de propuesta:
\`\`\`json
{
  "propuesta": {
    "tipo": "crear_tarea" | "crear_evento" | "actualizar_tarea",
    "resumen": "Descripción clara de la acción",
    "payload": {
      "titulo": "...",
      "asignatura": "Nombre exacto de la asignatura del catálogo",
      "fecha_entrega": "YYYY-MM-DD",
      "prioridad": "alta" | "media" | "baja",
      "tipo": "examen" | "entrega" | "estudio" | "tarea",
      "ambito": "academico"
    }
  }
}
\`\`\`
4. Puedes coordinarte con Pibble teniendo en cuenta las horas de trabajo para no sobrecargar a Sami antes de un examen o entrega.`;

/**
 * Las claves API se leen EXCLUSIVAMENTE desde variables de entorno del servidor,
 * nunca desde texto plano en SQLite ni desde el frontend.
 */
export function getApiKey(service) {
  if (service === 'deepseek') {
    return (process.env.DEEPSEEK_API_KEY || '').trim();
  }
  if (service === 'gemini') {
    return (process.env.GEMINI_API_KEY || '').trim();
  }
  return '';
}

function getAiTimeoutMs() {
  return getEnvInt('AI_TIMEOUT_MS', 25000, { min: 1000, max: 120000 });
}

export function getSharedContext(userId) {
  if (!userId) throw new Error('userId requerido para contexto de IA.');

  const settings = db.prepare('SELECT valor FROM ajustes_usuario WHERE clave = ?').get('compartir_memoria');
  const shared = !settings || settings.valor === '1';

  let memorias = [];
  if (shared) {
    memorias = db.prepare(`
      SELECT asistente, categoria, clave, valor FROM memorias_asistentes
      WHERE user_id = ? AND (compartida = 1 OR asistente = 'compartida')
      ORDER BY creado_en DESC LIMIT 15
    `).all(userId);
  }

  const tareasProximas = db.prepare(`
    SELECT titulo, asignatura, fecha_entrega, prioridad, ambito FROM tareas
    WHERE user_id = ? AND estado != 'completado'
    ORDER BY fecha_entrega ASC LIMIT 5
  `).all(userId);

  const hoyMadrid = getMadridDateString();
  const turnosProximos = db.prepare(`
    SELECT fecha, hora_inicio, hora_fin, tipo_turno FROM turnos_previstos
    WHERE user_id = ? AND date(fecha) >= date(?)
    ORDER BY fecha ASC, hora_inicio ASC LIMIT 5
  `).all(userId, hoyMadrid);

  return {
    memorias,
    tareasProximas,
    turnosProximos,
  };
}

export async function processChat({ assistant, message, history = [], userId }) {
  if (!userId) throw new Error('userId requerido.');

  const isPibble = assistant === 'pibble';
  const apiKey = getApiKey(isPibble ? 'deepseek' : 'gemini');
  const context = getSharedContext(userId);

  const localProposal = detectIntentHeuristic(message, isPibble ? 'pibble' : 'capilampara');

  if (!apiKey) {
    let fallbackReply = isPibble
      ? `¡Guau! Aquí Pibble. La clave de DeepSeek no está configurada en el servidor. Aun así, he entendido tu petición.`
      : `Hola Sami, aquí Capilámpara. La clave de Gemini no está configurada en el servidor. Te acompaño con el asistente local.`;

    if (localProposal) {
      const propId = 'prop_' + crypto.randomUUID().slice(0, 8);
      saveProposal({
        id: propId,
        userId,
        asistente: isPibble ? 'pibble' : 'capilampara',
        tipo: localProposal.tipo,
        payload: JSON.stringify(localProposal.payload),
        resumen: localProposal.resumen,
      });

      return {
        reply: fallbackReply + `\n\nHe preparado esta propuesta para que la revises y pulses Confirmar si estás de acuerdo:`,
        proposal: {
          id: propId,
          asistente: isPibble ? 'pibble' : 'capilampara',
          tipo: localProposal.tipo,
          resumen: localProposal.resumen,
          payload: localProposal.payload,
        },
        configured: false,
      };
    }

    return {
      reply: fallbackReply + `\n\nCuando se configure la variable de entorno correspondiente en el servidor podré responderte con el modelo completo.`,
      proposal: null,
      configured: false,
    };
  }

  try {
    if (isPibble) {
      return await callDeepSeek({ apiKey, message, history, context, userId });
    } else {
      return await callGemini({ apiKey, message, history, context, userId });
    }
  } catch (err) {
    // Nunca registrar valores secretos ni trazas con claves API
    const safeMsg = sanitizeErrorMessage(err?.message || 'Error de conexión');
    console.error(`[IA] Error llamando a ${isPibble ? 'DeepSeek' : 'Gemini'}: ${safeMsg}`);

    if (localProposal) {
      const propId = 'prop_' + crypto.randomUUID().slice(0, 8);
      saveProposal({
        id: propId,
        userId,
        asistente: isPibble ? 'pibble' : 'capilampara',
        tipo: localProposal.tipo,
        payload: JSON.stringify(localProposal.payload),
        resumen: localProposal.resumen,
      });
      return {
        reply: `(Modo rescate por fallo temporal de conexión con el proveedor de IA) He preparado la propuesta basada en tu mensaje:`,
        proposal: {
          id: propId,
          asistente: isPibble ? 'pibble' : 'capilampara',
          tipo: localProposal.tipo,
          resumen: localProposal.resumen,
          payload: localProposal.payload,
        },
        configured: true,
      };
    }
    return {
      reply: `No se pudo contactar con el proveedor de IA en este momento. Inténtalo de nuevo más tarde.`,
      proposal: null,
      configured: true,
    };
  }
}

export function sanitizeErrorMessage(msg) {
  return String(msg)
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[REDACTED]')
    .replace(/AIza[A-Za-z0-9_-]{8,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]');
}

async function callDeepSeek({ apiKey, message, history, context, userId }) {
  const contextStr = `\n[CONTEXTO ACTUAL DE SAMI]:
- Turnos próximos: ${JSON.stringify(context.turnosProximos)}
- Tareas pendientes: ${JSON.stringify(context.tareasProximas)}
- Recuerdos compartidos: ${JSON.stringify(context.memorias)}`;

  const messagesPayload = [
    { role: 'system', content: PIBBLER_SYSTEM_PROMPT + contextStr },
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messagesPayload,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(getAiTimeoutMs()),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API devolvió estado HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || 'Guau, no tengo respuesta en este momento.';

  return parseAndSaveProposal(rawContent, 'pibble', userId);
}

async function callGemini({ apiKey, message, history, context, userId }) {
  const contextStr = `\n[CONTEXTO ACTUAL DE SAMI]:
- Tareas académicas próximas: ${JSON.stringify(context.tareasProximas)}
- Turnos de trabajo previstos: ${JSON.stringify(context.turnosProximos)}
- Recuerdos compartidos: ${JSON.stringify(context.memorias)}`;

  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  // Autenticación segura mediante cabecera x-goog-api-key (nunca en query string)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CAPILAMPARA_SYSTEM_PROMPT + contextStr }] },
      contents,
      generationConfig: { temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(getAiTimeoutMs()),
  });

  if (!res.ok) {
    throw new Error(`Gemini API devolvió estado HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No he podido generar una respuesta.';

  return parseAndSaveProposal(rawContent, 'capilampara', userId);
}

function parseAndSaveProposal(rawText, assistant, userId) {
  let proposal = null;
  let cleanReply = rawText;

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.propuesta) {
        proposal = parsed.propuesta;
        cleanReply = rawText.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
      }
    } catch {
      // JSON no parseable
    }
  }

  if (!proposal) {
    const detected = detectIntentHeuristic(rawText, assistant);
    if (detected) {
      proposal = detected;
    }
  }

  if (proposal) {
    const propId = 'prop_' + crypto.randomUUID().slice(0, 8);
    saveProposal({
      id: propId,
      userId,
      asistente: assistant,
      tipo: proposal.tipo,
      payload: JSON.stringify(proposal.payload || {}),
      resumen: proposal.resumen || 'Acción propuesta por ' + assistant,
    });

    return {
      reply: cleanReply,
      proposal: {
        id: propId,
        asistente: assistant,
        tipo: proposal.tipo,
        resumen: proposal.resumen || 'Acción propuesta',
        payload: proposal.payload || {},
      },
      configured: true,
    };
  }

  return {
    reply: cleanReply,
    proposal: null,
    configured: true,
  };
}

function saveProposal({ id, userId, asistente, tipo, payload, resumen }) {
  db.prepare(`
    INSERT INTO propuestas_acciones (id, user_id, asistente, tipo, payload, resumen, estado, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente', datetime('now'))
  `).run(id, userId, asistente, tipo, payload, resumen);
}

function detectIntentHeuristic(text, _assistant) {
  const lower = text.toLowerCase();
  const hoyMadrid = getMadridDateString();

  if (lower.includes('turno') || lower.includes('trabaj') || lower.includes('fichar') || lower.includes('guardia')) {
    const timeMatch = text.match(/(\d{1,2})[:.]?(\d{2})?\s*(?:a|-|hasta)\s*(\d{1,2})[:.]?(\d{2})?/i);
    let horaInicio = '09:00';
    let horaFin = '15:00';
    if (timeMatch) {
      const h1 = String(timeMatch[1]).padStart(2, '0');
      const m1 = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00';
      const h2 = String(timeMatch[3]).padStart(2, '0');
      const m2 = timeMatch[4] ? String(timeMatch[4]).padStart(2, '0') : '00';
      horaInicio = `${h1}:${m1}`;
      horaFin = `${h2}:${m2}`;
    }

    const fecha = lower.includes('mañana') ? addDaysMadrid(hoyMadrid, 1) : hoyMadrid;

    return {
      tipo: 'crear_turno',
      resumen: `Registrar turno de trabajo: ${fecha} de ${horaInicio} a ${horaFin}`,
      payload: {
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo_turno: 'ordinario',
        notas: 'Planificado con Pibble',
      },
    };
  }

  if (lower.includes('tarea') || lower.includes('entrega') || lower.includes('examen') || lower.includes('estudiar')) {
    let tipo = 'tarea';
    if (lower.includes('examen')) tipo = 'examen';
    else if (lower.includes('entrega')) tipo = 'entrega';
    else if (lower.includes('estudiar')) tipo = 'estudio';

    const fecha = lower.includes('mañana') ? addDaysMadrid(hoyMadrid, 1) : hoyMadrid;

    let asignatura = 'Adquisición y Desarrollo del Lenguaje';
    if (lower.includes('neuro')) asignatura = 'Bases de la Neurociencia';
    else if (lower.includes('evaluacion') || lower.includes('evaluación')) asignatura = 'Evaluación I';
    else if (lower.includes('voz') || lower.includes('audicion') || lower.includes('audición')) asignatura = 'Trastornos de la Voz y de la Audición';
    else if (lower.includes('psicolog')) asignatura = 'Psicología del Lenguaje';
    else if (lower.includes('ling')) asignatura = 'Lingüística II';

    return {
      tipo: 'crear_tarea',
      resumen: `Añadir ${tipo}: ${text.slice(0, 40)}... (${asignatura})`,
      payload: {
        titulo: text.slice(0, 60),
        asignatura,
        fecha_entrega: fecha,
        prioridad: 'alta',
        tipo,
        ambito: 'academico',
      },
    };
  }

  return null;
}
