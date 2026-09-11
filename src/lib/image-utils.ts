import { supabase } from "@/integrations/supabase/client";

/** Lê um arquivo de imagem e devolve um data URL redimensionado (JPEG/PNG leve). */
export async function fileToThumbnail(file: File, max = 480, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Arquivo de imagem inválido."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Converte base64/dataURL para Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/** Comprime a imagem e sobe direto para o bucket erp-media do Supabase */
export async function uploadImageToSupabase(
  file: File,
  folder: "products" | "filaments" | "logo"
): Promise<string> {
  const thumbDataUrl = await fileToThumbnail(file, 600, 0.85);
  const blob = dataUrlToBlob(thumbDataUrl);
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from("erp-media")
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

  if (error) {
    console.error("Erro upload Supabase:", error);
    throw error;
  }

  const { data } = supabase.storage.from("erp-media").getPublicUrl(path);
  return data.publicUrl;
}
