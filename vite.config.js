import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/
// so assets must be requested relative to that prefix.
export default defineConfig({
  plugins: [react()],
  base: "/CPM/",
});
