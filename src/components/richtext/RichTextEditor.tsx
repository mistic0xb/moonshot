import { useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ content, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    let updated = "";

    if (prefix === "- " || prefix === "1. ") {
      if (selected) {
        const lines = selected.split("\n");
        const formattedLines = lines.map(line => prefix + line);
        updated = content.slice(0, start) + formattedLines.join("\n") + content.slice(end);
      } else {
        updated = content.slice(0, start) + prefix + content.slice(end);
      }
    } else {
      updated = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    }

    onChange(updated);

    setTimeout(() => {
      if (textarea) {
        const newPosition = start + prefix.length + selected.length + suffix.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const applyHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    const hashes = "#".repeat(level);
    let updated = "";

    if (selected) {
      updated = content.slice(0, start) + `${hashes} ${selected}` + content.slice(end);
      onChange(updated);
    } else {
      updated = content.slice(0, start) + `${hashes} ` + content.slice(end);
      onChange(updated);
    }

    setTimeout(() => {
      if (textarea) {
        const newPosition = selected ? start + level + 1 + selected.length : start + level + 1;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const projectDescExample = `# Project Title
A brief description of what your project does...

## Features
- Feature 1: Describe key functionality
- Feature 2: Explain another major feature
- Feature 3: Highlight unique aspects
`;

  const ToolbarButton = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin hover:bg-black/40 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex gap-2">
          <ToolbarButton onClick={() => applyFormatting("**", "**")} title="Bold">
            <strong className="text-sm">B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => applyFormatting("_", "_")} title="Italic">
            <em className="text-sm">I</em>
          </ToolbarButton>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        <div className="flex gap-2">
          <ToolbarButton onClick={() => applyHeading(1)} title="Heading 1">
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => applyHeading(2)} title="Heading 2">
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => applyHeading(3)} title="Heading 3">
            H3
          </ToolbarButton>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        <div className="flex gap-2">
          <ToolbarButton onClick={() => applyFormatting("- ")} title="Bullet List">
            • List
          </ToolbarButton>
          <ToolbarButton onClick={() => applyFormatting("1. ")} title="Numbered List">
            1. List
          </ToolbarButton>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Markdown Editor
          </label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => onChange(e.target.value)}
            className="w-full min-h-[260px] rounded-2xl border border-white/10 bg-black/60 p-3.5 text-sm font-mono text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-bitcoin resize-y"
            placeholder={projectDescExample}
          />
        </div>

        {/* Preview */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Live Preview
          </label>
          <div className="min-h-[260px] rounded-2xl border border-white/10 bg-black/40 p-4 prose prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mt-3 mb-2 text-2xl font-bold text-white">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-3 mb-2 text-xl font-semibold text-white">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-2 mb-1 text-lg font-semibold text-white">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-gray-300">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc list-inside space-y-1 text-sm text-gray-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal list-inside space-y-1 text-sm text-gray-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-sm text-gray-300">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
              }}
            >
              {content || projectDescExample}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
