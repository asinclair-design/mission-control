import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// POST /api/heartbeat - OpenClaw agents can call this to update their status
http.route({
  path: "/api/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { name, role, status, taskCount, currentTask, capabilities } = body;

    if (!name || !role) {
      return new Response(JSON.stringify({ error: "name and role required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(api.agents.upsertHeartbeat, {
      name,
      role,
      status: status || "active",
      taskCount: taskCount || 0,
      currentTask: currentTask || undefined,
      capabilities: capabilities || undefined,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// POST /api/event - Push events from OpenClaw cron jobs / agents
http.route({
  path: "/api/event",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { type, title, detail, priority } = body;

    if (!type || !title) {
      return new Response(JSON.stringify({ error: "type and title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(api.events.append, {
      type,
      title,
      detail: detail || "",
      priority: priority || "low",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// POST /api/chat - Push chat messages
http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentName, message } = body;

    if (!agentName || !message) {
      return new Response(JSON.stringify({ error: "agentName and message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(api.chat.send, {
      agentName,
      message,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// POST /api/lead - Capture emails from lead magnets (used by Texture Gallery)
http.route({
  path: "/api/lead",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");

    // Simple shared secret to prevent random spam writes.
    if (!process.env.LEADS_INGEST_SECRET || secret !== process.env.LEADS_INGEST_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const email = String(body?.email ?? "").trim();
    const name = body?.name ? String(body.name).trim() : undefined;
    const source = body?.source ? String(body.source).trim() : "mould-texture-gallery";
    const intent = body?.intent ? String(body.intent).trim() : "newsletter";
    const ts = body?.ts ? String(body.ts).trim() : undefined;

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ ok: false, error: "invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(api.leads.ingest, {
      email,
      name,
      source,
      intent,
      ts,
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// CORS preflight
http.route({
  path: "/api/heartbeat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/event",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/lead",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
