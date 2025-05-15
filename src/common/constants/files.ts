export const allowedFileMimeTypes = {
  images: {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    heic: ['image/heic', 'image/heif'],
    heif: ['image/heif', 'image/heic'],
    webp: 'image/webp',
  },
  documents: {
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  video: {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
  },
  audio: {
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
  },
};
