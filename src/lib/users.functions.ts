import { supabase } from "@/integrations/supabase/client";

export const listUsers = async () => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data ?? [];
};

export const inviteUser = async (data: { email: string; role?: string }) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: data.email,
  });
  if (error) throw error;
  return { success: true };
};

export const updateUserRole = async (data: { userId: string; role: string }) => {
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: data.userId, role: data.role });
  if (error) throw error;
  return { success: true };
};

export const deleteUser = async (data: { userId: string }) => {
  const { error } = await supabase.from("profiles").delete().eq("id", data.userId);
  if (error) throw error;
  return { success: true };
};
