// lib/imageProcessor.ts
export type PostateeImageType = 'avatar' | 'cover' | 'post' | 'story';

const CONFIG = {
  avatar: { maxW: 300, quality: 0.6, maxKB: 80, square: true },
  cover: { maxW: 900, quality: 0.6, maxKB: 200, square: false },
  post: { maxW: 1080, quality: 0.7, maxKB: 350, square: false },
  story: { maxW: 720, quality: 0.6, maxKB: 300, square: false },
};

export async function processImage(file: File, type: PostateeImageType): Promise<string> {
  const cfg = CONFIG[type];

  const bitmap = await createImageBitmap(file);
  let { width: w, height: h } = bitmap;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (cfg.square) {
    // قص مربع للأفاتار
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;
    canvas.width = cfg.maxW;
    canvas.height = cfg.maxW;
    ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, cfg.maxW, cfg.maxW);
  } else {
    // تصغير مع الحفاظ على النسبة
    if (w > cfg.maxW) {
      h = (cfg.maxW / w) * h;
      w = cfg.maxW;
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap, 0, 0, w, h);
  }

  bitmap.close();

  // ضغط تدريجي لحد ما نصل للحجم المطلوب
  let quality = cfg.quality;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (dataUrl.length > cfg.maxKB * 1024 * 1.37 && quality > 0.15) {
    quality -= 0.05;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > 950000) {
    throw new Error(`الصورة كبيرة حتى بعد الضغط (${Math.round(dataUrl.length/1024)}KB)`);
  }

  console.log(`✅ ${type}: ${Math.round(dataUrl.length/1024)}KB - ${canvas.width}x${canvas.height} - جودة ${quality.toFixed(2)}`);
  return dataUrl;
}

// لمعالجة عدة صور بوست مرة واحدة
export async function processMultiple(files: FileList, type: PostateeImageType): Promise<string[]> {
  const promises = Array.from(files).slice(0, 4).map(f => processImage(f, type));
  return Promise.all(promises);
}