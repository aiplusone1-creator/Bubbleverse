export async function validateCharacterPhoto(file: File) {
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error('Choose a photo smaller than 10 MB.');
  }
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!((png && file.type === 'image/png') || (jpeg && file.type === 'image/jpeg'))) {
    throw new Error('Choose a valid PNG or JPG photo.');
  }
}

// Client feedback only. Private storage must independently validate and normalize uploads.
export async function readCharacterPhoto(file: File): Promise<string> {
  await validateCharacterPhoto(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('This photo could not be opened. Please choose another.'); }
  try {
    if (bitmap.width * bitmap.height > 24000000) throw new Error('Choose a photo with at most 24 megapixels.');
  } finally { bitmap.close(); }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result) : reject(new Error('This photo could not be read.'));
    reader.onerror = () => reject(new Error('This photo could not be read.'));
    reader.readAsDataURL(file);
  });
}
