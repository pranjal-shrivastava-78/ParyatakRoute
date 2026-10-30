import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Format inline markdown tokens: bold (**text**), code (`code`), italics (*text*), links ([label](url))
 */
const renderInline = (text: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  // Regex to match inline links, code, bold, italic
  const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      // Link [label](url)
      tokens.push(
        <a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer">
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      // Bold **text**
      tokens.push(<strong key={match.index}>{match[4]}</strong>);
    } else if (match[5]) {
      // Inline `code`
      tokens.push(<code key={match.index}>{match[5]}</code>);
    } else if (match[6]) {
      // Italic *text*
      tokens.push(<em key={match.index}>{match[6]}</em>);
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`}>
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`}>
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      elements.push(
        <div key={`table-wrap-${elements.length}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table>
            <thead>
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i}>{renderInline(h.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInline(cell.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if separator line (e.g., |---|---|)
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // 2. Unordered List item (- or *)
    const ulMatch = /^[*-]\s+(.+)/.exec(trimmed);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // 3. Ordered List item (1. or 2.)
    const olMatch = /^\d+\.\s+(.+)/.exec(trimmed);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[1]);
      continue;
    }

    // Line is not a list item: flush any active list
    flushList();

    if (!trimmed) {
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{renderInline(trimmed.substring(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{renderInline(trimmed.substring(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{renderInline(trimmed.substring(2))}</h1>);
    } else {
      // 5. Standard paragraph
      elements.push(<p key={`p-${i}`}>{renderInline(trimmed)}</p>);
    }
  }

  flushList();
  flushTable();

  return <div className="ai-markdown-content">{elements}</div>;
};

export default MarkdownRenderer;
