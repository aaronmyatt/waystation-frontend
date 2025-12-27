// Simplified code display without highlight.js dependency for better performance
import m from 'mithril';

// Helper function to dedent code by removing common leading whitespace
function dedentCode(code: string): string {
  if (!code) return code;

  const lines = code.split('\n');

  // Find the minimum indentation (ignoring empty lines)
  const minIndent = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min; // Skip empty lines
    const match = line.match(/^(\s*)/);
    const indent = match ? match[1].length : 0;
    return min === null ? indent : Math.min(min, indent);
  }, null as number | null);

  if (minIndent === null || minIndent === 0) return code;

  // Remove the minimum indentation from all lines
  return lines.map(line => {
    if (line.trim().length === 0) return line; // Preserve empty lines
    return line.slice(minIndent);
  }).join('\n');
}

// Simple code block component without syntax highlighting
function SimpleCodeBlock() {
  return {
    view(vnode) {
      const code = dedentCode(vnode.attrs.code || "");
      return m(
        ".code.card bg-base-200 p-1",
        m(
          "pre.overflow-x-auto text-sm",
          { style: "font-family: monospace; white-space: pre;" },
          m("code", code)
        )
      );
    },
  };
}

export function CodeBlock(): m.Component {
  return {
    view(vnode) {
      const match = vnode.attrs.match.match;
      const meta = JSON.parse(match.grep_meta);
      const lines = meta.context_lines.join("\n");

      return m(SimpleCodeBlock, {
        code: lines,
      });
    },
  };
}

export function CodeLine(): m.Component {
  return {
    view(vnode) {
      const match = vnode.attrs.match.match;

      return m(SimpleCodeBlock, {
        code: (match.line || "").trimStart(),
      });
    },
  };
}

// Minimal highlight.js integration for markdown preview
// Flow editor uses the simplified SimpleCodeBlock component above
import hljs from 'highlight.js';

export const syntaxHighlighter = {
  highlightAll: () => {
    // Highlight code blocks in markdown preview
    document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }
};
