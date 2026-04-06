/**
 * Cloudinary service for uploading PDFs and images.
 * In a real app, you'd use signed uploads for security.
 * For this demo, we'll use an unsigned upload preset.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvywmbrql';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'pdf_upload';

export const uploadToCloudinary = async (file: File, resourceType: 'image' | 'raw' = 'raw') => {
  if (CLOUDINARY_CLOUD_NAME === 'demo') {
    console.warn('Cloudinary is not configured. Using demo account which might fail.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Upload failed');
  }
};
