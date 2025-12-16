export function dispatch(eventName, data) {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

export const _events = {
  action: {
    requestFlow: 'ws::action::requestFlow',
    actionError: 'ws::action::actionError',
  },
};