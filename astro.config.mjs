import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://book.izignamx.com",
  output: "static",
  trailingSlash: "always",
  integrations: [react()],
  build: {
    format: "directory",
    inlineStylesheets: "auto"
  }
});
