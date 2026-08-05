export const loadGoogleSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.google) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log("Google SDK loaded");
            resolve();
        };
        script.onerror = (err) => {
            console.error("Failed to load Google SDK", err);
            reject(err);
        };
        document.head.appendChild(script);
    });
};

export const initializeGoogleLogin = (
    clientId: string,
    callback: (response: any) => void
) => {
    if (!window.google) {
        console.error("Google SDK not loaded");
        return;
    }

    window.google.accounts.id.initialize({
        client_id: clientId,
        callback: callback,
    });
};

export const renderGoogleButton = (
    containerId: string,
    options: any = { theme: "outline", size: "large", width: "100%" }
) => {
    if (!window.google) {
        console.error("Google SDK not loaded");
        return;
    }

    const container = document.getElementById(containerId);
    if (container) {
        window.google.accounts.id.renderButton(container, options);
    }
};

declare global {
    interface Window {
        google: any;
    }
}
