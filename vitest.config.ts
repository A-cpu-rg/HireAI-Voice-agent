import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    // Deterministic, dependency-free values so unit tests never touch real
    // infrastructure or require developer secrets.
    env: {
      NODE_ENV: "test",
      AUTH_SECRET: "test-secret-value-at-least-16-chars-long",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
      APP_URL: "http://localhost:3000",
      BOLNA_WEBHOOK_SECRET: "test-webhook-secret",
    },
  },
});
