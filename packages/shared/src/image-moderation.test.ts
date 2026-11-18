import { describe, it, expect } from 'vitest';
import {
  MAX_TOOL_IMAGES,
  validateAndModerateImage,
  validateToolImagesBatch,
} from './image-moderation.js';

const VALID_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('image moderation and multi-image validation', () => {
  it('accepts valid tool photos and avoids false positives on normal tool filenames', () => {
    const validFiles = [
      'electric_drill.jpg',
      'circular_saw.png',
      'grass_cutter_tiller.webp',
      'photographic_meter.png',
      'method_manual_pump.jpg',
    ];

    for (const filename of validFiles) {
      expect(validateAndModerateImage(VALID_PNG_DATA_URL, filename)).toEqual({ valid: true });
    }

    expect(validateAndModerateImage('/equipment/tiller.svg')).toEqual({ valid: true });
    expect(validateAndModerateImage('https://example.com/tools/water-pump.jpg')).toEqual({
      valid: true,
    });
  });

  it('rejects images violating all restricted policy categories with clear messages', () => {
    const explicitRes = validateAndModerateImage(VALID_PNG_DATA_URL, 'nsfw_explicit_adult.jpg');
    expect(explicitRes.valid).toBe(false);
    expect(explicitRes.category).toBe('Explicit or adult content');
    expect(explicitRes.reason).toMatch(/Explicit or adult content/i);

    const violentRes = validateAndModerateImage(VALID_PNG_DATA_URL, 'violent_gore_blood.png');
    expect(violentRes.valid).toBe(false);
    expect(violentRes.category).toBe('Violent or graphic content');
    expect(violentRes.reason).toMatch(/Violent or graphic content/i);

    const hateRes = validateAndModerateImage(VALID_PNG_DATA_URL, 'nazi_swastika_hate.png');
    expect(hateRes.valid).toBe(false);
    expect(hateRes.category).toBe('Hate symbols or offensive content');
    expect(hateRes.reason).toMatch(/Hate symbols or offensive content/i);

    const illegalRes = validateAndModerateImage(VALID_PNG_DATA_URL, 'illegal_firearm_rifle.jpg');
    expect(illegalRes.valid).toBe(false);
    expect(illegalRes.category).toBe('Illegal or inappropriate materials');
    expect(illegalRes.reason).toMatch(/Illegal or inappropriate materials/i);
  });

  it('rejects SVGs containing embedded scripts or prohibited text', () => {
    const xssSvg = 'data:image/svg+xml;utf8,<svg><script>alert(1)</script></svg>';
    const xssRes = validateAndModerateImage(xssSvg, 'tool.svg');
    expect(xssRes.valid).toBe(false);
    expect(xssRes.category).toBe('Illegal or inappropriate materials');

    const hateSvg =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><text>hate symbol</text></svg>');
    const hateSvgRes = validateAndModerateImage(hateSvg, 'badge.svg');
    expect(hateSvgRes.valid).toBe(false);
    expect(hateSvgRes.category).toBe('Hate symbols or offensive content');
  });

  it('allows up to 5 images per tool and rejects more than 5 images', () => {
    expect(MAX_TOOL_IMAGES).toBe(5);
    const fiveImages = Array.from({ length: 5 }, () => VALID_PNG_DATA_URL);
    const fiveNames = Array.from({ length: 5 }, (_, i) => `tool-photo-${i + 1}.png`);
    expect(validateToolImagesBatch(fiveImages, fiveNames)).toEqual({ valid: true });

    const sixImages = Array.from({ length: 6 }, () => VALID_PNG_DATA_URL);
    const sixResult = validateToolImagesBatch(sixImages);
    expect(sixResult.valid).toBe(false);
    expect(sixResult.reason).toMatch(/maximum of 5 images/i);
  });
});
