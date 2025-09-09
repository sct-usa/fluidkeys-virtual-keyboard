import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "FluidKeys Virtual Keyboard",
    description: "A customizable virtual keyboard for Chrome.",
    version: "0.2.1",
    permissions: ["storage"],
  },
  runner: {
    chromiumArgs: ["http://localhost:3000/test.html"],
  },
});
