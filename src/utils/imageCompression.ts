/**
 * Client-side image compression and resizing utility for Apps Script uploads.
 * Constrains max dimension to 1920px and converts to high-quality JPEG Base64.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number; // 0.0 - 1.0
  mimeType?: string;
}

export async function compressAndConvertToBase64(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 1920,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Calculate proportional scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            maxDimension;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original Base64 if canvas context fails
          resolve(reader.result as string);
          return;
        }

        // Fill white background for transparent PNG converted to JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('이미지 데이터를 읽는 중 오류가 발생했습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    };

    reader.readAsDataURL(file);
  });
}
