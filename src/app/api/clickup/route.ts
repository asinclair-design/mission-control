import { NextRequest, NextResponse } from "next/server";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// Helper to get ClickUp API key from environment
function getApiKey(): string {
  const key = process.env.CLICKUP_API_KEY;
  if (!key) {
    throw new Error("CLICKUP_API_KEY not configured");
  }
  return key;
}

// GET /api/clickup/tasks - Fetch tasks from ClickUp
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    const teamId = searchParams.get("teamId");
    const spaceId = searchParams.get("spaceId");

    const apiKey = getApiKey();
    const headers = {
      Authorization: apiKey,
      "Content-Type": "application/json",
    };

    // If listId provided, fetch tasks from that list
    if (listId) {
      const response = await fetch(
        `${CLICKUP_API_BASE}/list/${listId}/task?include_closed=true`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: `ClickUp API error: ${error}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // If teamId provided, fetch teams and spaces
    if (teamId) {
      const response = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/space`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: `ClickUp API error: ${error}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Default: fetch all teams
    const response = await fetch(`${CLICKUP_API_BASE}/team`, { headers });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `ClickUp API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ClickUp API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/clickup/sync - Sync ClickUp tasks to Convex
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, convexUrl } = body;

    if (!listId) {
      return NextResponse.json(
        { error: "listId is required" },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();
    const headers = {
      Authorization: apiKey,
      "Content-Type": "application/json",
    };

    // Fetch tasks from ClickUp
    const response = await fetch(
      `${CLICKUP_API_BASE}/list/${listId}/task?include_closed=true`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `ClickUp API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform ClickUp tasks to our format
    const tasks = data.tasks.map((task: any) => ({
      externalId: task.id,
      title: task.name,
      description: task.description || "",
      status: mapClickUpStatus(task.status?.status),
      tags: task.tags?.map((t: any) => t.name) || [],
    }));

    // If convexUrl provided, sync to Convex
    if (convexUrl) {
      const convexResponse = await fetch(`${convexUrl}/api/clickup/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      if (!convexResponse.ok) {
        const error = await convexResponse.text();
        return NextResponse.json(
          { error: `Convex sync error: ${error}`, tasks },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        synced: tasks.length,
        tasks,
      });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("ClickUp sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Map ClickUp status to our status
function mapClickUpStatus(status?: string): string {
  if (!status) return "Inbox";
  
  const statusMap: Record<string, string> = {
    "to do": "Inbox",
    "in progress": "In Progress",
    "in review": "Review",
    "review": "Review",
    "waiting": "Waiting",
    "blocked": "Waiting",
    "done": "Done",
    "complete": "Done",
    "completed": "Done",
    "assigned": "Assigned",
  };

  return statusMap[status.toLowerCase()] || "Inbox";
}
