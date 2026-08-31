"use client";

export type ResizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/webp" | "image/jpeg";
};

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_OUTPUT_TYPE = "image/webp";

export async function resizeImageFile(
  file: File,
  options: ResizeImageOptions = {}
): Promise<File> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const outputType = options.outputType ?? DEFAULT_OUTPUT_TYPE;

  if (!file.type.startsWith("image/")) {
    throw new Error("არჩეული ფაილი ფოტო არ არის.");
  }

  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxHeight / bitmap.height
    );

    const targetWidth = Math.max(
      1,
      Math.round(bitmap.width * scale)
    );

    const targetHeight = Math.max(
      1,
      Math.round(bitmap.height * scale)
    );

    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("ფოტოს დამუშავება ვერ მოხერხდა.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      bitmap,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const blob = await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(
                new Error(
                  "ფოტოს შეკუმშვა ვერ მოხერხდა."
                )
              );
            }
          },
          outputType,
          quality
        );
      }
    );

    const baseName =
      file.name.replace(/\.[^/.]+$/, "") || "image";

    const extension =
      outputType === "image/webp"
        ? "webp"
        : "jpg";

    return new File(
      [blob],
      `${baseName}.${extension}`,
      {
        type: outputType,
        lastModified: Date.now(),
      }
    );
  } finally {
    bitmap.close();
  }
}