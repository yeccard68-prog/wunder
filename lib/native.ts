// The app runs in two shells: the browser (wunder-one.vercel.app) and the store apps, where
// Capacitor shows the same static export inside a native WebView. Everything that has to behave
// differently in the store apps is collected here.
import { Capacitor } from "@capacitor/core";

/** The public web address – links in e-mails must lead there, not to the app's internal origin. */
export const WEB_ORIGIN = "https://wunder-one.vercel.app";

export const isNative = () => Capacitor.isNativePlatform();

/** One line in the device log once the app is ready – the automatic start check looks for it. */
export function reportReady(screen: string) {
  if (isNative()) console.info(`wunder:ready ${screen}`);
}

/** Where a link in an e-mail should send the learner back to. */
export const linkOrigin = () => (isNative() ? WEB_ORIGIN : window.location.origin);

/**
 * Android's back button: first close an open sheet (it listens for Escape), then go back in the
 * app's own history, and on the first screen send the app to the background like other apps do.
 */
export async function setupNative() {
  if (!isNative()) return () => {};
  const { App } = await import("@capacitor/app");
  const handle = await App.addListener("backButton", ({ canGoBack }) => {
    if (document.querySelector("[role=dialog]")) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      return;
    }
    if (canGoBack) window.history.back();
    else App.minimizeApp();
  });
  return () => handle.remove();
}
