import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react()], // Temporarily removed lovable-tagger to debug
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
