import { NextRequest, NextResponse } from "next/server";
import { createOctokit, verifyWebhookSignature } from "@/lib/github";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!(await verifyWebhookSignature(body, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload = JSON.parse(body);

  if (event === "pull_request" && payload.action === "opened") {
    const { pull_request, repository } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const headSha = pull_request.head.sha;
    const prNumber = pull_request.number;

    const octokit = createOctokit();

    const { data: checkRun } = await octokit.rest.checks.create({
      owner,
      repo,
      name: "recipe-1",
      head_sha: headSha,
      status: "in_progress",
    });

    await octokit.rest.actions.createWorkflowDispatch({
      owner: "runs-orchestration",
      repo: "recipes",
      workflow_id: "recipe-1.yml",
      ref: "main",
      inputs: {
        source_owner: owner,
        source_repo: repo,
        pr_number: String(prNumber),
        head_sha: headSha,
        check_run_id: String(checkRun.id),
      },
    });

    return NextResponse.json({ check_run_id: checkRun.id });
  }

  return NextResponse.json({ message: "Event ignored" }, { status: 200 });
}
