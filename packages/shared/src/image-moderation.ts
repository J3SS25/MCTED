export const MAX_TOOL_IMAGES = 5;

export type ModerationViolationCategory =
  | 'Explicit or adult content'
  | 'Violent or graphic content'
  | 'Hate symbols or offensive content'
  | 'Illegal or inappropriate materials'
  | 'Invalid image format';

export interface ImageModerationResult {
  valid: boolean;
  category?: ModerationViolationCategory;
  reason?: string;
}

interface PolicyRule {
  category: Exclude<ModerationViolationCategory, 'Invalid image format'>;
  tokenKeywords: string[];
  compoundKeywords: string[];
}

const POLICY_RULES: PolicyRule[] = [
  {
    category: 'Explicit or adult content',
    tokenKeywords: [
      'nsfw',
      'explicit',
      'adult',
      'porn',
      'pornography',
      'xxx',
      'nude',
      'nudity',
      'naked',
      'erotic',
      'hentai',
      'sex',
      'sexual',
      'onlyfans',
      'stripper',
      'lewd',
      'obscene',
      '18plus',
      'r18',
      'bikini',
      'lingerie',
    ],
    compoundKeywords: [
      'nsfw',
      'explicit',
      'porn',
      'pornography',
      'nudity',
      'erotic',
      'hentai',
      'onlyfans',
      'stripper',
      'obscene',
      '18plus',
    ],
  },
  {
    category: 'Violent or graphic content',
    tokenKeywords: [
      'gore',
      'graphic',
      'violence',
      'violent',
      'blood',
      'bloody',
      'murder',
      'killing',
      'corpse',
      'deadbody',
      'mutilation',
      'torture',
      'beheading',
      'decapitation',
      'brutal',
      'massacre',
      'assault',
      'slaughter',
    ],
    compoundKeywords: [
      'gore',
      'violence',
      'violent',
      'murder',
      'corpse',
      'deadbody',
      'mutilation',
      'torture',
      'beheading',
      'decapitation',
      'massacre',
      'slaughter',
    ],
  },
  {
    category: 'Hate symbols or offensive content',
    tokenKeywords: [
      'hate',
      'hatesymbol',
      'nazi',
      'swastika',
      'hitler',
      'kkk',
      'klan',
      'whitepower',
      'supremacist',
      'racist',
      'racism',
      'slur',
      'offensive',
      'extremist',
      'terrorist',
      'fascist',
      'profanity',
      'fuck',
      'shit',
      'bitch',
      'asshole',
    ],
    compoundKeywords: [
      'hatesymbol',
      'nazi',
      'swastika',
      'hitler',
      'whitepower',
      'supremacist',
      'racist',
      'racism',
      'extremist',
      'terrorist',
      'fascist',
      'profanity',
      'fuck',
      'shit',
      'bitch',
      'asshole',
    ],
  },
  {
    category: 'Illegal or inappropriate materials',
    tokenKeywords: [
      'illegal',
      'contraband',
      'drugs',
      'cocaine',
      'heroin',
      'meth',
      'marijuana',
      'weed',
      'cannabis',
      'narcotics',
      'weapon',
      'firearm',
      'handgun',
      'rifle',
      'pistol',
      'shotgun',
      'bomb',
      'explosive',
      'grenade',
      'stolen',
      'counterfeit',
      'pirated',
      'gambling',
      'inappropriate',
      'restricted',
      'banned',
      'prohibited',
    ],
    compoundKeywords: [
      'illegal',
      'contraband',
      'cocaine',
      'heroin',
      'marijuana',
      'cannabis',
      'narcotics',
      'firearm',
      'handgun',
      'rifle',
      'pistol',
      'shotgun',
      'explosive',
      'grenade',
      'counterfeit',
      'pirated',
      'gambling',
      'inappropriate',
      'prohibited',
    ],
  },
];

const DANGEROUS_CONTENT_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /\bonerror\s*=/i,
  /\bonload\s*=/i,
];

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64Safe(base64: string): string {
  try {
    const clean = base64.replace(/[\r\n\s=]/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 4) {
      const c1 = BASE64_ALPHABET.indexOf(clean[i] || '');
      const c2 = BASE64_ALPHABET.indexOf(clean[i + 1] || '');
      const c3 = i + 2 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 2] || '') : -1;
      const c4 = i + 3 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 3] || '') : -1;
      if (c1 < 0 || c2 < 0) break;
      bytes.push((c1 << 2) | (c2 >> 4));
      if (c3 >= 0) {
        bytes.push(((c2 & 15) << 4) | (c3 >> 2));
        if (c4 >= 0) {
          bytes.push(((c3 & 3) << 6) | c4);
        }
      }
    }
    let out = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      out += String.fromCharCode(...bytes.slice(i, i + 8192));
    }
    return out;
  } catch {
    return '';
  }
}

function splitTokens(text: string): Set<string> {
  // Split on camelCase boundaries and non-alphanumeric delimiters
  const expanded = text.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  const parts = expanded.split(/[^a-z0-9]+/).filter(Boolean);
  return new Set(parts);
}

function checkPolicyKeywords(text: string): ImageModerationResult {
  if (!text.trim()) return { valid: true };

  const tokens = splitTokens(text);
  const compact = text.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const rule of POLICY_RULES) {
    const matchedToken = rule.tokenKeywords.find((kw) => tokens.has(kw));
    const matchedCompound = rule.compoundKeywords.find((kw) => compact.includes(kw));

    if (matchedToken || matchedCompound) {
      return {
        valid: false,
        category: rule.category,
        reason: `Image rejected by content moderation: ${rule.category} is prohibited. Please upload appropriate photos of tools and equipment only.`,
      };
    }
  }

  return { valid: true };
}

function hasUnsafeMarkup(text: string): boolean {
  return DANGEROUS_CONTENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateAndModerateImage(
  imageSource: string,
  fileName?: string,
): ImageModerationResult {
  const trimmed = (imageSource || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      category: 'Invalid image format',
      reason: 'Image source cannot be empty.',
    };
  }

  if (fileName) {
    const fileNameCheck = checkPolicyKeywords(fileName);
    if (!fileNameCheck.valid) {
      return fileNameCheck;
    }
  }

  if (hasUnsafeMarkup(trimmed)) {
    return {
      valid: false,
      category: 'Illegal or inappropriate materials',
      reason:
        'Image rejected by content moderation: Illegal or inappropriate materials (embedded scripts) are prohibited.',
    };
  }

  // Handle data URIs
  if (trimmed.startsWith('data:')) {
    const dataMatch = trimmed.match(
      /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml)(?:;([^,]*))?,(.*)$/is,
    );
    if (!dataMatch) {
      return {
        valid: false,
        category: 'Invalid image format',
        reason:
          'Unsupported image format. Please upload valid PNG, JPG, WebP, GIF, or SVG images.',
      };
    }

    const mimeSubtype = (dataMatch[1] || '').toLowerCase();
    const params = (dataMatch[2] || '').toLowerCase();
    const payload = dataMatch[3] || '';
    const isBase64 = params.split(';').includes('base64');

    if (!payload) {
      return {
        valid: false,
        category: 'Invalid image format',
        reason: 'Uploaded image data is empty or corrupted.',
      };
    }

    if (mimeSubtype === 'svg+xml') {
      const svgText = isBase64 ? decodeBase64Safe(payload) : decodeURIComponentSafe(payload);
      if (hasUnsafeMarkup(svgText)) {
        return {
          valid: false,
          category: 'Illegal or inappropriate materials',
          reason:
            'Image rejected by content moderation: Illegal or inappropriate materials (unsafe SVG markup) are prohibited.',
        };
      }
      const svgPolicyCheck = checkPolicyKeywords(svgText);
      if (!svgPolicyCheck.valid) {
        return svgPolicyCheck;
      }
      return { valid: true };
    }

    if (isBase64) {
      const cleanPayload = payload.replace(/\s+/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(cleanPayload) || cleanPayload.length < 16) {
        return {
          valid: false,
          category: 'Invalid image format',
          reason: 'Uploaded image contains invalid or corrupted base64 data.',
        };
      }
      const headerSlice = decodeBase64Safe(cleanPayload.slice(0, 512));
      if (hasUnsafeMarkup(headerSlice) || /^\s*<(html|script|svg)\b/i.test(headerSlice)) {
        return {
          valid: false,
          category: 'Illegal or inappropriate materials',
          reason:
            'Image rejected by content moderation: Illegal or inappropriate materials (disguised active content) are prohibited.',
        };
      }
    }

    return { valid: true };
  }

  // Handle local relative equipment paths or HTTP(S) URLs
  const isRelativePath = trimmed.startsWith('/');
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  if (!isRelativePath && !isHttpUrl) {
    return {
      valid: false,
      category: 'Invalid image format',
      reason: 'Image must be a valid uploaded image file or HTTPS/local image URL.',
    };
  }

  return checkPolicyKeywords(trimmed);
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function validateToolImagesBatch(
  images: string[],
  fileNames?: string[],
): ImageModerationResult {
  if (images.length > MAX_TOOL_IMAGES) {
    return {
      valid: false,
      category: 'Invalid image format',
      reason: `You can upload a maximum of ${MAX_TOOL_IMAGES} images per tool or equipment.`,
    };
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img) continue;
    const result = validateAndModerateImage(img, fileNames?.[i]);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
