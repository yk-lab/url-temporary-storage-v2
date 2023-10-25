import tailwind from "prettier-plugin-tailwindcss";

import type { Options } from "prettier";

export default {
  printWidth: 80,
  trailingComma: "all",
  htmlWhitespaceSensitivity: "css",
  plugins: [tailwind],
} as Options;
