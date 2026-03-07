"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface Props {
  html: string;
  className?: string;
}

/** Allowed tags and attributes for description HTML (TipTap output). */
const ALLOWED_TAGS = [
  "p", "strong", "em", "b", "i",
  "h2", "h3", "ul", "ol", "li",
  "br", "span",
];
const ALLOWED_ATTR = ["class"];

/**
 * Safely renders rich-text HTML descriptions.
 * Falls back to whitespace-pre-line plain text for legacy non-HTML content.
 * Must be a client component — DOMPurify requires the browser DOM.
 */
export function RichTextRenderer({ html, className = "" }: Props) {
  const isHtml = html.trimStart().startsWith("<");

  const sanitized = useMemo(() => {
    if (!isHtml) return null;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      KEEP_CONTENT: true,
    });
  }, [html, isHtml]);

  if (!isHtml) {
    return (
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-zinc-700 ${className}`}
      >
        {html}
      </p>
    );
  }

  return (
    <div
      className={`prose prose-sm prose-zinc max-w-none text-zinc-700
        prose-headings:font-semibold prose-headings:text-zinc-800
        prose-h2:text-base prose-h3:text-sm
        prose-strong:text-zinc-800 prose-em:text-zinc-600
        prose-ul:list-disc prose-ol:list-decimal
        prose-li:my-0.5 prose-p:my-1
        ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized! }}
    />
  );
}
