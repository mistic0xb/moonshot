/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Props {
  content: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ content, onChange }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ],
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
  ];

  const QuillEditor = ReactQuill as any;
  return (
    <div className="space-y-3">
      {/* Toggle button for mobile */}
      <div className="lg:hidden flex justify-end">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:border-bitcoin/60 hover:text-bitcoin hover:bg-black/40 transition-colors"
        >
          {showPreview ? "Show Editor" : "Show Preview"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className={showPreview ? "hidden lg:block" : ""}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
            Rich Text Editor
          </label>
          <div className="quill-wrapper h-100 flex flex-col">
            <QuillEditor
              theme="snow"
              value={content}
              onChange={onChange}
              modules={modules}
              formats={formats}
              placeholder="Start writing your project description..."
              className="flex-1"
            />
          </div>
        </div>

        {/* Preview */}
        <div className={!showPreview ? "hidden lg:block" : ""}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
            Live Preview
          </label>
          <div className="rounded border border-white/10 bg-black/40 p-4 h-100 overflow-y-auto scrollbar-thin">
            {/* Rich Text Viewer */}
            <div
              className="rich-text-viewer"
              dangerouslySetInnerHTML={{
                __html:
                  content || '<p class="text-gray-500 italic">Your preview will appear here...</p>',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
