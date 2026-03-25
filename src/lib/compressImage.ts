export async function compressImage(
  file: File,
  maxSizeBytes: number = 3.5 * 1024 * 1024
): Promise<File> {
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const quality = 0.85;

      const scaleFactor = Math.sqrt(maxSizeBytes / file.size);
      width = Math.floor(width * scaleFactor);
      height = Math.floor(height * scaleFactor);

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const attemptCompression = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            if (blob.size <= maxSizeBytes || q <= 0.3) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              attemptCompression(q - 0.1);
            }
          },
          'image/jpeg',
          q
        );
      };

      attemptCompression(quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };

    img.src = url;
  });
}
