/* eslint-env node */
import {readFileSync} from 'fs';
import babel from 'rollup-plugin-babel';
import remap from 'rollup-plugin-remap';

const plugins = [babel()];
const targets = [];

let entry;

// eslint-disable-next-line no-process-env
if (process.env.BUILD_MODE === 'production') {
  entry = 'src/client.js';

  plugins.push(remap({
    originalPath: './src/profile-schema-usage',
    targetPath: './src/fake-profiler'
  }));

  targets.push(
    {dest: 'index.js', format: 'cjs'},
    {dest: 'index.es.js', format: 'es'}
  );
} else {
  entry = 'src/client-dev.js';

  targets.push(
    {dest: 'dev.js', format: 'cjs'},
    {dest: 'dev.es.js', format: 'es'}
  );
}

const banner = `/*
${readFileSync('./LICENSE.md')}
*/`;

export default {
  plugins,
  targets,
  banner,
  entry,
  moduleName: 'GraphQLClient',
  sourceMap: true
};
