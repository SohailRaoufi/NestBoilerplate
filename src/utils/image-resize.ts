import { UnprocessableException } from '@/common/exceptions/unprocessable';
import * as sharp from 'sharp';

/**
 * Resize an image using Sharp
 * @param buffer The original image buffer
 * @param width The desired width for the resized image
 * @param height Optional height (maintains aspect ratio if not provided)
 * @returns The resized image buffer
 */
export async function resizeImage(
  buffer: Buffer,
  width: number,
  height?: number,
): Promise<Buffer> {
  try {
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'cover' }) // Resize to the given width and height
      .toBuffer();
    return resizedBuffer;
  } catch {
    throw new UnprocessableException({
      message: 'Failed to resize image.',
      field: 'photo',
    });
  }
}
