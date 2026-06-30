import { afterEach, mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as RealRouter from '@tanstack/react-router';
import { createElement } from 'react';
import * as RealRecharts from 'recharts';

// Register a happy-dom document FIRST so components render against a real DOM
// and React hooks behave normally (the shallow-renderer hack could not run
// hooks). This must happen before @testing-library/dom is imported, because its
// `screen` binds to `document.body` at module-init time — hence the dynamic
// import below rather than a hoisted top-level import.
if (!globalThis.document) {
  GlobalRegistrator.register();
}

// Stub Canvas API in Happy-DOM once, globally.
const originalCreateElement = globalThis.document.createElement;
globalThis.document.createElement = function (
  tagName: string,
  options?: ElementCreationOptions,
) {
  const element = originalCreateElement.call(this, tagName, options);
  if (tagName.toLowerCase() === 'canvas') {
    // biome-ignore lint/suspicious/noExplicitAny: stubbing happy-dom canvas
    const canvas = element as any;
    if (!canvas.getContext || canvas.getContext('2d') === null) {
      canvas.getContext = (contextId: string) => {
        if (contextId === '2d') {
          return {
            drawImage: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray() }),
            putImageData: () => {},
          };
        }
        return null;
      };
    }
    if (!canvas.toBlob) {
      // biome-ignore lint/suspicious/noExplicitAny: stubbing canvas method
      canvas.toBlob = (callback: any, type?: string, _quality?: any) => {
        callback(new Blob(['mock-image-data'], { type: type || 'image/webp' }));
      };
    }
  }
  return element;
};

// Stub Image class in Happy-DOM once, globally to auto-trigger load event.
class MockImage {
  onload: (() => void) | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: stub
  onerror: ((err: any) => void) | null = null;
  src = '';
  crossOrigin = '';
  constructor() {
    queueMicrotask(() => {
      if (this.onload) this.onload();
    });
  }
  addEventListener(event: string, callback: () => void) {
    if (event === 'load') this.onload = callback;
    if (event === 'error') this.onerror = callback;
  }
}
// biome-ignore lint/suspicious/noExplicitAny: override happy-dom Image constructor
globalThis.Image = MockImage as any;

// Stub @tanstack/react-router ONCE, globally. bun's `mock.module` is
// process-global and permanent, so a partial per-file router mock that drops a
// named export (e.g. `useNavigate`) makes that import throw in *other* files
// that share the same bun process. The real `Link`/`useNavigate` also require a
// RouterProvider that unit tests do not mount. Spreading the real module keeps
// every named export present, while `Link`/`useNavigate` become inert,
// queryable stubs shared by all tests. Per-file router mocks must be removed in
// favour of this single source of truth.
mock.module('@tanstack/react-router', () => ({
  ...RealRouter,
  // biome-ignore lint/suspicious/noExplicitAny: shared test boundary stub
  Link: (props: any) => {
    const { to, hash, search, params, children, ...rest } = props;
    return createElement(
      'a',
      {
        ...rest,
        'data-to': to,
        'data-hash': hash,
        'data-params': params ? JSON.stringify(params) : undefined,
        'data-search': search ? JSON.stringify(search) : undefined,
      },
      children,
    );
  },
  useNavigate: () => () => {},
  useParams: () => ({}),
  // Route layouts render <Outlet/>; the real one needs a RouterProvider that
  // unit tests do not mount.
  Outlet: () => null,
}));

// Stub recharts ONCE, globally, for the same process-global mock.module reason
// as the router: partial per-file recharts mocks drop named exports other files
// import. Spreading the real module keeps every chart export present; only
// ResponsiveContainer is replaced (it needs a ResizeObserver happy-dom lacks)
// with a fixed-size passthrough so charts render without measuring.
mock.module('recharts', () => ({
  ...RealRecharts,
  // biome-ignore lint/suspicious/noExplicitAny: shared test boundary stub
  ResponsiveContainer: ({ children }: any) =>
    createElement(
      'div',
      { style: { width: 300, height: 200 } },
      typeof children === 'function'
        ? children({ width: 300, height: 200 })
        : children,
    ),
}));

const { cleanup } = await import('@testing-library/react');

// Unmount anything rendered so the DOM does not bleed between tests/files.
afterEach(() => {
  cleanup();
});
