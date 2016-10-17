import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import multyEntry from 'rollup-plugin-multi-entry';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';

export default {
  plugins: [
    globals(),
    builtins(),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false
    }),
    multyEntry({
      exports: false
    }),
    babel()
  ]
};
