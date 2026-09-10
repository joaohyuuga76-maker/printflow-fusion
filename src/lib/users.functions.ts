import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "operador";
  createdAt: string;
}

async function assertAdmin(context: { supabase: SupabaseClient; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito a administradores.");
}

export const listAppUsers = createServerFn({ method: "GET" })
  .handler(async ({ context }): Promise<AppUser[]> => {
    if (context) await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = list.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    return list.users.map((u) => {
      const userRoles = (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role);
      return {
        id: u.id,
        email: u.email ?? "",
        fullName:
          (profiles ?? []).find((p) => p.id === u.id)?.full_name ??
          (u.user_metadata?.["full_name"] as string | undefined) ??
          "",
        role: userRoles.includes("admin") ? "admin" : "operador",
        createdAt: u.created_at,
      };
    });
  });

export const createAppUser = createServerFn({ method: "POST" })
  .validator(
    (input: { email: string; password: string; fullName: string; role: "admin" | "operador" }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    if (context) await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar usuário.");
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.fullName }, { onConflict: "id" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleError) throw new Error(roleError.message);
    return { id: created.user.id };
  });

export const updateAppUser = createServerFn({ method: "POST" })
  .validator(
    (input: {
      userId: string;
      email: string;
      fullName: string;
      role: "admin" | "operador";
      password?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    if (context) await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const attrs: { email?: string; password?: string; user_metadata: { full_name: string } } = {
      user_metadata: { full_name: data.fullName },
    };
    if (data.email.trim()) attrs.email = data.email.trim().toLowerCase();
    if (data.password && data.password.length >= 4) attrs.password = data.password;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ...attrs,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: data.userId, full_name: data.fullName }, { onConflict: "id" });

    const isSelf = data.userId === (context as { userId?: string })?.userId;
    if (isSelf && data.role !== "admin") {
      throw new Error("Você não pode remover o próprio acesso de administrador.");
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (roleError) throw new Error(roleError.message);
    return { ok: true };
  });

export const setAppUserRole = createServerFn({ method: "POST" })
  .validator((input: { userId: string; role: "admin" | "operador" }) => input)
  .handler(async ({ data, context }) => {
    if (context) await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.userId === (context as { userId?: string })?.userId && data.role !== "admin") {
      throw new Error("Você não pode remover o próprio acesso de administrador.");
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (roleError) throw new Error(roleError.message);
    return { ok: true };
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .validator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    if (context) await assertAdmin(context as never);
    if (data.userId === (context as { userId?: string })?.userId) {
      throw new Error("Você não pode excluir o próprio usuário.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
