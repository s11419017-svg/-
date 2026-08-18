/**
 * UTF-8 & Encoding Validation Utilities
 * 
 * Ensures robust UTF-8 normalization, mojibake/garbled text detection,
 * non-standard control character sanitization, and URL-safe serialization (encodeURIComponent / decodeURIComponent).
 */

export interface EncodingCheckResult {
  hasIssue: boolean;
  warnings: string[];
  suggestedFix?: string;
  isGarbledMojibake: boolean;
  hasControlChars: boolean;
  hasUnpairedSurrogate: boolean;
}

// Regex for common UTF-8 Mojibake / Garbled patterns when double-encoded or read with wrong code-pages
// e.g., 'Ã©', 'Ã ', 'å®¢', 'â€™', 'ï¿½', '\uFFFD'
const REPLACEMENT_CHAR_REGEX = /\uFFFD/;
// ASCII control characters except \t (tab), \n (newline), \r (carriage return)
const ILLEGAL_CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
// Common Windows-1252 / ISO-8859-1 mojibake signature patterns
const MOJIBAKE_PATTERNS = /(?:Ã[\x80-\xBF]|â[\x80-\xBF]{2}|ï¿½|)/;

/**
 * Validates text string for encoding anomalies, replacement characters, control chars, or mojibake.
 */
export function checkStringEncoding(text: string): EncodingCheckResult {
  if (!text) {
    return {
      hasIssue: false,
      warnings: [],
      isGarbledMojibake: false,
      hasControlChars: false,
      hasUnpairedSurrogate: false,
    };
  }

  const warnings: string[] = [];
  let isGarbledMojibake = false;
  let hasControlChars = false;
  let hasUnpairedSurrogate = false;

  // 1. Check for Unicode replacement character (\uFFFD / )
  if (REPLACEMENT_CHAR_REGEX.test(text)) {
    isGarbledMojibake = true;
    warnings.push('檢測到損壞的 Unicode 替換字元 (/U+FFFD)，可能是先前的編碼錯誤導致。');
  }

  // 2. Check for typical Mojibake pattern
  if (MOJIBAKE_PATTERNS.test(text)) {
    isGarbledMojibake = true;
    warnings.push('檢測到疑似雙重編碼或代碼頁錯誤之亂碼特徵 (如 Ã©, â€™, ï¿½ 等)。');
  }

  // 3. Check for invisible control characters
  if (ILLEGAL_CONTROL_CHARS_REGEX.test(text)) {
    hasControlChars = true;
    warnings.push('檢測到不可見的非標準控制字元 (Control Characters)，可能會影響跨平台顯示。');
  }

  // 4. Check for unpaired high/low surrogates
  try {
    // encodeURIComponent will throw URIError on unpaired surrogates
    encodeURIComponent(text);
  } catch (err) {
    hasUnpairedSurrogate = true;
    warnings.push('檢測到未成對的 Unicode 代理字元 (Unpaired Surrogate)，無法以標準 UTF-8 序列化。');
  }

  const hasIssue = warnings.length > 0;
  let suggestedFix: string | undefined;

  if (hasIssue) {
    suggestedFix = sanitizeToStrictUtf8(text);
  }

  return {
    hasIssue,
    warnings,
    suggestedFix,
    isGarbledMojibake,
    hasControlChars,
    hasUnpairedSurrogate,
  };
}

/**
 * Sanitizes and forces a text string to clean standard UTF-8 NFC representation.
 * Strips non-printable control characters, fixes unpaired surrogates, and normalizes unicode.
 */
export function sanitizeToStrictUtf8(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // 1. Remove dangerous control characters while preserving \r, \n, \t
  sanitized = sanitized.replace(ILLEGAL_CONTROL_CHARS_REGEX, '');

  // 2. Normalize Unicode to Canonical Decomposition / Composition (NFC)
  try {
    sanitized = sanitized.normalize('NFC');
  } catch {
    // fallback if normalize is unsupported
  }

  // 3. Fix any lone / unpaired surrogates by replacing them with empty string
  sanitized = sanitized.replace(
    /([\uD800-\uDBFF](?![\uDC00-\uDFFF]))|((?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g,
    ''
  );

  return sanitized;
}

/**
 * Recursively sanitizes all string properties in an object or array to strict UTF-8 NFC.
 */
export function sanitizeObjectToUtf8<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeToStrictUtf8(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectToUtf8(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeToStrictUtf8(key);
      result[sanitizedKey] = sanitizeObjectToUtf8(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Creates a UTF-8 JSON Blob with UTF-8 Byte Order Mark (BOM) [0xEF, 0xBB, 0xBF].
 * This ensures that Windows Notepad, Excel, macOS TextEdit, and all text readers
 * unambiguously recognize and parse UTF-8 without garbled Chinese characters.
 */
export function createSafeUtf8JsonBlob(data: any): Blob {
  const sanitized = sanitizeObjectToUtf8(data);
  const jsonString = JSON.stringify(sanitized, null, 2);
  
  // UTF-8 BOM
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  return new Blob([bom, jsonString], {
    type: 'application/json;charset=utf-8',
  });
}

/**
 * Creates a UTF-8 TypeScript/Text Blob with UTF-8 BOM.
 */
export function createSafeUtf8TextBlob(text: string): Blob {
  const sanitized = sanitizeToStrictUtf8(text);
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  return new Blob([bom, sanitized], {
    type: 'text/plain;charset=utf-8',
  });
}

/**
 * Safely encodes a JavaScript object to a URL-safe sharing string
 * using JSON -> encodeURIComponent -> Base64 or URI component.
 * Prevents any URI malformed errors or corrupted Chinese characters.
 */
export function safeEncodeSharePayload(data: any): string {
  const sanitized = sanitizeObjectToUtf8(data);
  const jsonString = JSON.stringify(sanitized);
  // First URI-encode the UTF-8 bytes to percent sequences, then convert to base64
  const utf8Bytes = encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
  return btoa(utf8Bytes);
}

/**
 * Safely decodes a URL share payload back into an object
 * using Base64 -> decodeURIComponent.
 */
export function safeDecodeSharePayload<T = any>(payload: string): T {
  try {
    const rawBinary = atob(payload.trim());
    const percentEncoded = Array.prototype.map
      .call(rawBinary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('');
    const jsonString = decodeURIComponent(percentEncoded);
    const parsed = JSON.parse(jsonString);
    return sanitizeObjectToUtf8(parsed);
  } catch (err) {
    throw new Error('解析分享連結代碼失敗：字串格式損毀或含有不相容編碼');
  }
}

/**
 * Safely reads a user-uploaded File as strict UTF-8 text with BOM removal and validation.
 */
export function readUploadedJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;
        if (!text) {
          throw new Error('檔案內容為空');
        }

        // Strip UTF-8 BOM if present (\uFEFF)
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        // Sanitize string before parsing
        text = sanitizeToStrictUtf8(text);

        const parsed = JSON.parse(text);
        const fullySanitized = sanitizeObjectToUtf8(parsed);
        resolve(fullySanitized);
      } catch (err: any) {
        reject(new Error(err?.message || '無法解析 JSON 格式'));
      }
    };

    reader.onerror = () => {
      reject(new Error('讀取檔案失敗'));
    };

    // Explicitly read as UTF-8 encoding
    reader.readAsText(file, 'UTF-8');
  });
}
