import type { CapacitorConfig } from "@capacitor/cli";

// Store apps: Capacitor wraps the static export (out/) in a native shell. See docs/STORE.md.
// appId is the permanent identity in the stores – it can still be changed until the first upload.
// It follows the GitHub namespace of the project (io.github.<account>), which needs no own domain.
const config: CapacitorConfig = {
  appId: "io.github.yeccard68.wunder",
  appName: "Wunder",
  webDir: "out",
  backgroundColor: "#f6f3ee",
  android: {
    // the app is in the stores, not a debug build: no web inspector, no plain-http requests
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
  },
  plugins: {
    // the app draws behind the status and navigation bars and pads itself with env(safe-area-inset-*)
    SystemBars: { insetsHandling: "native", initialViewportFitValueHint: "cover" },
  },
};

export default config;
