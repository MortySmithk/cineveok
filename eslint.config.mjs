// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Recomendado: especificar de onde os plugins devem ser resolvidos
  resolvePluginsRelativeTo: __dirname,
});

const eslintConfig = [
  // Usar compat.extends para configurações feitas para o formato antigo
  ...compat.extends("next/core-web-vitals"),
  // A configuração 'next/core-web-vitals' geralmente já inclui
  // o suporte necessário para TypeScript em projetos Next.js.

  // Ignores globais usando o novo formato
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;