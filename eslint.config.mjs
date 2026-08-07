import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// Next 16 で `next lint` が廃止されたため、ESLint CLI を直接使う（`yarn lint`）。
// eslint-config-next は flat config の配列をそのまま export している。
const config = [
    // ビルド成果物・依存は対象外（.gitignore と揃える）
    { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", ".vercel/**", ".netlify/**", "coverage/**"] },
    ...nextCoreWebVitals,
    ...nextTypeScript,
];

export default config;
