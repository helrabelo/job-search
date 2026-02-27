import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const SEND_SCRIPT = path.join(
  process.env.HOME ?? "/Users/helrabelo",
  "code/tooling/email-sender/send.py"
);

const DEFAULT_RESUME = path.join(
  process.env.HOME ?? "/Users/helrabelo",
  "Documents/PDFs/HEL_RABELO_senior_software_engineer__fullstack.pdf"
);

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { postId, to, subject, body: emailBody, attachResume, resumePath, dryRun } = body;

  if (!to || !subject || !emailBody) {
    return NextResponse.json(
      { error: "to, subject, and body are required" },
      { status: 400 }
    );
  }

  const args = [
    SEND_SCRIPT,
    "--to", to,
    "--subject", subject,
    "--body", emailBody,
  ];

  if (attachResume) {
    args.push("--attachment", resumePath || DEFAULT_RESUME);
  }

  if (dryRun) {
    args.push("--dry-run");
  }

  try {
    const { stdout, stderr } = await execFileAsync("python3", args, {
      timeout: 30000,
    });

    // Update post status to applied
    if (postId && !dryRun) {
      db.prepare(
        "UPDATE posts SET status = 'applied', applied_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
      ).run(postId);
    }

    const updated = postId
      ? db.prepare("SELECT * FROM posts WHERE id = ?").get(postId)
      : null;

    return NextResponse.json({
      success: true,
      dryRun: !!dryRun,
      output: stdout || stderr,
      post: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to send email",
        message: err.message,
        stderr: err.stderr,
      },
      { status: 500 }
    );
  }
}
