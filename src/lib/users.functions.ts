import { supabase } from "@/integrations/supabase/client";

export const listAppUsers = async () => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data ?? [];
};

export const createAppUser = async (data: { email: string; role?: string; name?: string }) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: data.email,
  });
  if (error) throw error;
  return { success: true };
};

export const updateAppUser = async (data: { userId: string; [key: string]: any }) => {
  const { userId, ...updates } = data;
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
  return { success: true };
};

export const setAppUserRole = async (data: { userId: string; role: string }) => {
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: data.userId, role: data.role });
  if (error) throw error;
  return { success: true };
};

export const deleteAppUser = async (data: { userId: string }) => {
  const { error } = await supabase.from("profiles").delete().eq("id", data.userId);
  if (error) throw error;
  return { success: true };
};
