import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webPush from "npm:web-push";

interface FilterInput {
  player_ids?: string[];
  team_category?: string;
  makgora_team_id?: string;
  position?: string;
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  filters?: FilterInput;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { title, body, data, filters } = (await req.json()) as PushPayload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);

    let vapidPublicKey = Deno.env.get("VITE_VAPID_PUBLIC_KEY");
    let vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail = "admin@orcosnegros.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      const { data: keys } = await client
        .from("club_config")
        .select("key, value")
        .eq("team_category", "orcos")
        .in("key", ["vapid_public_key", "vapid_private_key"]);
      if (keys) {
        for (const k of keys) {
          if (k.key === "vapid_public_key" && !vapidPublicKey) vapidPublicKey = k.value;
          if (k.key === "vapid_private_key" && !vapidPrivateKey) vapidPrivateKey = k.value;
        }
      }
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured. Set VAPID_PRIVATE_KEY in Edge Function secrets or club_config." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    webPush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey,
    );

    let query = client.from("push_tokens").select("token, player_id");
    if (filters?.player_ids && filters.player_ids.length > 0) {
      query = query.in("player_id", filters.player_ids);
    }
    if (filters?.team_category) query = query.eq("team_category", filters.team_category);
    if (filters?.makgora_team_id) query = query.eq("makgora_team_id", filters.makgora_team_id);
    if (filters?.position) query = query.eq("position", filters.position);

    const { data: tokens, error: queryError } = await query;
    if (queryError) throw queryError;
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No tokens matched" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const row of tokens) {
      try {
        const subscription = JSON.parse(row.token);
        await webPush.sendNotification(subscription, JSON.stringify({
          title,
          body,
          data: data || {},
          icon: "/assets/orcos_logo.png",
          badge: "/assets/orcos_logo.png",
        }));
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("410") || msg.includes("unsubscribed") || msg.includes("not found")) {
          await client.from("push_tokens").delete().eq("token", row.token);
        } else {
          errors.push(msg);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
