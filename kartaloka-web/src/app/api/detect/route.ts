/**
 * Next.js API route — proxies image to the Python FastAPI inference server.
 *
 * POST /api/detect
 *   Body: FormData  { file: Blob, conf?: string }
 *
 * Returns the same DetectResponse JSON from the Python server.
 *
 * Set CV_API_URL in .env.local to override the default:
 *   CV_API_URL=http://localhost:8000
 */

import { NextRequest, NextResponse } from "next/server";

const CV_API_URL = process.env.CV_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const conf = formData.get("conf") ?? "0.4";

  let upstream: Response;
  try {
    upstream = await fetch(`${CV_API_URL}/detect?conf=${conf}`, {
      method: "POST",
      body: formData,
    });
  } catch {
    return NextResponse.json(
      { error: "CV server unreachable. Start: uvicorn ml.api.server:app --port 8000" },
      { status: 503 }
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
