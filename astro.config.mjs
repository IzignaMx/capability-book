import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://book.izignamx.com",
  output: "static",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
  build: {
    format: "directory",
    inlineStylesheets: "auto"
  }
});
