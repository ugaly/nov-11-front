export const MAX_ATTACHMENT_DATA_URL_BYTES = 4 * 1024 * 1024;

export function newAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function fileToDataUrlAttachment(
  file: File
): Promise<{ id: string; name: string; mimeType: string; uploadedAt: string; dataUrl: string }> {
  if (file.size > MAX_ATTACHMENT_DATA_URL_BYTES) {
    throw new Error(
      `File is too large (max ${Math.round(MAX_ATTACHMENT_DATA_URL_BYTES / (1024 * 1024))} MB).`
    );
  }
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: newAttachmentId(),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
}
