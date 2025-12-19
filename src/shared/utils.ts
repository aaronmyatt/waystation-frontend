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
  action: {
    requestFlow: 'ws::action::requestFlow',
    actionError: 'ws::action::actionError',
  },
};