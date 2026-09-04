/**
 * Cache local (localStorage) para garantir que configurações da loja e fotos
 * (base64) nunca sumam ao recarregar a página ou navegar entre telas,
 * mesmo que o salvamento remoto falhe ou demore.
 */

const PREFIX = "visionflow:";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota cheia — ignora silenciosamente
  }
}

/** Configurações da loja (nome, telefone, pix, logo em base64...). */
export function readLocalSettings<T extends object>(): Partial<T> {
  return read<Partial<T>>("settings") ?? {};
}

export function writeLocalSettings(settings: object) {
  write("settings", settings);
}

type ImageMap = Record<string, string | null>;

/** Fotos por entidade ("filaments" | "products"), indexadas por id. */
export function readLocalImages(scope: string): ImageMap {
  return read<ImageMap>(`images:${scope}`) ?? {};
}

export function saveLocalImage(scope: string, id: string, dataUrl: string | null) {
  const map = readLocalImages(scope);
  if (dataUrl) map[id] = dataUrl;
  else delete map[id];
  write(`images:${scope}`, map);
}

export function removeLocalImage(scope: string, id: string) {
  saveLocalImage(scope, id, null);
}
