import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

function copyPdfjsFonts(): Plugin {
  const copy = () => {
    const target = path.join(frontendRoot, "public/pdfjs/standard_fonts");
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(frontendRoot, "node_modules/pdfjs-dist/standard_fonts"), target, { recursive: true });
  };
  return {
    name: "copy-pdfjs-standard-fonts",
    buildStart: copy,
    configureServer: copy,
  };
}

export default defineConfig({
  plugins: [react(), copyPdfjsFonts()],
  server: {
    port: 5173,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
