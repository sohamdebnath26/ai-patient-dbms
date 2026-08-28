import type { ReactNode } from "react";

interface InlineToken {
  type: "text" | "strong" | "em" | "code";
  value: string;
}

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**") || token.startsWith("__")) {
      tokens.push({ type: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("`")) {
      tokens.push({ type: "code", value: token.slice(1, -1) });
    } else {
      tokens.push({ type: "em", value: token.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = tokenizeInline(text);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case "strong":
        return (
          <strong key={key} className="font-semibold text-gray-900">
            {token.value}
          </strong>
        );
      case "em":
        return (
          <em key={key} className="italic">
            {token.value}
          </em>
        );
      case "code":
        return (
          <code
            key={key}
            className="bg-surface-200 rounded border border-gray-200 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {token.value}
          </code>
        );
      default:
        return <span key={key}>{token.value}</span>;
    }
  });
}

function isOrderedListItem(line: string): boolean {
  return /^\d+[.)]\s+/.test(line.trimStart());
}

function isUnorderedListItem(line: string): boolean {
  return /^[-*+]\s+/.test(line.trimStart());
}

/**
 * Renders a small, safe subset of Markdown as React elements:
 * headings (#..####), unordered/ordered lists, code fences, and
 * inline **bold**, *italic*, and `code`. No raw HTML is ever
 * injected, so AI output cannot introduce XSS.
 */
export function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line) {
      i += 1;
      continue;
    }

    // Code fence
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push(
        <pre
          key={`block-${key++}`}
          className="bg-surface-100 my-2 overflow-x-auto rounded-md border border-gray-200 p-3 font-mono text-[0.85em] whitespace-pre-wrap"
        >
          {codeLines.join("\n")}
        </pre>,
      );
      continue;
    }

    // Headings
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const sizes = ["text-base", "text-[0.95em]", "text-[0.9em]", "text-[0.85em]"];
      const cls = sizes[level - 1] ?? "text-[0.85em]";
      blocks.push(
        <p key={`block-${key++}`} className={`my-1 font-semibold text-gray-900 ${cls}`}>
          {renderInline(text, `h-${key}`)}
        </p>,
      );
      i += 1;
      continue;
    }

    // Unordered list
    if (isUnorderedListItem(line)) {
      const items: string[] = [];
      while (i < lines.length && isUnorderedListItem(lines[i])) {
        items.push(lines[i].trimStart().replace(/^[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`block-${key++}`} className="my-1 list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (isOrderedListItem(line)) {
      const items: string[] = [];
      while (i < lines.length && isOrderedListItem(lines[i])) {
        items.push(lines[i].trimStart().replace(/^\d+[.)]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`block-${key++}`} className="my-1 list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (group consecutive plain lines)
    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i] &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !lines[i].trimStart().startsWith("```") &&
      !isUnorderedListItem(lines[i]) &&
      !isOrderedListItem(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }

    blocks.push(
      <p key={`block-${key++}`} className="my-1">
        {renderInline(para.join(" "), `p-${key}`)}
      </p>,
    );
  }

  if (blocks.length === 0) {
    return <span>{content}</span>;
  }

  return <div className="text-inherit">{blocks}</div>;
}
