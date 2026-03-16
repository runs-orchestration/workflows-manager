import { NextRequest, NextResponse } from "next/server";
import { createOctokit } from "@/lib/github";

interface TriggerBody {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs?: Record<string, string>;
  check_name?: string;
  head_sha?: string;
}

export async function POST(request: NextRequest) {
  const body: TriggerBody = await request.json();
  const { owner, repo, workflow_id, ref, inputs, check_name, head_sha } = body;

  if (!owner || !repo || !workflow_id || !ref) {
    return NextResponse.json(
      { error: "Missing required fields: owner, repo, workflow_id, ref" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const octokit = createOctokit();
  let checkRunId: number | undefined;
  let callbackUrl: string | undefined;

  if (check_name && head_sha) {
    const { data: checkRun } = await octokit.rest.checks.create({
      owner,
      repo,
      name: check_name,
      head_sha,
      status: "in_progress",
    });
    checkRunId = checkRun.id;
    callbackUrl = `${baseUrl}/api/checks/${owner}/${repo}/${checkRunId}/complete`;
  }

  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs: {
      ...inputs,
      ...(callbackUrl && { callback_url: callbackUrl }),
    },
  });

  return NextResponse.json({ check_run_id: checkRunId ?? null, callback_url: callbackUrl ?? null });
}
