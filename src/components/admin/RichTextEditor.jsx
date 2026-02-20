import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeRichTextHtml } from '../../lib/richText';

function toolbarButtonClass(isCompact = false) {
  return `px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors ${isCompact ? 'min-w-[30px]' : ''}`;
}

const BLOCK_OPTIONS = [
  { label: 'Paragraph', value: 'P' },
  { label: 'Heading 1', value: 'H1' },
  { label: 'Heading 2', value: 'H2' },
  { label: 'Heading 3', value: 'H3' },
];

function isEditorValueEmpty(value = '') {
  const plain = String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h1|h2|h3)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return plain.length === 0;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write here...',
  minHeight = 160,
}) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [blockType, setBlockType] = useState('P');

  const safeValue = useMemo(() => String(value || ''), [value]);
  const isEmpty = useMemo(() => isEditorValueEmpty(safeValue), [safeValue]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (editor.innerHTML !== safeValue) {
      editor.innerHTML = safeValue;
    }
  }, [safeValue]);

  const emitChange = () => {
    if (!editorRef.current || !onChange) return;
    onChange(editorRef.current.innerHTML);
  };

  const syncBlockType = () => {
    const editor = editorRef.current;
    if (!editor || typeof window === 'undefined') return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setBlockType('P');
      return;
    }

    let node = selection.anchorNode;
    if (!node) {
      setBlockType('P');
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    if (!node || !editor.contains(node)) {
      setBlockType('P');
      return;
    }

    const blockElement = node.closest?.('h1, h2, h3, p, div, li');
    const tag = blockElement?.tagName?.toUpperCase();

    if (!tag || tag === 'DIV' || tag === 'LI') {
      setBlockType('P');
      return;
    }

    setBlockType(tag);
  };

  const execCommand = (command, commandValue = null) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, commandValue);

    emitChange();
    syncBlockType();
  };

  const applyBlockType = (nextBlockType) => {
    setBlockType(nextBlockType);
    execCommand('formatBlock', nextBlockType);
  };

  const handleInput = () => {
    emitChange();
    syncBlockType();
  };

  const handleBlur = () => {
    setIsFocused(false);

    const editor = editorRef.current;
    if (!editor) return;

    const sanitized = sanitizeRichTextHtml(editor.innerHTML);
    if (sanitized !== editor.innerHTML) {
      editor.innerHTML = sanitized;
    }

    if (onChange) {
      onChange(sanitized);
    }
  };

  const insertLink = () => {
    const rawUrl = window.prompt('Enter URL');
    if (!rawUrl) return;

    const candidate = /^(https?:\/\/|mailto:|tel:)/i.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`;

    execCommand('createLink', candidate);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50">
        <select
          value={blockType}
          onChange={(e) => applyBlockType(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white"
          aria-label="Text style"
        >
          {BLOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => execCommand('bold')} className={toolbarButtonClass(true)} aria-label="Bold">
          B
        </button>
        <button type="button" onClick={() => execCommand('italic')} className={toolbarButtonClass(true)} aria-label="Italic">
          I
        </button>
        <button type="button" onClick={() => execCommand('underline')} className={toolbarButtonClass(true)} aria-label="Underline">
          U
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className={toolbarButtonClass()}>
          Bullets
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className={toolbarButtonClass()}>
          Numbered
        </button>
        <button type="button" onClick={insertLink} className={toolbarButtonClass()}>
          Link
        </button>
        <button type="button" onClick={() => execCommand('removeFormat')} className={toolbarButtonClass()}>
          Clear
        </button>
      </div>

      <div className="relative">
        {!isFocused && isEmpty && (
          <span className="absolute left-4 top-3 text-sm text-gray-400 pointer-events-none">
            {placeholder}
          </span>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            setIsFocused(true);
            syncBlockType();
          }}
          onBlur={handleBlur}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={syncBlockType}
          onMouseUp={syncBlockType}
          className="w-full px-4 py-3 text-sm text-gray-900 leading-relaxed focus:outline-none"
          style={{ minHeight }}
          role="textbox"
          aria-multiline="true"
        />
      </div>
    </div>
  );
}
