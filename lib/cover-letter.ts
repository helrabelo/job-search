import Anthropic from "@anthropic-ai/sdk";
import { stripHtml } from "./parser";

const SYSTEM_PROMPT = `You are writing a cover letter for Hel Rabelo, a Senior Frontend Developer with 11+ years of experience transitioning to Full-Stack / System Architecture roles.

Key facts about Hel:
- Brazilian, fluent in English (not native — prefers informal, straightforward tone)
- Currently Senior Lead Developer at Planetary (digital agency) — clients include Din Tai Fung, The Well, Burlington, Dow Jones
- Also indie hacker (Helsky Labs) — published apps like DropVox, Days as Numbers
- Core stack: React, Next.js, TypeScript, Node.js — expanding into backend, system design, infrastructure
- Portfolio: helrabelo.dev | GitHub: github.com/helrabelo | LinkedIn: linkedin.com/in/helrabelo

Writing voice:
- Conversational but professional — never corporate-speak
- Self-deprecating humor where appropriate
- Direct and honest — no hedging or buzzwords
- Short paragraphs, punch where it counts
- Shows genuine enthusiasm when something resonates

The cover letter should:
1. Open with why this specific role/company caught their attention
2. Connect their experience to what the company needs
3. Be 3-4 paragraphs max, under 300 words
4. End with a clear, non-generic closing
5. Never use "I'm excited to apply" or similar filler
6. Sound like a real person wrote it, not AI`;

export async function generateCoverLetter(
  postContent: string,
  companyName: string | null
): Promise<string> {
  const client = new Anthropic();
  const plainText = stripHtml(postContent);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write a cover letter for this job posting:\n\nCompany: ${companyName ?? "Unknown"}\n\nPosting:\n${plainText}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }
  return "Failed to generate cover letter.";
}
