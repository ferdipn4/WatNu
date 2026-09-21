/** Cap uploaded images at this width so phone photos stay well under the 4 MB ingest limit. */
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.9;

export type ResizedImage = {
  /** Base64 payload without the `data:` prefix. */
  base64: string;
  mediaType: "image/jpeg";
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode that image."));
    image.src = src;
  });
}

/** Resizes an image file to at most `MAX_WIDTH` wide and re-encodes it as JPEG. */
export async function resizeImageFile(file: File): Promise<ResizedImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser cannot resize images.");
  }
  context.drawImage(image, 0, 0, width, height);

  const resizedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = resizedDataUrl.slice(resizedDataUrl.indexOf(",") + 1);

  return { base64, mediaType: "image/jpeg" };
}
