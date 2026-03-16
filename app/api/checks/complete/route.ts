import { NextRequest, NextResponse } from "next/server";
import { createOctokit } from "@/lib/github";

interface CompleteCheckBody {
  owner: string;
  repo: string;
  check_run_id: number;
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required";
  summary?: string;
  details_url?: string;
}

export async function POST(request: NextRequest) {
  const body: CompleteCheckBody = await request.json();
  const { owner, repo, check_run_id, conclusion, summary, details_url } = body;

  if (!owner || !repo || !check_run_id || !conclusion) {
    return NextResponse.json(
      { error: "Missing required fields: owner, repo, check_run_id, conclusion" },
      { status: 400 }
    );
  }

  const octokit = createOctokit();

  const { data } = await octokit.rest.checks.update({
    owner,
    repo,
    check_run_id,
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
