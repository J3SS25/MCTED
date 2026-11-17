import { useEffect, useState, useCallback } from 'react';

const AVATAR_KEY_PREFIX = 'mcteb_avatar_';
const TOOL_IMAGE_KEY_PREFIX = 'mcteb_tool_image_';
const AVATAR_EVENT = 'mcteb-avatar-updated';

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

export function resolveToolImage(tool: { id: string; image_url?: string | null }): string {
  return getLocalToolImage(tool.id) || tool.image_url || '/equipment/fallback.svg';
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
