// Global type definitions

interface InitialData {
  flows?: any[];
  oneFlow?: {
    flow: any;
    matches: any[];
    isDirty: boolean;
  };
  features?: Record<string, boolean>;
  tags?: any;
  config?: {
    workspaceLocalOnly?: boolean;
  };
}

declare global {
  var __INITIAL_DATA__: InitialData | undefined;
  var flowService: any;
  var flowListService: any;
  var tagsListService: any;
  var featureToggleService: any;
  var configService: any;
  var authService: any;
  var marked: any;
  var syntaxHighlighter: any;
  var api: any;
  var actions: {
    copyFlow: () => import("../services/copy-flow").CopyFlowService;
  };
}

export {};
