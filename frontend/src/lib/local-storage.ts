import { useEffect, useState, useCallback } from 'react';
import {
  MAX_TOOL_IMAGES,
  validateAndModerateImage,
  type ImageModerationResult,
} from '@mcteb/shared';

const AVATAR_KEY_PREFIX = 'mcteb_avatar_';
const TOOL_IMAGE_KEY_PREFIX = 'mcteb_tool_image_';
const TOOL_IMAGES_KEY_PREFIX = 'mcteb_tool_images_';
const AVATAR_EVENT = 'mcteb-avatar-updated';
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return null;
}

export function getProfilePicture(
  userId?: string | null,
  storageOverride?: Storage | null,
): string | null {
  if (!userId) return null;
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(`${AVATAR_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function setProfilePicture(
  userId: string,
  dataUrl: string | null,
  storageOverride?: Storage | null,
): void {
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage) return;

  const key = `${AVATAR_KEY_PREFIX}${userId}`;
  try {
    if (dataUrl) {
      storage.setItem(key, dataUrl);
    } else {
      storage.removeItem(key);
    }
  } catch (err) {
    console.error('Failed to store profile picture in localStorage', err);
    throw new Error('Image is too large for browser local storage. Please choose a smaller photo.');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { userId, dataUrl } }));
  }
}

export function useProfilePicture(
  userId?: string | null,
): [string | null, (dataUrl: string | null) => void] {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getProfilePicture(userId));

  useEffect(() => {
    setAvatarUrl(getProfilePicture(userId));

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ userId?: string; dataUrl?: string | null }>).detail;
      if (!detail || detail.userId === userId) {
        setAvatarUrl(getProfilePicture(userId));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (userId && e.key === `${AVATAR_KEY_PREFIX}${userId}`) {
        setAvatarUrl(e.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AVATAR_EVENT, handleCustomEvent);
      window.addEventListener('storage', handleStorageEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(AVATAR_EVENT, handleCustomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
    };
  }, [userId]);

  const updateAvatar = useCallback(
    (dataUrl: string | null) => {
      if (!userId) return;
      setProfilePicture(userId, dataUrl);
      setAvatarUrl(dataUrl);
    },
    [userId],
  );

  return [avatarUrl, updateAvatar];
}

export function getLocalToolImage(toolId: string, storageOverride?: Storage | null): string | null {
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage || !toolId) return null;
  try {
    return storage.getItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`);
  } catch {
    return null;
  }
}

export function setLocalToolImage(
  toolId: string,
  dataUrl: string | null,
  storageOverride?: Storage | null,
): void {
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage || !toolId) return;
  try {
    if (dataUrl) {
      storage.setItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`, dataUrl);
    } else {
      storage.removeItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`);
    }
  } catch {
    // Non-fatal if browser storage quota is full; backend still stores image_url
  }
}

export function getLocalToolImages(toolId: string, storageOverride?: Storage | null): string[] {
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage || !toolId) return [];
  try {
    const rawList = storage.getItem(`${TOOL_IMAGES_KEY_PREFIX}${toolId}`);
    if (rawList) {
      const parsed = JSON.parse(rawList) as unknown;
      if (Array.isArray(parsed)) {
        const valid = parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, MAX_TOOL_IMAGES);
        if (valid.length > 0) return valid;
      }
    }
    const single = storage.getItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`);
    return single ? [single] : [];
  } catch {
    return [];
  }
}

export function setLocalToolImages(
  toolId: string,
  dataUrls: string[] | null,
  storageOverride?: Storage | null,
): void {
  const storage = storageOverride !== undefined ? storageOverride : getStorage();
  if (!storage || !toolId) return;
  try {
    const normalized = Array.isArray(dataUrls)
      ? dataUrls
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, MAX_TOOL_IMAGES)
      : [];

    if (normalized.length > 0) {
      storage.setItem(`${TOOL_IMAGES_KEY_PREFIX}${toolId}`, JSON.stringify(normalized));
      storage.setItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`, normalized[0]!);
    } else {
      storage.removeItem(`${TOOL_IMAGES_KEY_PREFIX}${toolId}`);
      storage.removeItem(`${TOOL_IMAGE_KEY_PREFIX}${toolId}`);
    }
  } catch {
    // Non-fatal if browser storage quota is full; backend still stores images_json
  }
}

export function resolveToolImages(tool: {
  id: string;
  image_url?: string | null;
  image_urls?: string[] | null;
}): string[] {
  const apiImages = Array.isArray(tool.image_urls)
    ? tool.image_urls.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  if (apiImages.length > 0) {
    return apiImages.slice(0, MAX_TOOL_IMAGES);
  }

  const localImages = getLocalToolImages(tool.id);
  if (localImages.length > 0) {
    return localImages;
  }

  if (tool.image_url) {
    return [tool.image_url];
  }

  return ['/equipment/fallback.svg'];
}

export function resolveToolImage(tool: {
  id: string;
  image_url?: string | null;
  image_urls?: string[] | null;
}): string {
  return resolveToolImages(tool)[0] || '/equipment/fallback.svg';
}

async function analyzeRasterImagePixels(dataUrl: string): Promise<ImageModerationResult> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return { valid: true };
  }

  const probeCanvas = document.createElement('canvas');
  const probeCtx = probeCanvas.getContext('2d');
  if (!probeCtx) {
    return { valid: true };
  }

  return new Promise<ImageModerationResult>((resolve) => {
    let settled = false;
    const finish = (res: ImageModerationResult) => {
      if (!settled) {
        settled = true;
        resolve(res);
      }
    };

    const timer = setTimeout(() => finish({ valid: true }), 150);
    const img = new Image();

    img.onload = () => {
      clearTimeout(timer);
      try {
        if (img.width < 32 || img.height < 32) {
          finish({ valid: true });
          return;
        }
        const sampleSize = 64;
        probeCanvas.width = sampleSize;
        probeCanvas.height = sampleSize;
        probeCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = probeCtx.getImageData(0, 0, sampleSize, sampleSize);
        const totalPixels = sampleSize * sampleSize;
        let skinPixels = 0;
        let darkCrimsonPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          const a = data[i + 3]!;
          if (a < 128) continue;

          // Conservative skin-tone region check
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          if (
            r > 95 &&
            g > 40 &&
            b > 20 &&
            maxC - minC > 15 &&
            Math.abs(r - g) > 15 &&
            r > g &&
            r > b
          ) {
            skinPixels++;
          }

          // Conservative dark arterial crimson check for graphic gore heuristics
          if (r > 125 && r < 205 && g < 35 && b < 40 && r > g * 3.8 && r > b * 3.8) {
            darkCrimsonPixels++;
          }
        }

        const skinRatio = skinPixels / totalPixels;
        const crimsonRatio = darkCrimsonPixels / totalPixels;

        if (skinRatio > 0.85) {
          finish({
            valid: false,
            category: 'Explicit or adult content',
            reason:
              'Image rejected by content moderation: Explicit or adult content is prohibited. Please upload clear photos of tools and equipment only.',
          });
          return;
        }

        if (crimsonRatio > 0.78) {
          finish({
            valid: false,
            category: 'Violent or graphic content',
            reason:
              'Image rejected by content moderation: Violent or graphic content is prohibited. Please upload appropriate photos of tools and equipment only.',
          });
          return;
        }

        finish({ valid: true });
      } catch {
        finish({ valid: true });
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      finish({ valid: true });
    };

    img.src = dataUrl;
  });
}

export async function moderateImageFileClient(
  file: File,
  dataUrl: string,
): Promise<ImageModerationResult> {
  if (!file.type || !ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      category: 'Invalid image format',
      reason: 'Please select a valid image file (PNG, JPG, WebP, GIF, or SVG).',
    };
  }

  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return {
      valid: false,
      category: 'Invalid image format',
      reason: `Image "${file.name}" exceeds the 5 MB file size limit.`,
    };
  }

  const baseCheck = validateAndModerateImage(dataUrl, file.name);
  if (!baseCheck.valid) {
    return baseCheck;
  }

  if (file.type.toLowerCase() !== 'image/svg+xml') {
    return analyzeRasterImagePixels(dataUrl);
  }

  return { valid: true };
}

export async function compressImageToDataUrl(
  file: File,
  maxSize = 480,
  quality = 0.82,
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
