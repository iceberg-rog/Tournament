import { createHmac, randomBytes } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** تولید رمزِ مشترکِ base32 برای TOTP. */
export function generateBase32Secret(bytesLen = 20): string {
  const bytes = randomBytes(bytesLen);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(s: string): Buffer {
  let bits = '';
  for (const c of s.replace(/=+$/, '').toUpperCase()) {
    const idx = B32.indexOf(c);
    if (idx >= 0) bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', secret).update(buf).digest();
  const offset = h[h.length - 1] & 0xf;
  const code =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** کد TOTP لحظه‌ی فعلی (پنجره‌ی ۳۰ ثانیه). */
export function totpNow(base32Secret: string, time = Date.now()): string {
  return hotp(base32Decode(base32Secret), Math.floor(time / 1000 / 30));
}

/** تأیید کد با تحملِ ±۱ پنجره (drift ساعت). */
export function verifyTotp(base32Secret: string, code: string, time = Date.now()): boolean {
  const step = Math.floor(time / 1000 / 30);
  const secret = base32Decode(base32Secret);
  for (let w = -1; w <= 1; w++) {
    if (hotp(secret, step + w) === code) return true;
  }
  return false;
}

/** URI استانداردِ otpauth برای ساخت QR در اپلیکیشن Authenticator. */
export function otpauthUri(label: string, secret: string, issuer = 'Tournament'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    label,
  )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
