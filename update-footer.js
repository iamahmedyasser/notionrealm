const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const baseDir = __dirname;

console.log('Updating footer copyright text...\n');

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
});

let filesUpdated = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    const html = fs.readFileSync(filePath, 'utf8');

    // Check if file contains the old copyright text
    if (html.includes('Copyright  – All rights reserved') || html.includes('Copyright – All rights reserved')) {
        const $ = cheerio.load(html);

        // Find and replace the copyright text
        $('p, footer').each((i, el) => {
            const $el = $(el);
            let text = $el.html();

            if (text && (text.includes('Copyright  – All rights reserved') || text.includes('Copyright – All rights reserved'))) {
                text = text.replace(/Copyright\s*–\s*All rights reserved/g, '© Notionrealm - All rights reserved');
                $el.html(text);
            }
        });

        fs.writeFileSync(filePath, $.html(), 'utf8');
        console.log(`✓ Updated: ${file}`);
        filesUpdated++;
    }
});

console.log(`\n✅ Updated ${filesUpdated} files`);
console.log('=== Footer Update Complete ===');
