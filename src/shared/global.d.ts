// Global type definitions

interface InitialData {
  flows?: any[];
  oneFlow?: {
    flow: any;
    matches: any[];
    isDirty: boolean;
  };
}

declare global {
  var __INITIAL_DATA__: InitialData | undefined;
  var flowService: any;
  var flowListService: any;
  var authService: any;
  var marked: any;
  var syntaxHighlighter: any;
}

export {};
