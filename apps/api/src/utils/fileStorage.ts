import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// Ensure upload folders exist
for (const sub of ['avatars', 'tools', 'items']) {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveUploadFile(dataOrUrl: string, subfolder: 'avatars' | 'tools' | 'items' = 'tools'): string {
  if (!dataOrUrl) return '';

  // If already a relative or absolute URL, return as is
  if (dataOrUrl.startsWith('http://') || dataOrUrl.startsWith('https://') || dataOrUrl.startsWith('/uploads/')) {
    return dataOrUrl;
  }

  // Check if base64 data URL
  const matches = dataOrUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || !matches[1] || !matches[2]) {
    // Return unchanged if not base64
    return dataOrUrl;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  let extension = 'jpg';

  if (mimeType === 'image/png') extension = 'png';
  else if (mimeType === 'image/webp') extension = 'webp';
  else if (mimeType === 'image/svg+xml') extension = 'svg';
  else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = 'jpg';

  const filename = `${subfolder}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
  const targetDir = path.join(UPLOAD_ROOT, subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  return `/uploads/${subfolder}/${filename}`;
}
