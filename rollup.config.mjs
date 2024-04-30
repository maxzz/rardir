import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";
import builtins from 'builtin-modules';

//console.log(builtins);

export default {
    input: 'dist/src/index.js',
    output: {
        file: 'dist/all.mjs',
        format: 'es'
    },
    plugins: [
        resolve({
            preferBuiltins: true
        }),
        commonjs({
            include: [
                'node_modules/**',
            ],
        }),
        json(),
    ],
    // external: [...builtins, 'node-chalk'],
    external: builtins,
    // external: [
    //     'child_process',
    //     'os',
    //     'fs',
    //     'path',
    //     'url'
    // ]
};
