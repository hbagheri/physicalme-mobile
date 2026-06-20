/**
 * Lazy-loads MathJax v4 and exposes a typeset helper.
 *
 * The first call injects the loader script + config. Subsequent calls just
 * await the global MathJax instance and run typesetPromise on the given
 * scope (so we can re-typeset a single article container after navigation).
 */

let loaded: Promise<void> | null = null;

declare global {
  interface Window {
    MathJax: any;
  }
}

function ensureLoaded(): Promise<void> {
  if (loaded) return loaded;

  // Config must exist BEFORE the loader script runs
  window.MathJax = {
    tex: {
      inlineMath:  [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
    },
    options: {
      skipHtmlTags:    ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'iframe'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process',
    },
    startup: {
      typeset: false, // we trigger manually after Vue renders
    },
  };

  loaded = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';
    s.async = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('MathJax failed to load'));
    document.head.appendChild(s);
  });
  return loaded;
}

export async function typeset(scope: HTMLElement | HTMLElement[]): Promise<void> {
  await ensureLoaded();
  // MathJax startup may still be running on first call — await it.
  if (window.MathJax?.startup?.promise) {
    await window.MathJax.startup.promise;
  }
  if (window.MathJax?.typesetPromise) {
    await window.MathJax.typesetPromise(Array.isArray(scope) ? scope : [scope]);
  }
}
