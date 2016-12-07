/* eslint-env node */

const {addExtension} = require('rollup-pluginutils');
const path = require('path');

module.exports = function(options = {}) {
  const projectRoot = process.cwd();
  const fullOriginalPath = path.join(projectRoot, addExtension(options.originalPath));
  const fullTargetPath = path.join(projectRoot, addExtension(options.targetPath));

  return {
    name: 'remap',

    resolveId(importee, importer) {
      if (!importer) {
        return null;
      }

      const fullImportPath = path.join(path.dirname(importer), addExtension(importee));

      if (fullImportPath === fullOriginalPath) {
        return fullTargetPath;
      }

      return null;
    }
  };
};
