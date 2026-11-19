import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { maskEmail } from "@/lib/security";
import { err, ok, type Result } from "@/types/result";

export interface TransactionalEmailInput {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<Result<{ id: string }, string>> {
  const env = getServerEnv();
  const client = getResendClient();

  if (!client) {
    console.info("[email:dev-noop]", {
      to: maskEmail(input.to),
      subject: input.subject,
    });
    return ok({ id: "dev-noop" });
  }

  try {
    const response = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (response.error) {
      return err(response.error.message || "Email provider error");
    }

    return ok({ id: response.data?.id ?? "sent" });
  } catch {
    return err("Failed to dispatch transactional email");
  }
}
