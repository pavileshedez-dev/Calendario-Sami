import crypto from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

/**
 * Genera un hash seguro de contraseña usando scrypt con sal criptográfica aleatoria.
 * Formato: scrypt$N$r$p$saltHex$derivedKeyHex
 */
export function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('La contraseña no puede estar vacía.');
  }
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/**
 * Verifica una contraseña en tiempo constante frente a un hash almacenado.
 */
export function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const N = Number.parseInt(parts[1], 10);
  const r = Number.parseInt(parts[2], 10);
  const p = Number.parseInt(parts[3], 10);
  const saltHex = parts[4];
  const hashHex = parts[5];

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !saltHex || !hashHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    });
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Hash ficticio precomputado para mitigar ataques de temporización cuando el usuario no existe o no tiene hash
const DUMMY_HASH = hashPassword('dummy_timing_protection_value_not_a_real_password');

export function verifyPasswordTimingSafe(password, storedHash) {
  if (!storedHash) {
    verifyPassword(password || '', DUMMY_HASH);
    return false;
  }
  return verifyPassword(password, storedHash);
}

/**
 * Genera un token opaco criptográficamente seguro (256 bits).
 */
export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Genera un token CSRF criptográficamente seguro vinculado a sesión.
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcula el hash SHA-256 de un token de sesión para persistir solo el hash en SQLite.
 */
export function hashSessionToken(rawToken) {
  if (typeof rawToken !== 'string' || !rawToken) return '';
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

/**
 * Comparación en tiempo constante para strings (ej. tokens CSRF).
 */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Parsea la cabecera Cookie de forma segura.
 */
export function parseCookies(cookieHeader) {
  const result = Object.create(null);
  if (!cookieHeader || typeof cookieHeader !== 'string') return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const rawVal = part.slice(idx + 1).trim();
    if (!name) continue;
    try {
      result[name] = decodeURIComponent(rawVal);
    } catch {
      result[name] = rawVal;
    }
  }
  return result;
}
