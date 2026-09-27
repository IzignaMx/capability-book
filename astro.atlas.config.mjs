import react from "@astrojs/react";
import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://book.izignamx.com",
  srcDir: "./atlas",
  publicDir: "./public",
  outDir: "./dist",
  cacheDir: "./.astro-atlas",
  output: "static",
  trailingSlash: "always",
  integrations: [react()],
  build: { format: "directory", inlineStylesheets: "never" },
  security: { csp: {
    scriptDirective: { resources: ["'self'", {resource:"'none'",kind:"attribute"}] },
    styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    directives: ["default-src 'self'", "font-src 'self' data: https://izignamx.com", "img-src 'self' data: blob:", "media-src 'self' blob:", "connect-src 'self'", "worker-src 'self' blob:", "frame-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]
  } }
});
