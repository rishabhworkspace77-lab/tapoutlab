// src/utils/profile.ts
import { supabase } from "../supabaseClient";

export async function fetchOrCreateProfile(userId: string) {
  // Try to fetch an existing profile
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Error other than "no rows found"
  if (error && error.code !== "PGRST116") {
    console.error("Profile fetch error:", error);
    return null;
  }

  // Row exists → return it
  if (data) {
    return data;
  }

  // Create a default profile
  const defaultProfile = {
    id: userId,
    username: "New User",
    data: {
      age: null,
      email: null,
      phone: null,
      weightKg: null,
      heightFt: null,
      targetWeight: null,
      dietType: "balanced",
    },
  };

  const { data: created, error: createErr } = await supabase
    .from("profiles")
    .insert(defaultProfile)
    .select()
    .single();

  if (createErr) {
    console.error("Profile creation error:", createErr);
    return null;
  }

  return created;
}
