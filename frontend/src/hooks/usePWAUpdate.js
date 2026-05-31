import { useEffect, useState } from "react";

const APP_VERSION = __APP_VERSION__; // Injected at build time

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    // Check for version changes in localStorage
    const checkVersionUpdate = () => {
      const storedVersion = localStorage.getItem("fanfare-app-version");

      if (storedVersion && storedVersion !== APP_VERSION) {
        localStorage.setItem("fanfare-app-version", APP_VERSION);
        // Auto-refresh for version updates
        window.location.reload();
        return;
      } else if (!storedVersion) {
        localStorage.setItem("fanfare-app-version", APP_VERSION);
      }
    };

    // Check version on load
    checkVersionUpdate();

    // Service Worker registration and update handling
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 30 seconds
        const interval = setInterval(() => {
          registration.update();
        }, 30000);

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              // Auto-refresh after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          });
        });

        // Handle controller change (new service worker activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setNeedsRefresh(true);
          // Auto-refresh when new service worker takes control
          window.location.reload();
        });

        // Clean up interval on unmount
        return () => clearInterval(interval);
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case "SKIP_WAITING":
              setNeedsRefresh(true);
              break;
            case "SW_UPDATED":
              setUpdateAvailable(true);
              // Auto-refresh for service worker updates
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              break;
          }
        }
      });
    }

    // Also check for updates when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const forceRefresh = () => {
    window.location.reload();
  };

  return {
    updateAvailable,
    needsRefresh,
    forceRefresh,
    version: APP_VERSION,
  };
}
