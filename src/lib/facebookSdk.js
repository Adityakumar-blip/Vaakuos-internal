// facebookSDK.js
let isInitialized = false;
let wabaId = null;
let phoneId = null;

// Set up MessageEvent listener for receiving session info
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://www.facebook.com") return;

    try {
      const data = JSON.parse(event.data);
      console.log("Received message from Facebook:", data);

      if (data.type === "WA_EMBEDDED_SIGNUP_EVENT") {
        if (data.event === "FINISH") {
          const { waba_id, phone_number_id } = data.data;
          wabaId = waba_id;
          phoneId = phone_number_id;
          console.log("Captured WABA ID:", wabaId, "Phone ID:", phoneId);
        }
      }
    } catch (e) {
      // Message might not be JSON, ignore
    }
  });
}

const initFB = () => {
  window.FB.init({
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    autoLogAppEvents: true,
    xfbml: true,
    version: "v24.0",
  });
  isInitialized = true;
};

/**
 * Resolves only once FB.init has actually run — `window.FB` existing is not
 * enough, and calling FB.login on a merely-present SDK fails silently.
 */
export const loadFacebookSDK = (callback, onError) => {
  const fail = (message) => {
    console.error(message);
    if (onError) onError(message);
  };

  if (isInitialized) {
    if (callback) callback();
    return;
  }

  if (window.FB) {
    try {
      initFB();
    } catch (error) {
      fail("Could not initialise the Facebook SDK.");
      return;
    }
    if (callback) callback();
    return;
  }

  // Define fbAsyncInit before loading the script
  window.fbAsyncInit = function () {
    try {
      initFB();
      if (callback) callback();
    } catch (error) {
      fail("Could not initialise the Facebook SDK.");
    }
  };

  // Inject the script
  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      // Script is in flight from an earlier call; fbAsyncInit above will fire.
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.async = true;
    js.defer = true;
    js.crossorigin = "anonymous";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.onerror = () =>
      fail("Could not reach Facebook. Check your connection or ad blocker.");
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};

export const launchWhatsAppSignup = (onSuccess, onError) => {
  const fail = (message) => {
    console.error(message);
    if (onError) onError(message);
  };

  if (!window.FB || !isInitialized) {
    fail("Facebook SDK is not ready yet. Please try again in a moment.");
    return;
  }

  // Meta rejects FB.login on http and returns without ever calling back, which
  // would strand the caller's loading state. Refuse up front instead.
  if (window.location.protocol !== "https:") {
    fail("Connecting WhatsApp requires HTTPS — this page is served over HTTP.");
    return;
  }

  console.log("Launching WhatsApp signup popup...");
  try {
    window.FB.login(
      (response) => {
        console.log("Facebook login callback received:", response);
        if (response.authResponse) {
          const code = response.authResponse.code;
          console.log(
            "Signup success, received code. Sending with WABA ID:",
            wabaId,
            "Phone ID:",
            phoneId,
          );
          if (onSuccess) {
            onSuccess({
              code,
              redirectUri: "https://app.vaakuos.com/dashboard",
              waba_id: wabaId,
              phone_number_id: phoneId,
            });
          }
        } else {
          console.log("Signup cancelled or failed:", response);
          if (onError) onError(response);
        }
      },
      {
        config_id: import.meta.env.VITE_SIGNUP_CONFIGURATION_KEY,
        response_type: "code",
        override_default_response_type: true,
        scope: "whatsapp_business_management,whatsapp_business_messaging",
        extras: {
          setup: {},
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: "3",
        },
      },
    );
  } catch (error) {
    console.error("Exception during FB.login:", error);
    if (onError) onError(error);
  }
};
