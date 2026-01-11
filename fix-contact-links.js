const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const baseDir = __dirname;

console.log('Fixing contact page links...\n');

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
});

let filesUpdated = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    const html = fs.readFileSync(filePath, 'utf8');

    // Check if file contains the broken contact link
    if (html.includes('index.php/contact/')) {
        const $ = cheerio.load(html);

        // Find and fix contact links
        $('a[href*="index.php/contact"]').each((i, el) => {
            const $link = $(el);
            const href = $link.attr('href');

            if (href) {
                // Replace index.php/contact/ with contact/
                const newHref = href.replace(/index\.php\/contact\//g, 'contact/');
                $link.attr('href', newHref);
            }
        });

        fs.writeFileSync(filePath, $.html(), 'utf8');
        console.log(`✓ Fixed: ${file}`);
        filesUpdated++;
    }
});

console.log(`\n✅ Fixed ${filesUpdated} files`);
console.log('=== Contact Link Fix Complete ===');
