/**
 * @type {import('rollup').RollupOptions}
 */
import { nodeResolve } from '@rollup/plugin-node-resolve'
import merge from 'deepmerge'
import path from 'node:path'
import typescriptPlugin from 'rollup-plugin-typescript2'
import typescript from 'typescript'

import pkg from './package.json'

const tsconfig = path.join(__dirname, 'tsconfig.json')

// treat as externals not relative and not absolute paths
const external = (id) => !id.startsWith('.') && !id.startsWith('/')

const input = './src/index.ts'
const extensions = ['.ts', '.tsx']
const tsconfigOverride = { 
  compilerOptions: {},
  exclude: ['node_modules', '**/__tests__/**']  // omit all tests from dist by default
}
const tsconfigOverrideNoTypes = { 
  compilerOptions: { declaration: false }, 
  exclude: ['node_modules', '**/__tests__/**'] 
}

const umdOutput = {
  input,
  external,
  output: {
    file: pkg.main,
    format: 'umd',
    name: 'ifvisible',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({ extensions }),
    typescriptPlugin({ typescript, tsconfig, tsconfigOverride: tsconfigOverrideNoTypes }),
  ],
}

const config = [
  // dist umd
  merge(umdOutput, { output: { file: pkg.main } }),
  // docs umd with no types
  merge(umdOutput, { output: { file: 'docs/index.js' } }),
  // dist es
  {
    input,
    external,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      nodeResolve({ extensions }),
      typescriptPlugin({ typescript, tsconfig, tsconfigOverride }),
    ],
  },
]

export default config
