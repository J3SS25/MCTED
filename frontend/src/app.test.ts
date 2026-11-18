import { describe, it, expect } from 'vitest';
import { calculateAgeFromBirthDate, RegisterUserSchema } from '@mcteb/shared';
import {
  getProfilePicture,
  setProfilePicture,
  getLocalToolImage,
  setLocalToolImage,
  getLocalToolImages,
  setLocalToolImages,
  resolveToolImages,
  moderateImageFileClient,
} from './lib/local-storage';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('MCTEB Web Unit Tests', () => {
  it('enforces 18+ age validation on borrower registration schema', () => {
    const today = new Date();
    const underageBirthYear = today.getFullYear() - 16;
    const adultBirthYear = today.getFullYear() - 21;

    expect(calculateAgeFromBirthDate(`${underageBirthYear}-01-01`, today)).toBeLessThan(18);

    const underageResult = RegisterUserSchema.safeParse({
      full_name: 'Minor Applicant',
      email: 'minor@example.com',
      password: 'Password123!',
      phone: '09171234567',
      birth_date: `${underageBirthYear}-01-01`,
      barangay: 'San Antonio',
      province: 'Batanes',
      address: 'Sitio Disong, Basco',
    });
    expect(underageResult.success).toBe(false);

    const adultResult = RegisterUserSchema.safeParse({
      full_name: 'Adult Applicant',
      email: 'adult@example.com',
      password: 'Password123!',
      phone: '09171234567',
      birth_date: `${adultBirthYear}-01-01`,
      age: 21,
      barangay: 'San Antonio',
      province: 'Batanes',
      address: 'Sitio Disong, Basco',
    });
    expect(adultResult.success).toBe(true);
  });

  it('persists profile pictures and tool images in local storage', () => {
    const storage = createMemoryStorage();
    const userId = 'user-1';
    const toolId = 'tool-1';
    const avatarData = 'data:image/jpeg;base64,/9j/4AAQ';
    const toolImageData = 'data:image/png;base64,iVBOR';

    expect(getProfilePicture(userId, storage)).toBeNull();
    setProfilePicture(userId, avatarData, storage);
    expect(getProfilePicture(userId, storage)).toBe(avatarData);
    setProfilePicture(userId, null, storage);
    expect(getProfilePicture(userId, storage)).toBeNull();

    setLocalToolImage(toolId, toolImageData, storage);
    expect(getLocalToolImage(toolId, storage)).toBe(toolImageData);
  });

  it('persists up to 5 tool images in local storage and resolves multi-image arrays', () => {
    const storage = createMemoryStorage();
    const toolId = 'tool-multi-1';
    const sixUrls = Array.from({ length: 6 }, (_, i) => `data:image/png;base64,IMG${i + 1}==`);

    setLocalToolImages(toolId, sixUrls, storage);
    const stored = getLocalToolImages(toolId, storage);
    expect(stored).toHaveLength(5);
    expect(stored[0]).toBe('data:image/png;base64,IMG1==');
    expect(getLocalToolImage(toolId, storage)).toBe('data:image/png;base64,IMG1==');

    const resolvedFromApi = resolveToolImages({
      id: toolId,
      image_url: '/equipment/tiller.svg',
      image_urls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });
    expect(resolvedFromApi).toEqual(['https://example.com/a.jpg', 'https://example.com/b.jpg']);

    setLocalToolImages(toolId, null, storage);
    expect(getLocalToolImages(toolId, storage)).toEqual([]);
  });

  it('moderates uploaded image files for restricted content and invalid file types', async () => {
    const validDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const validFile = new File(['pngbytes'], 'circular-saw-photo.png', { type: 'image/png' });
    const validRes = await moderateImageFileClient(validFile, validDataUrl);
    expect(validRes.valid).toBe(true);

    const adultFile = new File(['pngbytes'], 'explicit_nsfw_image.png', { type: 'image/png' });
    const adultRes = await moderateImageFileClient(adultFile, validDataUrl);
    expect(adultRes.valid).toBe(false);
    expect(adultRes.reason).toMatch(/Explicit or adult content/i);

    const violentFile = new File(['pngbytes'], 'violent_gore_blood.jpg', { type: 'image/jpeg' });
    const violentRes = await moderateImageFileClient(violentFile, validDataUrl);
    expect(violentRes.valid).toBe(false);
    expect(violentRes.reason).toMatch(/Violent or graphic content/i);

    const hateFile = new File(['pngbytes'], 'nazi_hate_symbol.png', { type: 'image/png' });
    const hateRes = await moderateImageFileClient(hateFile, validDataUrl);
    expect(hateRes.valid).toBe(false);
    expect(hateRes.reason).toMatch(/Hate symbols or offensive content/i);

    const illegalFile = new File(['pngbytes'], 'illegal_weapon_handgun.png', { type: 'image/png' });
    const illegalRes = await moderateImageFileClient(illegalFile, validDataUrl);
    expect(illegalRes.valid).toBe(false);
    expect(illegalRes.reason).toMatch(/Illegal or inappropriate materials/i);

    const badMimeFile = new File(['text'], 'manual.txt', { type: 'text/plain' });
    const badMimeRes = await moderateImageFileClient(badMimeFile, 'data:text/plain;base64,aGVsbG8=');
    expect(badMimeRes.valid).toBe(false);
  });
});
