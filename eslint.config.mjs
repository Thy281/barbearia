import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts'] },
  ...tseslint.configs.recommended,
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } }
);
