export function dispatch(eventName, data) {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
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