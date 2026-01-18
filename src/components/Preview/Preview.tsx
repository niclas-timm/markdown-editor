import { memo, useMemo } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { useThemeStore } from '@/stores/themeStore';

interface PreviewProps {
  content: string;
  isVisible: boolean;
}

export const Preview = memo(function Preview({ content, isVisible }: PreviewProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  if (!isVisible) return null;

  const proseClasses = resolvedTheme === 'dark' ? 'prose prose-invert prose-sm' : 'prose prose-sm';

  return (
    <div className="flex-1 overflow-auto bg-editor-bg border-l border-editor-border">
      <article
        className={`${proseClasses} max-w-none p-8
          prose-headings:text-editor-text prose-headings:font-semibold
          prose-p:text-editor-text prose-p:leading-relaxed
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-editor-text prose-strong:font-semibold
          prose-code:text-pink-400 prose-code:bg-editor-active prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-editor-sidebar prose-pre:border prose-pre:border-editor-border
          prose-blockquote:border-l-blue-500 prose-blockquote:bg-editor-sidebar prose-blockquote:py-1
          prose-li:text-editor-text
          prose-hr:border-editor-border
          prose-table:text-editor-text
          prose-th:border-editor-border prose-th:bg-editor-sidebar
          prose-td:border-editor-border`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});
