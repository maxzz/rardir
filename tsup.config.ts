import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: {
            rardir: 'src/index.ts',
        },
        format: ['cjs'],
        //noExternal: ['pm-manifest', '@pmac/template', 'fast-xml-parser'],
    },
]);