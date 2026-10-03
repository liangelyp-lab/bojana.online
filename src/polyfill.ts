// Safeguard for environments where Window.prototype.fetch or window.fetch has only a getter
(function ensureFetchWritable() {
  if (typeof window === 'undefined') return;

  try {
    const originalFetch = window.fetch;
    let fetchFn = typeof originalFetch === 'function' ? originalFetch.bind(window) : originalFetch;

    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!descriptor || !descriptor.set || descriptor.writable === false) {
      try {
        Object.defineProperty(window, 'fetch', {
          get() {
            return fetchFn;
          },
          set(newFetch: typeof window.fetch) {
            fetchFn = newFetch;
          },
          configurable: true,
          enumerable: true
        });
      } catch (err) {
        console.warn('Polyfill: unable to redefine window.fetch', err);
      }
    }
  } catch (e) {
    console.warn('Polyfill: error ensuring fetch is writable', e);
  }
})();

export {};
