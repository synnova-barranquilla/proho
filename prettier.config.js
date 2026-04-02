//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '^react$',
    '^react-dom$',
    '',
    '^@tanstack/(.*)$',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^#/(.*)$',
    '^[.]',
    '',
    '^.+\\.css',
  ],
  importOrderTypeScriptVersion: '5.9.3',
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
}

export default config
