import type { Area } from 'react-easy-crop';

/**
 * Creates an HTMLImageElement from a source URL.
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

/**
 * Returns the file type from a data URL or falls back to 'image/png'.
 */
function getRadianAngle(degree: number): number {
  return (degree * Math.PI) / 180;
}

/**
 * Rotates a canvas by the given angle around its center.
 */
function rotateSize(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops an image using Canvas API.
 * Returns a Blob of the cropped image in the original format (defaults to PNG).
 *
 * @param imageSrc - Object URL or data URL of the source image
 * @param cropArea - Pixel coordinates from react-easy-crop's onCropComplete
 * @param rotation - Optional rotation in degrees (default 0)
 */
export async function getCroppedImage(
  imageSrc: string,
  cropArea: Area,
  rotation: number = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate the bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // Set canvas size to the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate to center, rotate, and draw the image centered
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, bBoxWidth, bBoxHeight);
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Now extract the cropped region from the rotated canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Could not get 2D context from cropped canvas');
  }

  croppedCanvas.width = cropArea.width;
  croppedCanvas.height = cropArea.height;

  croppedCtx.drawImage(
    canvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/png',
      1,
    );
  });
}
