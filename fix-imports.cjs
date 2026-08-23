const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('D:/yousef-ramy/desktop-reporter/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix single-line imports
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]*shared\/domain\/entities)['"]/g, 'import type { $1 } from \'$2\'');
    
    // Fix multi-line imports
    // interfaces.ts has:
    // import {
    //   Transaction, ...
    // } from '../../../shared/domain/entities';
    
    // Using a regex that allows newlines in the imported names list:
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]*shared\/domain\/entities)['"]/g, 'import type { $1 } from \'$2\'');

    // Also fix any imports from any file named "interfaces" or ending in "interfaces"
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]*interfaces)['"]/g, 'import type { $1 } from \'$2\'');

    fs.writeFileSync(file, content, 'utf8');
});
