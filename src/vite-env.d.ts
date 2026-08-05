/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_FACEBOOK_APP_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Injected by vite.config.ts `define` at build time.
declare const __APP_BUILD__: {
    version: string;
    commit: string;
    commitFull: string;
    commitDate: string;
    commitMessage: string;
    branch: string;
    buildTime: string;
    mode: string;
};

// Shopify App Bridge global, present only when the app runs inside the Shopify admin iframe.
interface ShopifyAppBridge {
    idToken(): Promise<string>;
    config: { shop?: string; host?: string };
}
interface Window {
    shopify?: ShopifyAppBridge;
    __nativeFetch?: typeof fetch;
}
