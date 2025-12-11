import hljs from 'highlight.js';

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
export class SyntaxHighlighter {
    private config: HighlighterConfig;
    private _initialized: boolean;
    private _styleElement: HTMLLinkElement | null;

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
            theme: config.theme || 'default',
            languages: config.languages || [],
            hljsOptions: config.hljsOptions || {}
        };
        
        this._initialized = false;
        this._styleElement = null;
        
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
        console.log('SyntaxHighlighter initialized successfully');
        return true;
    }
    
    /**
     * Load and apply a theme
     * @param {string} themeName - Name of the theme to load
     */
    loadTheme(themeName: string): void {
        // Remove existing theme if present
        if (this._styleElement && this._styleElement.parentNode) {
            this._styleElement.parentNode.removeChild(this._styleElement);
        }
        
        // Create link element for theme
        this._styleElement = document.createElement('link');
        this._styleElement.rel = 'stylesheet';
        this._styleElement.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/${themeName}.min.css`;
        
        // Update config
        this.config.theme = themeName;
        
        // Add to document head
        document.head.appendChild(this._styleElement);
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