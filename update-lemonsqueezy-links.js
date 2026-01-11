const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = __dirname;

console.log('Updating Lemon Squeezy store links...\n');
console.log('Old store: https://notionrealm.lemonsqueezy.com/');
console.log('New store: https://ocrivia.lemonsqueezy.com/\n');

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
});

let filesUpdated = 0;
let totalReplacements = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Count occurrences in this file
    const matches = html.match(/https:\/\/notionrealm\.lemonsqueezy\.com\//g);

    if (matches && matches.length > 0) {
        // Replace all occurrences
        const newHtml = html.replace(/https:\/\/notionrealm\.lemonsqueezy\.com\//g, 'https://ocrivia.lemonsqueezy.com/');

        fs.writeFileSync(filePath, newHtml, 'utf8');

        console.log(`✓ ${file} - ${matches.length} link(s) updated`);
        filesUpdated++;
        totalReplacements += matches.length;
    }
});

console.log(`\n✅ Updated ${totalReplacements} links across ${filesUpdated} files`);
console.log('=== Lemon Squeezy Store Update Complete ===');
