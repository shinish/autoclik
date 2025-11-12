/**
 * Compress an image file and convert to base64
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width of the compressed image (default: 200)
 * @param {number} maxHeight - Maximum height of the compressed image (default: 200)
 * @param {number} quality - JPEG quality (0.0 to 1.0, default: 0.6)
 * @returns {Promise<string>} Base64 encoded image string
 */
export async function compressImageToBase64(file, maxWidth = 200, maxHeight = 200, quality = 0.6) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', quality);

        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get the size of a base64 string in bytes
 * @param {string} base64 - Base64 encoded string
 * @returns {number} Size in bytes
 */
export function getBase64Size(base64) {
  const stringLength = base64.length - (base64.indexOf(',') + 1);
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return Math.round(sizeInBytes);
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "15.2 KB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
