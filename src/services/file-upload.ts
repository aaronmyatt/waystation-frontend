import { dispatch, _events } from "../shared/utils";

interface OvertypeEditor {
  textarea?: HTMLTextAreaElement;
  getValue: () => string;
  setValue: (value: string) => void;
  [key: string]: unknown;
}

export interface QueuedFile {
  id: string;
  file: File;
  placeholderText: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  remotePath?: string;
  localPath?: string;
  error?: string;
}

export class FileUploadService {
  private queue: Map<string, QueuedFile> = new Map();
  private editors: OvertypeEditor[] = [];
  private flow: any;

  constructor(flow: any, editors: OvertypeEditor[]) {
    this.flow = flow;
    this.editors = editors;
  }

  /**
   * Generate a unique ID for tracking file uploads
   */
  private generateFileId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Queue a file for upload and insert placeholder text
   */
  queueFile(file: File): string {
    const fileId = this.generateFileId();
    const placeholderText = `![Uploading ${file.name}...](${fileId})`;

    const queuedFile: QueuedFile = {
      id: fileId,
      file,
      placeholderText,
      status: 'pending',
    };

    this.queue.set(fileId, queuedFile);

    // Insert placeholder at cursor position
    this.insertTextAtCursor(placeholderText);

    // Dispatch event for client implementation to handle
    dispatch(_events.file.uploadRequested, { 
      fileId, 
      file,
      service: this,
      flow: this.flow,
    });

    return fileId;
  }

  /**
   * Queue multiple files
   */
  queueFiles(files: File[]): string[] {
    return files.map(file => this.queueFile(file));
  }

  /**
   * Insert text at the current cursor position in the editor
   */
  private insertTextAtCursor(text: string): void {
    for (const editor of this.editors) {
      if (!editor.textarea) continue;

      const textarea = editor.textarea;
      const cursorPos = textarea.selectionStart;
      const currentValue = editor.getValue();

      // Insert text at cursor position with newlines for proper formatting
      const beforeCursor = currentValue.substring(0, cursorPos);
      const afterCursor = currentValue.substring(cursorPos);
      
      // Add newlines if not at start of line
      const prefix = beforeCursor && !beforeCursor.endsWith('\n') ? '\n' : '';
      const suffix = afterCursor && !afterCursor.startsWith('\n') ? '\n' : '';
      
      const newValue = beforeCursor + prefix + text + suffix + afterCursor;
      
      editor.setValue(newValue);

      // Move cursor after inserted text
      const newCursorPos = cursorPos + prefix.length + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }
  }

  /**
   * Replace placeholder text with final markdown image syntax
   */
  private replacePlaceholder(fileId: string, newMarkdown: string): void {
    const queuedFile = this.queue.get(fileId);
    if (!queuedFile) return;

    for (const editor of this.editors) {
      const currentValue = editor.getValue();
      const updatedValue = currentValue.replace(
        queuedFile.placeholderText,
        newMarkdown
      );
      
      if (updatedValue !== currentValue) {
        editor.setValue(updatedValue);
      }
    }
  }

  /**
   * Mark upload as successful and update the editor with final path
   */
  onUploadSuccess(fileId: string, remotePath: string, localPath?: string): void {
    const queuedFile = this.queue.get(fileId);
    if (!queuedFile) return;

    queuedFile.status = 'success';
    queuedFile.remotePath = remotePath;
    queuedFile.localPath = localPath;

    const markdown = localPath 
      ? `![${queuedFile.file.name}](${remotePath} "${localPath}")`
      : `![${queuedFile.file.name}](${remotePath})`;

    this.replacePlaceholder(fileId, markdown);
    
    // Optionally remove from queue after successful upload
    // this.queue.delete(fileId);
  }

  /**
   * Mark upload as failed and update placeholder with error
   */
  onUploadError(fileId: string, error: string): void {
    const queuedFile = this.queue.get(fileId);
    if (!queuedFile) return;

    queuedFile.status = 'error';
    queuedFile.error = error;

    const errorMarkdown = `![Upload failed: ${queuedFile.file.name} - ${error}](${fileId})`;
    this.replacePlaceholder(fileId, errorMarkdown);
  }

  /**
   * Update upload status (for progress indication)
   */
  updateStatus(fileId: string, status: QueuedFile['status']): void {
    const queuedFile = this.queue.get(fileId);
    if (!queuedFile) return;

    queuedFile.status = status;

    // Update placeholder to show status
    if (status === 'uploading') {
      const progressMarkdown = `![Uploading ${queuedFile.file.name}... (in progress)](${fileId})`;
      this.replacePlaceholder(fileId, progressMarkdown);
    }
  }

  /**
   * Get file from queue
   */
  getQueuedFile(fileId: string): QueuedFile | undefined {
    return this.queue.get(fileId);
  }

  /**
   * Get all queued files
   */
  getAllQueuedFiles(): QueuedFile[] {
    return Array.from(this.queue.values());
  }

  /**
   * Clear completed uploads from queue
   */
  clearCompleted(): void {
    for (const [id, file] of this.queue.entries()) {
      if (file.status === 'success') {
        this.queue.delete(id);
      }
    }
  }

  /**
   * Scan editor content for unfulfilled upload placeholders on load
   * and mark them as errors
   */
  scanForUnfulfilledUploads(): void {
    for (const editor of (this.editors || [])) {
      const content = editor.getValue();
      const uploadPattern = /!\[Uploading.*?\]\((upload-\d+-[a-z0-9]+)\)/g;
      let match;

      while ((match = uploadPattern.exec(content)) !== null) {
        const fileId = match[1];
        if (!this.queue.has(fileId)) {
          // Found an unfulfilled upload, replace with error message
          const errorMarkdown = `![Upload incomplete - please re-upload](${fileId})`;
          const updatedValue = content.replace(match[0], errorMarkdown);
          editor.setValue(updatedValue);
        }
      }
    }
  }

  /**
   * Clean up service
   */
  destroy(): void {
    this.queue.clear();
    this.editors = [];
  }
}
