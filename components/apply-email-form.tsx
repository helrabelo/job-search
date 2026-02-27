"use client";

import { useState } from "react";
import { useToast } from "@/components/toast-provider";
import type { Post } from "@/lib/types";

interface ApplyEmailFormProps {
  post: Post;
  onSent: (updated: Post) => void;
  onCancel: () => void;
}

function extractEmail(html: string): string {
  const match = html.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : "";
}

export function ApplyEmailForm({ post, onSent, onCancel }: ApplyEmailFormProps) {
  const { toast } = useToast();
  const [to, setTo] = useState(extractEmail(post.content));
  const [subject, setSubject] = useState(
    `Application — ${post.company ?? "Your Team"} — Hel Rabelo`
  );
  const [body, setBody] = useState("");
  const [attachResume, setAttachResume] = useState(true);
  const [sending, setSending] = useState(false);

  async function handleSend(dryRun = false) {
    if (!to || !subject || !body) {
      toast("Fill in all fields", { type: "error" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/apply-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          to,
          subject,
          body,
          attachResume,
          dryRun,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.message || "Failed to send email", { type: "error" });
        return;
      }

      if (dryRun) {
        toast("Dry run completed — email not sent", { type: "info" });
      } else {
        toast(`Email sent to ${to}`, { type: "success" });
        if (data.post) {
          onSent(data.post);
        }
      }
    } catch (err) {
      toast("Network error", { type: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-neutral-100 p-5">
      <h3 className="text-sm font-semibold text-neutral-700">Apply via Email</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">To</label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="hiring@company.com"
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Write your application message..."
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={attachResume}
          onChange={(e) => setAttachResume(e.target.checked)}
          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
        />
        Attach resume (Full-Stack PDF)
      </label>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => handleSend(false)}
          disabled={sending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
        <button
          onClick={() => handleSend(true)}
          disabled={sending}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
        >
          Dry Run
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:text-neutral-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
