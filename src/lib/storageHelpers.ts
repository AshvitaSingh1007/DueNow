import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Uploads a file to Firebase Storage under the appropriate path hierarchy,
 * performing client-side validations on size and mime-types.
 */
export async function uploadFile(
  userId: string,
  category: 'avatars' | 'documents' | 'workspace-assets' | 'voice',
  file: File,
  onProgress?: UploadProgressCallback,
  maxSizeMB = 10
): Promise<UploadResult> {
  if (!userId) {
    throw new Error('User authentication is required for uploads.');
  }

  // 1. Validate file size (default max 10MB)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed limit of ${maxSizeMB}MB.`);
  }

  // 2. Validate MIME types based on expected directory categorization
  if (category === 'avatars' && !file.type.startsWith('image/')) {
    throw new Error('Avatar upload must be an image type file (e.g., JPEG, PNG, SVG).');
  }
  if (category === 'voice' && !file.type.startsWith('audio/') && !file.name.endsWith('.webm') && !file.name.endsWith('.wav')) {
    throw new Error('Voice capture must be an audio type file (e.g., MP3, WAV, WEBM).');
  }

  // Sanitize file name to prevent injection/escaping in paths
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `users/${userId}/${category}/${Date.now()}_${cleanFileName}`;
  const fileRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('[StorageHelper] Upload failed:', error);
        let userFriendlyMsg = 'Upload failed. Please check your network and try again.';
        if (error.code === 'storage/unauthorized') {
          userFriendlyMsg = 'Permission denied. You do not have access to upload to this location.';
        } else if (error.code === 'storage/canceled') {
          userFriendlyMsg = 'Upload was canceled.';
        }
        reject(new Error(userFriendlyMsg));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: storagePath
          });
        } catch (err: any) {
          reject(new Error(`Failed to retrieve download URL: ${err.message}`));
        }
      }
    );
  });
}
