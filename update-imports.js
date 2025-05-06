const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all imports of the old auth options location
const filesToUpdate = execSync(
  `grep -l "import { authOptions } from .*/api/auth/\\[...nextauth\\]/route" --include="*.ts" --include="*.tsx" -r src/app`
)
  .toString()
  .trim()
  .split('\n');

console.log(`Found ${filesToUpdate.length} files to update`);

// Process each file
filesToUpdate.forEach(file => {
  if (!file) return;
  
  console.log(`Updating ${file}`);
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import statements - both absolute and relative paths
  content = content.replace(
    /import\s+{\s*authOptions\s*}\s+from\s+['"].*\/auth\/\[\.\.\.nextauth\]\/route['"]/g,
    `import { authOptions } from '@/lib/auth'`
  );
  
  fs.writeFileSync(file, content);
});

console.log('All imports updated successfully!'); 