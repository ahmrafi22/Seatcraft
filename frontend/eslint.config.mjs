import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "scripts/**",
      // Vendored Stageshow kit: third-party source, kept byte-for-byte apart
      // from the type-safety fixes strict mode required.
      "src/components/stage/kit/**"
    ]
  }
];

export default config;
