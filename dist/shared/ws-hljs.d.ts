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
export declare class SyntaxHighlighter {
    private config;
    private _initialized;
    /**
     * Creates an instance of SyntaxHighlighter
     * @param {Object} [config={}] - Configuration options
     * @param {boolean} [config.autoDetect=true] - Enable automatic language detection
     * @param {string} [config.theme='default'] - Theme name for syntax highlighting
     * @param {string[]} [config.languages=[]] - Specific languages to register
     * @param {Object} [config.hljsOptions={}] - Additional Highlight.js options
     */
    constructor(config?: SyntaxHighlighterConfig);
    /**
     * Initialize the highlighter
     * @returns {boolean} - True if initialization successful
     */
    init(): boolean;
    /**
     * Load and apply a theme
     * Note: Themes are now bundled locally. This method updates the theme class on the body.
     * @param {string} themeName - Name of the theme to load
     */
    loadTheme(themeName: string): void;
    /**
     * Register specific languages with Highlight.js
     * @param {string[]} languages - Array of language names to register
     * @returns {boolean} - True if languages registered successfully
     */
    registerLanguages(languages: string[]): boolean;
    /**
     * Highlight all code blocks on the page
     * @param {string|HTMLElement} [container=document] - Container element or selector
     * @returns {number} - Number of elements highlighted
     */
    highlightAll(container?: string | Document | HTMLElement): number;
    /**
     * Highlight a specific element
     * @param {HTMLElement} element - The code element to highlight
     * @param {string} [language] - Force specific language (optional)
     * @returns {Object|null} - Highlight.js result object or null
     */
    highlightElement(element: HTMLElement, language?: string | null): any;
    /**
     * Highlight raw code text
     * @param {string} code - The code string to highlight
     * @param {string} language - Language of the code
     * @returns {string} - Highlighted HTML string
     */
    highlightCode(code: string, language: string): string;
    /**
     * Create and insert a highlighted code block
     * @param {string} code - The code to highlight
     * @param {string} language - Language of the code
     * @param {HTMLElement} [container] - Container to insert into
     * @returns {HTMLElement} - The created code block element
     */
    createCodeBlock(code: string, language: string, container?: HTMLElement | null): HTMLElement;
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig: Partial<HighlighterConfig>): void;
    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    getConfig(): HighlighterConfig;
    /**
     * Check if highlighter is initialized
     * @returns {boolean} - Initialization status
     */
    isInitialized(): boolean;
    pathExtension(path: string): string;
}
export {};
//# sourceMappingURL=ws-hljs.d.ts.map