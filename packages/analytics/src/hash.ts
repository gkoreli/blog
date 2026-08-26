const encoder = new TextEncoder();

function encodeFields(fields: readonly string[]): Uint8Array {
  const encoded = fields.map((field) => encoder.encode(field));
  let size = 0;
  for (const field of encoded) size += 4 + field.byteLength;

  const result = new Uint8Array(size);
  const view = new DataView(result.buffer);
  let offset = 0;
  for (const field of encoded) {
    view.setUint32(offset, field.byteLength, false);
    offset += 4;
    result.set(field, offset);
    offset += field.byteLength;
  }
  return result;
}

async function importHmacKey(bytes: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export interface DailyClientIdentity {
  masterKey: string;
  siteHost: string;
  utcDate: string;
  ip: string;
  userAgent: string;
}

export async function createDailyClientId(identity: DailyClientIdentity): Promise<string> {
  const masterKey = await importHmacKey(encoder.encode(identity.masterKey));
  const dailyKeyBytes = await crypto.subtle.sign('HMAC', masterKey, encodeFields([identity.utcDate]));
  const dailyKey = await importHmacKey(dailyKeyBytes);
  const payload = encodeFields([
    identity.siteHost,
    identity.utcDate,
    identity.ip,
    identity.userAgent,
  ]);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', dailyKey, payload));

  let hex = '';
  for (let index = 0; index < 16; index += 1) {
    hex += (digest[index] ?? 0).toString(16).padStart(2, '0');
  }
  return hex;
}
