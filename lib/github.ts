import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { verify } from "@octokit/webhooks-methods";

export function createOctokit(): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!,
      installationId: process.env.GITHUB_INSTALLATION_ID!,
    },
  });
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  return verify(process.env.GITHUB_WEBHOOK_SECRET!, payload, signature);
}
