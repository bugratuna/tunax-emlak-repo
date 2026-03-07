"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      disabled={disabled}
      className={`flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-medium transition
        ${active
          ? "bg-zinc-800 text-white"
          : "bg-transparent text-zinc-600 hover:bg-zinc-100"
        }
        disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/**
 * TipTap rich-text editor with bold, italic, H2, H3, bullet list, ordered list, hard break.
 * Outputs and accepts HTML strings compatible with RichTextRenderer.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "İlanı detaylı biçimde tanımlayın…",
  className = "",
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Treat empty editor as empty string
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[140px] focus:outline-none prose prose-sm prose-zinc max-w-none text-zinc-700 px-3 py-3",
      },
    },
  });

  // Sync external value changes (e.g. form reset) into editor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-300 bg-white transition focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-300 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <ToolbarButton
          title="Kalın (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          title="İtalik (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-zinc-200" />

        <ToolbarButton
          title="Başlık H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          title="Başlık H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-zinc-200" />

        <ToolbarButton
          title="Madde Listesi"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          ≡
        </ToolbarButton>

        <ToolbarButton
          title="Numaralı Liste"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-zinc-200" />

        <ToolbarButton
          title="Satır Sonu (Shift+Enter)"
          onClick={() => editor.chain().focus().setHardBreak().run()}
        >
          ↵
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="relative">
        {editor.isEmpty && (
          <p className="pointer-events-none absolute left-3 top-3 text-sm text-zinc-400 select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
