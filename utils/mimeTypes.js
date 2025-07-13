import { extname } from 'path';

export const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  avi: 'video/avi',
  mov: 'video/quicktime',
  '3gp': 'video/3gpp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/m4a',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
};

export function getMimeType(filename, fallback = 'application/octet-stream') {
  const extension = extname(filename).replace('.', '').toLowerCase();
  return MIME_TYPES[extension] || fallback;
}

export function isImage(filename) {
  const mimeType = getMimeType(filename);
  return mimeType.startsWith('image/');
}

export function isVideo(filename) {
  const mimeType = getMimeType(filename);
  return mimeType.startsWith('video/');
}

export function isAudio(filename) {
  const mimeType = getMimeType(filename);
  return mimeType.startsWith('audio/');
}

export function isDocument(filename) {
  const mimeType = getMimeType(filename);
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain',
  ];

  return documentTypes.some((type) => mimeType.includes(type));
}

export function getFileCategory(filename) {
  if (isImage(filename)) return 'image';
  if (isVideo(filename)) return 'video';
  if (isAudio(filename)) return 'audio';
  if (isDocument(filename)) return 'document';

  return 'unsupported';
}

export function isWhatsAppSupported(filename) {
  return getFileCategory(filename) !== 'unsupported';
}
