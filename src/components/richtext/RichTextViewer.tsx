interface Props {
  content: string;
}

function RichTextViewer({ content }: Props) {
  return (
    <div 
      className="rich-text-viewer prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default RichTextViewer;