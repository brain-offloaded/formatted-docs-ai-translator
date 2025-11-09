const fs = require('fs-extra');
const path = require('path');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  const resourcesDir = path.join(appOutDir, 'resources', 'app');
  const nodeModulesSource = path.join(context.projectDir, 'node_modules');
  const nodeModulesTarget = path.join(resourcesDir, 'node_modules');

  console.log('Copying node_modules to', nodeModulesTarget);
  
  await fs.copy(nodeModulesSource, nodeModulesTarget, {
    filter: (src) => {
      const relativePath = path.relative(nodeModulesSource, src);
      // Skip unnecessary files
      if (relativePath.match(/\/(test|tests|__tests__|examples?|docs?|\.cache)\//)) return false;
      if (relativePath.match(/\.(md|markdown|txt|map)$/i)) return false;
      return true;
    }
  });

  console.log('node_modules copied successfully');
};
