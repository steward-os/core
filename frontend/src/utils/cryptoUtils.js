const ENC_MARKER = "enc:";
const SALT = new TextEncoder().encode("fanfare-tools-iban-v1");

// Tracks fields that could not be decrypted: "recordId:fieldName"
const decryptionFailures = new Set();

async function deriveKey(keyMaterial) {
  const raw = new TextEncoder().encode(keyMaterial);
  const imported = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: 100000, hash: "SHA-256" },
    imported,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Returns the key name embedded in the encrypted value, or null if not encrypted.
export function getEncryptedKeyName(value) {
  if (typeof value !== "string" || !value.startsWith(ENC_MARKER)) return null;
  const rest = value.slice(ENC_MARKER.length);
  const colon = rest.indexOf(":");
  if (colon === -1) return null;
  return rest.slice(0, colon);
}

export function isEncrypted(value) {
  return getEncryptedKeyName(value) !== null;
}

export async function encryptValue(plaintext, keyName, keyMaterial) {
  const key = await deriveKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return `${ENC_MARKER}${keyName}:` + btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encryptedValue, keyMaterial) {
  const keyName = getEncryptedKeyName(encryptedValue);
  if (!keyName) return encryptedValue;
  const payload = encryptedValue.slice(ENC_MARKER.length + keyName.length + 1);
  const key = await deriveKey(keyMaterial);
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

export async function decryptRecord(record) {
  if (!record || typeof record !== "object") return record;
  const result = { ...record };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string" && isEncrypted(value)) {
      const keyName = getEncryptedKeyName(value);
      const keyMaterial = localStorage.getItem("enc_key_" + keyName);
      const failureKey = `${record.id}:${key}`;
      if (keyMaterial) {
        try {
          result[key] = await decryptValue(value, keyMaterial);
          decryptionFailures.delete(failureKey);
        } catch {
          decryptionFailures.add(failureKey);
          result[key] = `[kan niet ontsleutelen met sleutel "${keyName}"]`;
        }
      } else {
        decryptionFailures.add(failureKey);
        result[key] = `[versleuteld – sleutel "${keyName}" niet beschikbaar]`;
      }
    }
  }
  return result;
}

export async function decryptList(result) {
  if (Array.isArray(result)) {
    return Promise.all(result.map(decryptRecord));
  }
  // PocketBase paginated result: { page, perPage, totalItems, totalPages, items }
  return { ...result, items: await Promise.all(result.items.map(decryptRecord)) };
}

// Removes fields from data that failed to decrypt when the record was last read.
// Prevents accidentally saving placeholder text or re-encrypting unreadable data.
export function stripFailedDecryptionFields(id, data) {
  const result = { ...data };
  for (const field of Object.keys(result)) {
    if (decryptionFailures.has(`${id}:${field}`)) {
      delete result[field];
    }
  }
  return result;
}

// Encrypts data[field] only if field is in fieldsToEncrypt.
// Skips if already encrypted, missing, or empty. Strips field if key not available.
export async function encryptIfNeeded(data, fieldsToEncrypt, keyName, recordId = null) {
  let result = data;
  for (const field of fieldsToEncrypt) {
    if (recordId && decryptionFailures.has(`${recordId}:${field}`)) continue;
    if (!(field in result) || isEncrypted(result[field])) continue;
    const keyMaterial = localStorage.getItem("enc_key_" + keyName);
    if (!keyMaterial) {
      const { [field]: _omit, ...rest } = result;
      result = rest;
      continue;
    }
    if (!result[field]) continue;
    result = { ...result, [field]: await encryptValue(result[field], keyName, keyMaterial) };
  }
  return result;
}

export function loadLocalStorageKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith("enc_key_")) {
      keys.push({ name: k.slice("enc_key_".length), value: localStorage.getItem(k) });
    }
  }
  return keys;
}
