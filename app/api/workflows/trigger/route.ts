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

  const octokit = createOctokit();
  let checkRunId: number | undefined;

  if (check_name && head_sha) {
    const { data: checkRun } = await octokit.rest.checks.create({
      owner,
      repo,
      name: check_name,
      head_sha,
      status: "in_progress",
    });
    checkRunId = checkRun.id;
  }

  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs: {
      ...inputs,
      ...(checkRunId && { check_run_id: String(checkRunId) }),
    },
  });

  return NextResponse.json({ check_run_id: checkRunId ?? null });
}
