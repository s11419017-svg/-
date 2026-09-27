/**
 * Utility to compress and resize uploaded images using HTML5 Canvas.
 * Prevents LocalStorage quota overflow (5MB limit) and ensures smooth rendering.
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<string> => {
  // 1. First try modern createImageBitmap (fastest, memory efficient, offscreen-safe)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw directly preserving natural image colors
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        // Export as JPEG with controlled quality
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        return canvas.toDataURL(mimeType, quality);
      }
      bitmap.close();
    } catch (bitmapErr) {
      console.warn('createImageBitmap failed, falling back to FileReader:', bitmapErr);
    }
  }

  // 2. Fallback to FileReader + HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Failed to read file as Data URL'));
        return;
      }

      const img = new Image();
      // Attach handlers before setting src
      img.onload = () => {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        // Calculate aspect ratio bounded by maxWidth & maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
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

        // Draw image onto canvas directly with true colors
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedBase64 = canvas.toDataURL(mimeType, quality);
          resolve(compressedBase64);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        // Return raw data url on image decode error so user can still see it
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

