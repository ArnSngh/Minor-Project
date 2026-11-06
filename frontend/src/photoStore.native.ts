import { File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

export async function savePhoto(asset: ImagePickerAsset, id: string): Promise<string> {
  const ext = asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const destination = new File(Paths.document, `listing-${id}.${ext}`);
  await new File(asset.uri).copy(destination);
  return destination.uri;
}
export async function photoBase64(ref: string): Promise<string> { return new File(ref).base64(); }
export async function photoPreview(ref: string): Promise<string> { return ref; }
export async function deletePhoto(ref: string): Promise<void> { const f = new File(ref); if (f.exists) f.delete(); }
