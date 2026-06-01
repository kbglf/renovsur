import { SignJWT, jwtVerify } from "jose";
import { checkRateLimit } from "./rate-limit";
import { getAuthSecret } from "./env";
import { readJsonFile, writeJsonFile } from "./json-store";

const AUTH_COOKIE = "rs_auth";
const OTP_FILE = "otps.json";

interface OtpEntry {
  email: string;
  code: string;
  expiresAt: string;
}

export { AUTH_COOKIE };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function readOtps(): Promise<OtpEntry[]> {
  return readJsonFile<OtpEntry[]>(OTP_FILE, []);
}

async function writeOtps(entries: OtpEntry[]) {
  const now = Date.now();
  const valid = entries.filter((e) => new Date(e.expiresAt).getTime() > now);
  await writeJsonFile(OTP_FILE, valid.slice(-500));
}

export async function createLoginCode(
  email: string,
  ip: string,
): Promise<{ ok: boolean; error?: string; code?: string }> {
  const limit = checkRateLimit(`otp-send:${ip}`);
  if (!limit.ok) {
    return { ok: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const normalized = normalizeEmail(email);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const entries = await readOtps();
  entries.push({ email: normalized, code, expiresAt });
  await writeOtps(entries);

  return { ok: true, code };
}

export async function verifyLoginCode(
  email: string,
  code: string,
  ip: string,
): Promise<{ ok: boolean; error?: string }> {
  const limit = checkRateLimit(`otp-verify:${ip}`);
  if (!limit.ok) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const normalized = normalizeEmail(email);
  const entries = await readOtps();
  const match = entries.find(
    (e) =>
      e.email === normalized &&
      e.code === code.trim() &&
      new Date(e.expiresAt).getTime() > Date.now(),
  );

  if (!match) {
    return { ok: false, error: "Code incorrect ou expiré" };
  }

  const remaining = entries.filter((e) => e !== match);
  await writeOtps(remaining);
  return { ok: true };
}

export async function createSessionToken(email: string): Promise<string> {
  const secret = getAuthSecret();
  return new SignJWT({ email: normalizeEmail(email) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function getSessionEmail(token: string): Promise<string | null> {
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}
