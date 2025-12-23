import hljs from 'highlight.js';
import m from 'mithril';

interface SyntaxHighlighterConfig {
    autoDetect?: boolean;
    theme?: string;
    languages?: string[];
    hljsOptions?: any;
}

interface HighlighterConfig {
    autoDetect: boolean;
    theme: string;
    languages: string[];
    hljsOptions: any;
}

/**
 * SyntaxHighlighter - A wrapper class for Highlight.js syntax highlighting
 * Uses the highlight.js npm package
 * 
 * @class SyntaxHighlighter
 * @example
 * // Initialize with default settings
 * const highlighter = new SyntaxHighlighter();
 * 
 * // Initialize with custom configuration
 * const highlighter = new SyntaxHighlighter({
 *   autoDetect: true,
 *   theme: 'github-dark',
 *   languages: ['javascript', 'python', 'html']
 * });
 */
class SyntaxHighlighter {
    private config: HighlighterConfig;
    private _initialized: boolean;

    /**
     * Creates an instance of SyntaxHighlighter
     * @param {Object} [config={}] - Configuration options
     * @param {boolean} [config.autoDetect=true] - Enable automatic language detection
     * @param {string} [config.theme='default'] - Theme name for syntax highlighting
     * @param {string[]} [config.languages=[]] - Specific languages to register
     * @param {Object} [config.hljsOptions={}] - Additional Highlight.js options
     */
    constructor(config: SyntaxHighlighterConfig = {}) {
        this.config = {
            autoDetect: config.autoDetect !== false,
            theme: config.theme || 'vs',
            languages: config.languages || [],
            hljsOptions: config.hljsOptions || {}
        };
        
        this._initialized = false;
        
        // Initialize on creation
        this.init();
    }
    
    /**
     * Initialize the highlighter
     * @returns {boolean} - True if initialization successful
     */
    init(): boolean {
        // Configure hljs with provided options
        if (Object.keys(this.config.hljsOptions).length > 0) {
            hljs.configure(this.config.hljsOptions);
        }
        
        // Load theme
        this.loadTheme(this.config.theme);
        
        // Register specific languages if provided
        if (this.config.languages.length > 0) {
            this.registerLanguages(this.config.languages);
        }
        
        this._initialized = true;
        console.debug('SyntaxHighlighter initialized successfully');
        return true;
    }
    
    /**
     * Load and apply a theme
     * Note: Themes are now bundled locally. This method updates the theme class on the body.
     * @param {string} themeName - Name of the theme to load
     */
    loadTheme(themeName: string): void {
        // Remove existing theme class if present
        if (this.config.theme) {
            document.body.classList.remove(`hljs-theme-${this.config.theme}`);
        }
        
        // Update config
        this.config.theme = themeName;
        
        // Add new theme class to body
        // Note: All themes are pre-imported, CSS rules are scoped by theme name
        document.body.classList.add(`hljs-theme-${themeName}`);
        
        console.debug(`Theme loaded: ${themeName}`);
    }
    
    /**
     * Register specific languages with Highlight.js
     * @param {string[]} languages - Array of language names to register
     * @returns {boolean} - True if languages registered successfully
     */
    registerLanguages(languages: string[]): boolean {
        if (!this._initialized) {
            console.warn('Highlighter not initialized. Call init() first.');
            return false;
        }
        
        // Note: In CDN usage, languages are typically included in the main bundle
        // or loaded as separate scripts. This method is for documentation/consistency.
        console.log(`Languages configured: ${languages.join(', ')}`);
        this.config.languages = languages;
        return true;
    }
    
    /**
     * Highlight all code blocks on the page
     * @param {string|HTMLElement} [container=document] - Container element or selector
     * @returns {number} - Number of elements highlighted
     */
    highlightAll(container: string | Document | HTMLElement = document): number {
        if (!this._initialized) {
            console.warn('Highlighter not initialized');
            return 0;
        }
        
        const target = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!target) {
            console.warn('Container not found:', container);
            return 0;
        }
        
        // Use auto detection or manual highlighting based on config
        if (this.config.autoDetect) {
            hljs.highlightAll();
        } else {
            const codeBlocks = target.querySelectorAll('pre code');
            codeBlocks.forEach(block => this.highlightElement(block as HTMLElement));
        }
        
        const count = target.querySelectorAll('pre code').length;
        console.log(`Highlighted ${count} code blocks`);
        return count;
    }
    
    /**
     * Highlight a specific element
     * @param {HTMLElement} element - The code element to highlight
     * @param {string} [language] - Force specific language (optional)
     * @returns {Object|null} - Highlight.js result object or null
     */
    highlightElement(element: HTMLElement, language: string | null = null): any {
        if (!this._initialized || !element) {
            return null;
        }
        
        try {
            if (language) {
                // Force specific language
                const result = hljs.highlight(element.textContent, { language });
                element.innerHTML = result.value;
                element.classList.add('hljs');
                return result;
            } else {
                // Use hljs's highlighting
                hljs.highlightElement(element);
                return { value: element.innerHTML, language: element.className };
            }
        } catch (error) {
            console.error('Error highlighting element:', error);
            return null;
        }
    }
    
    /**
     * Highlight raw code text
     * @param {string} code - The code string to highlight
     * @param {string} language - Language of the code
     * @returns {string} - Highlighted HTML string
     */
    highlightCode(code: string, language: string): string {
        if (!this._initialized) {
            return code; // Return plain text if not initialized
        }
        
        try {
            const result = hljs.highlight(code, { language });
            return result.value;
        } catch (error) {
            console.error('Error highlighting code:', error);
            return code;
        }
    }
    
    /**
     * Create and insert a highlighted code block
     * @param {string} code - The code to highlight
     * @param {string} language - Language of the code
     * @param {HTMLElement} [container] - Container to insert into
     * @returns {HTMLElement} - The created code block element
     */
    createCodeBlock(code: string, language: string, container: HTMLElement | null = null): HTMLElement {
        const pre = document.createElement('pre');
        const codeElement = document.createElement('code');
        
        codeElement.className = `language-${language}`;
        codeElement.textContent = code;
        
        pre.appendChild(codeElement);
        
        // Highlight the code
        this.highlightElement(codeElement, language);
        
        // Insert into container if provided
        if (container) {
            container.appendChild(pre);
        }
        
        return pre;
    }
    
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig: Partial<HighlighterConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // Re-initialize if theme changed
        if (newConfig.theme && newConfig.theme !== this.config.theme) {
            this.loadTheme(newConfig.theme);
        }
        
        // Re-highlight if autoDetect changed
        if (newConfig.autoDetect !== undefined) {
            console.log('Config updated. Re-run highlightAll() to apply changes.');
        }
    }
    
    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    getConfig(): HighlighterConfig {
        return { ...this.config };
    }
    
    /**
     * Check if highlighter is initialized
     * @returns {boolean} - Initialization status
     */
    isInitialized(): boolean {
        return this._initialized;
    }
    
   pathExtension(path: string): string {
     if (!path || typeof path !== 'string') {
        return '';
    }
    
    // Get the file extension
    const extension = path.split('.').pop()?.toLowerCase();
    
    if (!extension) {
        return '';
    }
    
    return extension;
   }
}

const syntaxHighlighter = new SyntaxHighlighter({
    autoDetect: true,
    theme: 'vs',
    languages: [],
    hljsOptions: {}
});

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

// Base component that accepts language and code attributes
function HighlightedCodeBlock() {
  let highlightedCode = "";
  let language = "";
  return {
    oninit(vnode) {
      language = syntaxHighlighter.pathExtension(vnode.attrs.path || "");
      const code = dedentCode(vnode.attrs.code || "");
      highlightedCode = syntaxHighlighter.highlightCode(code, language);
    },
    view() {
      return m(
        ".code.card bg-base-200 p-1",
        m(
          "pre.overflow-x-auto",
          m("code", { class: `language-${language}` }, m.trust(highlightedCode))
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
      
      return m(HighlightedCodeBlock, {
        code: lines,
        path: match.file_name,
      });
    },
  };
}

export function CodeLine(): m.Component {
  return {
    view(vnode) {
      const match = vnode.attrs.match.match;
      
      return m(HighlightedCodeBlock, {
        code: (match.line || "").trimStart(),
        path: match.file_name,
      });
    },
  };
}