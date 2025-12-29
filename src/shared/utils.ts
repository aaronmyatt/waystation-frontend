
export function updateQueryParam(param: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', param);
  window.history.replaceState({}, '', url.toString());
}

export function removeQueryParam(param: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete(param);
  window.history.replaceState({}, '', url.toString());
}

export function dispatch(eventName: string, data?: any): boolean {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

export function debounce(func: (...args: any[]) => void, wait: number): Function {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const _events = {
  flow: {
    updated: 'ws::flow::updated',
    requestFlowPreview: 'ws::flow::requestFlowPreview',
    updateFlowSingular: "ws::action::updateFlow",
  },
  ui: {
    openFlowSettingsModal: 'ws::ui::openFlowSettingsModal',
    closeFlowSettingsModal: 'ws::ui::closeFlowSettingsModal',
  },
  action: {
    refreshTagsList: 'ws::action::refreshTagsList',
    refreshList: 'ws::action::refreshList',
    requestFlow: 'ws::action::requestFlow',
    actionError: 'ws::action::actionError',

    export: "ws::action::export",
    generateFlowContent: "ws::action::generateFlowContent",
    deleteFlow: "ws::action::deleteFlow",

    // flow match actions
    generateFlowMatchContent: "ws::action::generateFlowMatchContent",
    insertFlowMatchAfter: "ws::action::insertFlowMatchAfter",

    // create a new flow with the current match as parent and first step
    createChildFlow: "ws::action::createChildFlow",

    // dispatch match click events for the extension to handle
    clickFlowMatch: "ws::click::flowMatch",
  },
  dialog: {
    openInsertBetween: "ws::dialog::openInsertBetween",
    closeInsertBetween: "ws::dialog::closeInsertBetween",
  },
  auth: {
    login: 'ws::auth::login',
    register: 'ws::auth::register',
    logout: 'ws::auth::logout'
  },
};

export const storageKeys = {
  user: 'ws::user',
  authToken: 'ws::authToken',
  themeChoice: 'ws::theme',
};