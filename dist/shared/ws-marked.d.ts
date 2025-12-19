interface MarkdownRendererOptions {
    enableSanitizer?: boolean;
    customSanitizer?: ((html: string) => string) | null;
    markedOptions?: any;
}
export declare class MarkdownRenderer {
    private options;
    /**
     * Creates an instance of MarkdownRenderer.
     * @param {Object} [options={}] - Configuration options for Marked.js.
     * @param {boolean} [options.enableSanitizer=true] - Whether to sanitize output HTML to prevent XSS.
     * @param {Function|null} [options.customSanitizer=null] - A custom sanitization function (e.g., DOMPurify.sanitize).
     * @param {Object} [options.markedOptions={}] - Direct options to pass to Marked.js (see Marked.js docs).
     */
    constructor(options?: MarkdownRendererOptions);
    /**
     * Parses a Markdown string and returns sanitized HTML.
     * @param {string} markdownText - The Markdown text to convert.
     * @param {boolean} [useSanitizer] - Override the instance's sanitizer setting for this call.
     * @returns {string} The parsed and sanitized HTML string.
     */
    parse(markdownText: string, useSanitizer?: boolean): string;
    /**
     * Sanitizes HTML string using either the custom sanitizer or a basic fallback.
     * @private
     * @param {string} html - The HTML string to sanitize.
     * @returns {string} The sanitized HTML string.
     */
    private _sanitizeHtml;
    /**
     * Updates the configuration options for Marked.js.
     * @param {Object} newOptions - New options to merge with existing ones.
     */
    setOptions(newOptions: any): void;
    /**
     * Enables or disables the GitHub Flavored Markdown (GFM) extension.
     * @param {boolean} enable - Whether to enable GFM.
     */
    setGfm(enable: boolean): void;
    /**
     * Enables or disables line breaks (using <br> for single newlines).
     * @param {boolean} enable - Whether to enable line breaks.
     */
    setBreaks(enable: boolean): void;
}
export {};
//# sourceMappingURL=ws-marked.d.ts.map