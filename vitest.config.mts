import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next.js only lets server code import `server-only`; in these tests, every module is server code
      "server-only": fileURLToPath(new URL("./test/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/support/setup.ts"],
    server: {
      deps: {
        // Its ESM build imports `next/server` without a file extension, which only bundlers resolve
        inline: ["@kya-os/checkpoint-nextjs"],
      },
    },
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
