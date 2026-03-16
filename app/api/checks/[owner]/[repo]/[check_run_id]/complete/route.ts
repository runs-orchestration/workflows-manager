import { NextRequest, NextResponse } from "next/server";
import { createOctokit } from "@/lib/github";

interface CompleteCheckBody {
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required";
  summary?: string;
  details_url?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; check_run_id: string }> }
) {
  const { owner, repo, check_run_id } = await params;
  const body: CompleteCheckBody = await request.json();
  const { conclusion, summary, details_url } = body;

  if (!conclusion) {
    return NextResponse.json({ error: "Missing required field: conclusion" }, { status: 400 });
  }

  const octokit = createOctokit();

  const { data } = await octokit.rest.checks.update({
    owner,
    repo,
    check_run_id: Number(check_run_id),
    status: "completed",
    conclusion,
    ...(details_url && { details_url }),
    ...(summary && {
      output: {
        title: conclusion,
        summary,
      },
    }),
  });

  return NextResponse.json({ id: data.id, status: data.status, conclusion: data.conclusion });
}
