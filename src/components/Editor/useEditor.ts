import { useEffect, useRef, useCallback } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { searchKeymap } from '@codemirror/search';
import { useThemeStore } from '@/stores/themeStore';

const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#1e1e1e',
    },
    '.cm-content': {
      caretColor: '#1e1e1e',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#1e1e1e',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: '#add6ff',
      },
    '.cm-gutters': {
      backgroundColor: '#f3f3f3',
      color: '#6e6e6e',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#e4e4e4',
    },
    '.cm-activeLine': {
      backgroundColor: '#f5f5f5',
    },
  },
  { dark: false }
);

interface UseEditorOptions {
  onChange: (content: string) => void;
  onSave: () => void;
}

export function useEditor({ onChange, onSave }: UseEditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());

  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSave();
          return true;
        },
      },
    ]);

    const initialTheme = useThemeStore.getState().resolvedTheme;

    const state = EditorState.create({
      doc: '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown({
          base: markdownLanguage,
          codeLanguages: languages,
        }),
        themeCompartment.current.of(
          initialTheme === 'dark' ? oneDark : lightTheme
        ),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        saveKeymap,
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '14px',
            lineHeight: '1.6',
          },
          '.cm-content': {
            padding: '16px 0',
          },
          '.cm-line': {
            padding: '0 16px',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [onChange, onSave]);

  // Update CodeMirror theme when resolvedTheme changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(
          resolvedTheme === 'dark' ? oneDark : lightTheme
        ),
      });
    }
  }, [resolvedTheme]);

  // Update content when file changes
  const setContent = useCallback((content: string) => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
        });
      }
    }
  }, []);

  const getContent = useCallback(() => {
    return viewRef.current?.state.doc.toString() || '';
  }, []);

  const focus = useCallback(() => {
    viewRef.current?.focus();
  }, []);

  return {
    containerRef,
    setContent,
    getContent,
    focus,
  };
}
