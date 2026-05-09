const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = __dirname;
console.log('Adding Affiliate link to footer...\n');

const htmlFiles = glob.sync('**/*.html', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
});

let filesUpdated = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Check if the affiliate link already exists
    if (!html.includes('https://ocrivia.lemonsqueezy.com/affiliates')) {
        // We'll replace the exact string "Terms &amp;\s+Conditions</strong></a>" with the same plus the affiliate link
        const targetRegex = /(Terms\s*&amp;[\s\n]+Conditions<\/strong><\/a>)/gi;
        
        if (targetRegex.test(html)) {
            html = html.replace(targetRegex, '$1 | <a href="https://ocrivia.lemonsqueezy.com/affiliates" target="_blank" rel="noreferrer noopener"><strong>Affiliate</strong></a>');
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`✓ Updated: ${file}`);
            filesUpdated++;
        }
    }
});

console.log(`\n✅ Updated ${filesUpdated} files`);
