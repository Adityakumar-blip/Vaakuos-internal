import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// Captured at build time — a browser bundle has no git access at runtime.
function buildInfo() {
  const git = (cmd: string) => {
    try {
      return execSync(cmd).toString().trim();
    } catch {
      return "unknown";
    }
  };
  const version = JSON.parse(
    readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
  ).version;
  return {
    version,
    commit: git("git rev-parse --short HEAD"),
    commitFull: git("git rev-parse HEAD"),
    commitDate: git("git log -1 --format=%cI"),
    commitMessage: git("git log -1 --format=%s"),
    branch: git("git rev-parse --abbrev-ref HEAD"),
    buildTime: new Date().toISOString(),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD__: JSON.stringify({ ...buildInfo(), mode }),
  },
  server: {
    host: "localhost",
    port: 8090,
    allowedHosts: ["localhost", "vaakuos.local", "vaakuos.com"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
