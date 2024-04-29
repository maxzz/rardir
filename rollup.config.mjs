import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'builtin-modules';

console.log(builtins);

export default {
    input: 'dist/index.js',
    output: {
        file: 'dist/all.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs()
    ],
    // preferBuiltins: true,
    external: builtins,
    // external: [
    //     'child_process',
    //     'os',
    //     'fs',
    //     'path',
    //     'url'
    // ]
};
