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
import { useSettingsStore } from '@/stores/settingsStore';
import type { EditorWidth } from '@/types';

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

function getWidthTheme(editorWidth: EditorWidth) {
  if (editorWidth === 'prose') {
    return EditorView.theme({
      '.cm-content': {
        maxWidth: '80ch',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    });
  }
  return EditorView.theme({
    '.cm-content': {
      maxWidth: 'none',
      marginLeft: '0',
      marginRight: '0',
    },
  });
}

interface UseEditorOptions {
  onChange: (content: string) => void;
  onSave: () => void;
}

export function useEditor({ onChange, onSave }: UseEditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const fontCompartment = useRef(new Compartment());
  const widthCompartment = useRef(new Compartment());

  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const settings = useSettingsStore((state) => state.settings);

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
    const initialSettings = useSettingsStore.getState().settings;

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
        fontCompartment.current.of(
          EditorView.theme({
            '.cm-scroller': {
              fontFamily: initialSettings.fontFamily,
              fontSize: `${initialSettings.fontSize}px`,
              lineHeight: '1.6',
            },
          })
        ),
        widthCompartment.current.of(getWidthTheme(initialSettings.editorWidth)),
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

  // Update CodeMirror font settings when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontCompartment.current.reconfigure(
          EditorView.theme({
            '.cm-scroller': {
              fontFamily: settings.fontFamily,
              fontSize: `${settings.fontSize}px`,
              lineHeight: '1.6',
            },
          })
        ),
      });
    }
  }, [settings.fontSize, settings.fontFamily]);

  // Update CodeMirror width when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: widthCompartment.current.reconfigure(
          getWidthTheme(settings.editorWidth)
        ),
      });
    }
  }, [settings.editorWidth]);

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
