const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.notionrealm.com';

async function patchCanonicalUrls() {
    console.log('Starting Canonical URL Patching...');

    const files = glob.sync('**/*.html', {
        ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
    });

    console.log(`Found ${files.length} HTML files to process.`);

    let modifiedCount = 0;

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        const $ = cheerio.load(content, { decodeEntities: false });
        let modified = false;

        // Calculate Pretty URL
        // Example: blog/what-is-notion/index.html -> blog/what-is-notion/
        // Example: index.html -> /
        let relativePath = file.replace(/\\/g, '/');

        let prettyPath = relativePath;
        if (prettyPath.endsWith('index.html')) {
            prettyPath = prettyPath.slice(0, -'index.html'.length);
        } else if (prettyPath.endsWith('.html')) {
            prettyPath = prettyPath.slice(0, -'.html'.length) + '/';
        }

        if (!prettyPath.startsWith('/')) {
            prettyPath = '/' + prettyPath;
        }

        const absoluteUrl = `${BASE_URL}${prettyPath}`;

        // 1. Update <link rel="canonical">
        const canonical = $('link[rel="canonical"]');
        if (canonical.length > 0) {
            const currentHref = canonical.attr('href');
            if (currentHref !== absoluteUrl) {
                console.log(`[${file}] Updating canonical: ${currentHref} -> ${absoluteUrl}`);
                canonical.attr('href', absoluteUrl);
                modified = true;
            }
        } else {
            console.log(`[${file}] Warning: No canonical tag found. Adding one.`);
            $('head').append(`<link rel="canonical" href="${absoluteUrl}">`);
            modified = true;
        }

        // 2. Update <meta property="og:url">
        const ogUrl = $('meta[property="og:url"]');
        if (ogUrl.length > 0) {
            const currentContent = ogUrl.attr('content');
            if (currentContent !== absoluteUrl) {
                console.log(`[${file}] Updating og:url: ${currentContent} -> ${absoluteUrl}`);
                ogUrl.attr('content', absoluteUrl);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(file, $.html());
            modifiedCount++;
        }
    }

    console.log(`\nFinished! Modified ${modifiedCount} files.`);
}

patchCanonicalUrls().catch(err => {
    console.error('Error patching canonical URLs:', err);
    process.exit(1);
});
