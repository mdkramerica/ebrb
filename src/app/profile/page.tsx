import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/profile");

  const [profileResult, sessionsResult, achievementsResult, conversationsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),

    // Include V2 intent field
    supabase
      .from("sessions")
      .select("id, created_at, job_posting, tone, context, intent")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),

    // Modular achievement library (V2)
    getSupabaseAdmin()
      .from("modular_achievements")
      .select("id, content, role_context, tags, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),

    // Guided chat sessions (V2)
    getSupabaseAdmin()
      .from("conversations")
      .select("id, intent, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <ProfileClient
      user={user}
      profile={profileResult.data}
      sessions={sessionsResult.data || []}
      achievements={achievementsResult.data || []}
      conversations={conversationsResult.data || []}
    />
  );
}
