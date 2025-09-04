import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: {
            rardir: 'src/index.ts',
            cli: 'src/cli.ts',
        },
        format: ['esm'],
        //noExternal: ['pm-manifest', '@pmac/template', 'fast-xml-parser'],
    },
]);