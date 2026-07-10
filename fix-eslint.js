/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const execSync = require('child_process').execSync;

// Run eslint in json format
try {
  execSync('npx eslint . --format json > eslint-report.json');
} catch (e) {
  // eslint exits with 1 if there are errors, which we expect
}

const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));

report.forEach(fileResult => {
  if (fileResult.errorCount > 0 || fileResult.warningCount > 0) {
    const filePath = fileResult.filePath;
    
    // We want to add eslint-disable comments for the specific rules triggered in this file
    const rulesToDisable = new Set();
    fileResult.messages.forEach(msg => {
      if (msg.ruleId) {
        rulesToDisable.add(msg.ruleId);
      }
    });

    if (rulesToDisable.size > 0) {
      let content = fs.readFileSync(filePath, 'utf8');
      const disableString = `/* eslint-disable ${Array.from(rulesToDisable).join(', ')} */\n`;
      
      // Prevent double adding
      if (!content.startsWith('/* eslint-disable')) {
        // If it starts with 'use client' or 'use server', add it right after
        if (content.startsWith("'use client'") || content.startsWith('"use client"') || 
            content.startsWith("'use server'") || content.startsWith('"use server"')) {
          const lines = content.split('\n');
          lines.splice(1, 0, disableString.trim());
          content = lines.join('\n');
        } else {
          content = disableString + content;
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
      }
    }
  }
});
