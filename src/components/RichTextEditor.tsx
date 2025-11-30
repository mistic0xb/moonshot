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

    let updated = "";

    if (selected) {
      const hashes = "#".repeat(level);
      updated = content.slice(0, start) + `${hashes} ${selected}` + content.slice(end);
    } else {
      const hashes = "#".repeat(level);
      updated = content.slice(0, start) + `${hashes} ` + content.slice(end);
    }

    onChange(updated);

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
      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 bg-blackish border border-sky-500/30 p-3 rounded-lg">
        {/* Text Formatting */}
        <div className="flex gap-2">
          <ToolbarButton onClick={() => applyFormatting("**", "**")} title="Bold">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => applyFormatting("_", "_")} title="Italic">
            <em>I</em>
          </ToolbarButton>
        </div>

        {/* Headings */}
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

        {/* Lists */}
        <div className="flex gap-2">
          <ToolbarButton onClick={() => applyFormatting("- ")} title="Bullet List">
            • List
          </ToolbarButton>
          <ToolbarButton onClick={() => applyFormatting("1. ")} title="Numbered List">
            1. List
          </ToolbarButton>
        </div>
      </div>

      {/* Editor and Preview Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div>
          <label className="block text-sky-300 font-semibold mb-2 text-sm">Markdown Editor</label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => onChange(e.target.value)}
            className="w-full min-h-[300px] bg-blackish border border-sky-500/30 text-white p-4 rounded-lg focus:outline-none focus:border-sky-400 resize-y font-mono text-sm"
            placeholder={projectDescExample}
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sky-300 font-semibold mb-2 text-sm">Live Preview</label>
          <div className="bg-blackish border border-sky-500/30 p-4 rounded-lg min-h-[300px] prose prose-invert max-w-none wrap-break-word overflow-wrap-anywhere">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-white mt-4 mb-3">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-white mt-4 mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold text-white mt-3 mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="text-gray-300 mb-4 list-disc list-inside space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-gray-300 mb-4 list-decimal list-inside space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
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
