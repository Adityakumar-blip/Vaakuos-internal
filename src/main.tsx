import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import * as Sentry from "@sentry/react";
import { store } from "./store/index";
import App from "./App.tsx";
import "./index.css";

// With no DSN the SDK stays inert, so dev and preview builds need no guard.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // ponytail: errors only. Turn on tracesSampleRate / replayIntegration once
  // there's a latency question worth the ~40kB gzip they add to the bundle.
  tracesSampleRate: 0,
});

// Deliberately plain markup, not shadcn: this renders precisely when the app
// tree failed, so it must not depend on the providers or theme that may be why.
const CrashFallback = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-white p-6">
    <div className="max-w-md text-center">
      <h1 className="mb-2 text-xl font-semibold text-gray-900">
        Something went wrong
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        The page failed to load. Our team has been notified.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Reload page
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <Provider store={store}>
        <App />
      </Provider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
