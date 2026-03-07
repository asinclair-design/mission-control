import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Agents folder is copied into the project for deployment
const AGENTS_DIR = path.join(process.cwd(), "agents");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentName = searchParams.get("agent");
  const fileName = searchParams.get("file");

  if (!agentName || !fileName) {
    return NextResponse.json(
      { error: "Missing agent or file parameter" },
      { status: 400 }
    );
  }

  // Security: prevent directory traversal
  const sanitizedAgent = path.basename(agentName);
  const sanitizedFile = path.basename(fileName);
  
  const filePath = path.join(AGENTS_DIR, sanitizedAgent, sanitizedFile);
  
  // Ensure the path is within the agents directory
  if (!filePath.startsWith(AGENTS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ content: "" });
    }
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { agentName, fileName, content } = await request.json();

  if (!agentName || !fileName || content === undefined) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Security: prevent directory traversal
  const sanitizedAgent = path.basename(agentName);
  const sanitizedFile = path.basename(fileName);
  
  const agentDir = path.join(AGENTS_DIR, sanitizedAgent);
  const filePath = path.join(agentDir, sanitizedFile);
  
  // Ensure the path is within the agents directory
  if (!filePath.startsWith(AGENTS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    // Ensure agent directory exists
    await fs.mkdir(agentDir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
