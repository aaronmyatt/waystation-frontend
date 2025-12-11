import { marked } from 'marked';

interface MarkdownRendererOptions {
    enableSanitizer?: boolean;
    customSanitizer?: ((html: string) => string) | null;
    markedOptions?: any;
}

interface RendererConfig {
    enableSanitizer: boolean;
    customSanitizer: ((html: string) => string) | null;
    markedOptions: any;
}

export class MarkdownRenderer {
    private options: RendererConfig;

    /**
     * Creates an instance of MarkdownRenderer.
     * @param {Object} [options={}] - Configuration options for Marked.js.
     * @param {boolean} [options.enableSanitizer=true] - Whether to sanitize output HTML to prevent XSS.
     * @param {Function|null} [options.customSanitizer=null] - A custom sanitization function (e.g., DOMPurify.sanitize).
     * @param {Object} [options.markedOptions={}] - Direct options to pass to Marked.js (see Marked.js docs).
     */
    constructor(options: MarkdownRendererOptions = {}) {
        this.options = {
            enableSanitizer: options.enableSanitizer !== false, // Default to true
            customSanitizer: options.customSanitizer || null,
            markedOptions: options.markedOptions || {}
        };

        // Configure Marked.js with the provided options
        marked.setOptions(this.options.markedOptions);
    }

    /**
     * Parses a Markdown string and returns sanitized HTML.
     * @param {string} markdownText - The Markdown text to convert.
     * @param {boolean} [useSanitizer] - Override the instance's sanitizer setting for this call.
     * @returns {string} The parsed and sanitized HTML string.
     */
    parse(markdownText: string, useSanitizer?: boolean): string {
        if (typeof markdownText !== 'string') {
            console.warn('MarkdownRenderer.parse() expects a string input.');
            return '';
        }

        // Parse Markdown to HTML using Marked.js
        const rawHtml = marked.parse(markdownText) as string;

        // Determine if sanitization should be applied
        const shouldSanitize = useSanitizer !== undefined ? useSanitizer : this.options.enableSanitizer;

        if (shouldSanitize) {
            return this._sanitizeHtml(rawHtml);
        }

        // � Security Warning: Returning unsanitized HTML
        console.warn('MarkdownRenderer: Returning unsanitized HTML. This may expose your application to XSS attacks.');
        return rawHtml;
    }

    /**
     * Sanitizes HTML string using either the custom sanitizer or a basic fallback.
     * @private
     * @param {string} html - The HTML string to sanitize.
     * @returns {string} The sanitized HTML string.
     */
    private _sanitizeHtml(html: string): string {
        // Use custom sanitizer if provided (e.g., DOMPurify)
        if (typeof this.options.customSanitizer === 'function') {
            return this.options.customSanitizer(html);
        }

        // Fallback: Basic sanitization to remove script tags and event handlers
        // For production, a dedicated library like DOMPurify is strongly recommended.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove common event handlers from all elements
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            const attrs = el.attributes;
            for (let i = attrs.length - 1; i >= 0; i--) {
                const attrName = attrs[i].name.toLowerCase();
                if (attrName.indexOf('on') === 0 || (attrName === 'href' && attrs[i].value.toLowerCase().indexOf('javascript:') === 0)) {
                    el.removeAttribute(attrName);
                }
            }
        });

        return tempDiv.innerHTML;
    }

    /**
     * Updates the configuration options for Marked.js.
     * @param {Object} newOptions - New options to merge with existing ones.
     */
    setOptions(newOptions: any): void {
        this.options.markedOptions = { ...this.options.markedOptions, ...newOptions };
        marked.setOptions(this.options.markedOptions);
    }

    /**
     * Enables or disables the GitHub Flavored Markdown (GFM) extension.
     * @param {boolean} enable - Whether to enable GFM.
     */
    setGfm(enable: boolean): void {
        this.setOptions({ gfm: enable });
    }

    /**
     * Enables or disables line breaks (using <br> for single newlines).
     * @param {boolean} enable - Whether to enable line breaks.
     */
    setBreaks(enable: boolean): void {
        this.setOptions({ breaks: enable });
    }
}