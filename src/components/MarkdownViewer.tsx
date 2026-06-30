import React from 'react';

interface MarkdownViewerProps {
  text: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ text }) => {
  if (!text) return null;

  // Split content by block boundaries
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLanguage = '';

  const renderInlineFormat = (lineText: string) => {
    // Basic bold **text** parsing
    const parts = lineText.split(/\*\*([^*]+)\*\*/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-accent">{part}</strong>;
      }
      // Inline code `code` parsing
      const subParts = part.split(/`([^`]+)`/);
      return subParts.map((subPart, subIndex) => {
        if (subIndex % 2 === 1) {
          return (
            <code key={subIndex} className="px-1.5 py-0.5 bg-slate-900/60 border border-white/5 rounded text-[11px] font-mono text-accent">
              {subPart}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  const flushList = (key: number) => {
    if (!currentList) return null;
    const list = currentList;
    currentList = null;
    if (list.type === 'ul') {
      return (
        <ul key={`ul-${key}`} className="list-disc pl-5 my-3.5 space-y-2 text-slate-300 text-xs">
          {list.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormat(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      return (
        <ol key={`ol-${key}`} className="list-decimal pl-5 my-3.5 space-y-2 text-slate-300 text-xs">
          {list.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormat(item)}
            </li>
          ))}
        </ol>
      );
    }
  };

  const flushTable = (key: number) => {
    if (!inTable) return null;
    inTable = false;
    const headers = tableHeaders;
    const rows = tableRows;
    tableHeaders = [];
    tableRows = [];

    return (
      <div key={`table-${key}`} className="overflow-x-auto my-4.5 rounded-xl border border-white/10 shadow-lg">
        <table className="min-w-full text-left border-collapse bg-slate-950/40">
          <thead>
            <tr className="border-b border-white/10 bg-indigo-950/20">
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 text-xs font-mono font-bold text-accent uppercase tracking-wider border-r border-white/5 last:border-r-0">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2.5 text-xs text-slate-300 border-r border-white/5 last:border-r-0">
                    {renderInlineFormat(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushCodeBlock = (key: number) => {
    if (!inCodeBlock) return null;
    inCodeBlock = false;
    const code = codeBlockLines.join('\n');
    const lang = codeBlockLanguage;
    codeBlockLines = [];
    codeBlockLanguage = '';

    return (
      <div key={`code-${key}`} className="my-4 rounded-xl border border-white/10 overflow-hidden bg-slate-950/70 shadow-inner font-mono text-xs">
        {lang && (
          <div className="bg-slate-900 px-4 py-1.5 border-b border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>{lang}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-accent">Locked</span>
          </div>
        )}
        <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- 1. Code Blocks ---
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        renderedElements.push(flushCodeBlock(i));
      } else {
        if (currentList) renderedElements.push(flushList(i));
        if (inTable) renderedElements.push(flushTable(i));
        inCodeBlock = true;
        codeBlockLanguage = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // --- 2. Tables ---
    if (line.trim().startsWith('|')) {
      if (currentList) renderedElements.push(flushList(i));
      
      // Separator row check e.g. |---|---|
      if (line.includes('-') && !line.match(/[a-zA-Z0-9]/)) {
        continue;
      }

      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      renderedElements.push(flushTable(i));
    }

    // --- 3. Lists ---
    const unorderedMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    const orderedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);

    if (unorderedMatch) {
      const itemText = unorderedMatch[1];
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        if (currentList) renderedElements.push(flushList(i));
        currentList = { type: 'ul', items: [itemText] };
      }
      continue;
    }

    if (orderedMatch) {
      const itemText = orderedMatch[1];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        if (currentList) renderedElements.push(flushList(i));
        currentList = { type: 'ol', items: [itemText] };
      }
      continue;
    }

    if (currentList) {
      renderedElements.push(flushList(i));
    }

    // --- 4. Headers ---
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const headerText = line.replace(/^#+\s*/, '');
      const cleanText = renderInlineFormat(headerText);
      
      if (level === 1) {
        renderedElements.push(
          <h1 key={i} className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white mt-5 mb-2.5">
            {cleanText}
          </h1>
        );
      } else if (level === 2) {
        renderedElements.push(
          <h2 key={i} className="font-display font-bold text-base sm:text-lg tracking-tight text-accent mt-4 mb-2">
            {cleanText}
          </h2>
        );
      } else {
        renderedElements.push(
          <h3 key={i} className="font-display font-semibold text-sm sm:text-base tracking-tight text-slate-200 mt-3 mb-1.5">
            {cleanText}
          </h3>
        );
      }
      continue;
    }

    // --- 5. Empty Lines / Paragraphs ---
    if (line.trim() === '') {
      continue;
    }

    renderedElements.push(
      <p key={i} className="text-slate-300 text-xs leading-relaxed mb-3.5 font-light">
        {renderInlineFormat(line)}
      </p>
    );
  }

  // Flush remaining blocks
  if (currentList) renderedElements.push(flushList(lines.length));
  if (inTable) renderedElements.push(flushTable(lines.length));
  if (inCodeBlock) renderedElements.push(flushCodeBlock(lines.length));

  return <div className="space-y-1">{renderedElements}</div>;
};
