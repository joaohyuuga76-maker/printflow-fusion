import { supabase } from "@/integrations/supabase/client";

/**
 * PDV / Operadores internos.
 * Login é validado diretamente na tabela pública `operadores` (sem supabase.auth).
 * A sessão do operador fica salva em localStorage e todos os operadores
 * compartilham os mesmos dados da loja (workspace único abaixo).
 */
export const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const STORAGE_KEY = "printflow:operador";

export type Cargo = "admin" | "operador";

export interface OperatorSession {
  id: string;
  nome: string;
  usuario: string;
  cargo: Cargo;
}

export function getOperator(): OperatorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OperatorSession) : null;
  } catch {
    return null;
  }
}

export function setOperator(op: OperatorSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(op));
}

export function clearOperator() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Valida usuário + PIN buscando na tabela `operadores`
 * (usuario = input, pin = input, ativo = true). Retorna a sessão ou null.
 */
export async function loginOperator(
  usuario: string,
  pin: string,
): Promise<OperatorSession | null> {
  const u = usuario.trim().toLowerCase();
  const p = pin.trim();

  const { data, error } = await supabase
    .from("operadores")
    .select("id, nome, usuario, cargo, ativo, pin")
    .eq("usuario", u)
    .eq("pin", p)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const cargoNorm = String(data.cargo ?? "").trim().toLowerCase();
  const session: OperatorSession = {
    id: data.id as string,
    nome: data.nome as string,
    usuario: data.usuario as string,
    cargo: cargoNorm === "admin" ? "admin" : "operador",
  };
  setOperator(session);
  return session;
}
