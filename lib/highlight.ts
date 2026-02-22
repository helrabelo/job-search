import { type ReactNode, createElement } from "react";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(keywords: string[]): RegExp | null {
  if (keywords.length === 0) return null;
  const pattern = keywords.map(escapeRegex).join("|");
  return new RegExp(`(${pattern})`, "gi");
}

export function highlightText(
  text: string,
  keywords: string[]
): ReactNode[] {
  const regex = buildKeywordRegex(keywords);
  if (!regex) return [text];

  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return createElement(
        "mark",
        { key: i, className: "bg-yellow-200 rounded px-0.5" },
        part
      );
    }
    return part;
  });
}

export function highlightHtmlContent(
  container: HTMLElement,
  keywords: string[]
): void {
  const regex = buildKeywordRegex(keywords);
  if (!regex) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.nodeValue && regex.test(node.nodeValue)) {
      regex.lastIndex = 0;
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue!;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }
      const mark = document.createElement("mark");
      mark.className = "bg-yellow-200 rounded px-0.5";
      mark.textContent = match[0];
      fragment.appendChild(mark);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}
