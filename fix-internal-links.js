const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.notionrealm.com';

async function fixInternalLinks() {
    console.log('Starting internal link correction...');

    const files = glob.sync('**/*.html', {
        ignore: ['node_modules/**', 'wp-admin/**', 'wp-includes/**']
    });

    let totalFixed = 0;

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        const $ = cheerio.load(content, { decodeEntities: false });
        let fileChanged = false;

        // 1. Fix Absolute Links with /blog/ prefix
        $('a[href^="https://www.notionrealm.com/blog/best-notion-templates/"]').each((i, el) => {
            const oldHref = $(el).attr('href');
            const newHref = oldHref.replace('/blog/best-notion-templates/', '/best-notion-templates/');
            $(el).attr('href', newHref);
            fileChanged = true;
            console.log(`Fixed absolute link in ${file}: ${oldHref} -> ${newHref}`);
        });

        $('a[href^="https://www.notionrealm.com/blog/free-notion-templates/"]').each((i, el) => {
            const oldHref = $(el).attr('href');
            const newHref = oldHref.replace('/blog/free-notion-templates/', '/free-notion-templates/');
            $(el).attr('href', newHref);
            fileChanged = true;
            console.log(`Fixed absolute link in ${file}: ${oldHref} -> ${newHref}`);
        });

        // 2. Fix Relative Links with wrong depth or /blog/ prefix
        // We calculate the correct depth to the root
        const depth = file.split(/[\\\/]/).length - 1;
        const rootPrefix = depth === 0 ? './' : '../'.repeat(depth);

        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (!href) return;

            // Target links that go to /blog/best-notion-templates/ or /blog/free-notion-templates/
            // Case 1: href="blog/best-notion-templates/" from root
            if (depth === 0 && href === 'blog/best-notion-templates/') {
                $(el).attr('href', 'best-notion-templates/');
                fileChanged = true;
            }
            if (depth === 0 && href === 'blog/free-notion-templates/') {
                $(el).attr('href', 'free-notion-templates/');
                fileChanged = true;
            }

            // Case 2: href="../best-notion-templates/" from blog/subdir/ (depth 2)
            // This should be ../../best-notion-templates/
            if (depth === 2 && file.startsWith('blog' + path.sep) && href === '../best-notion-templates/') {
                $(el).attr('href', '../../best-notion-templates/');
                fileChanged = true;
            }
            if (depth === 2 && file.startsWith('blog' + path.sep) && href === '../free-notion-templates/') {
                $(el).attr('href', '../../free-notion-templates/');
                fileChanged = true;
            }

            // Generic fix for any link that contains /blog/best-notion-templates/ but shouldn't
            if (href.includes('/blog/best-notion-templates/')) {
                $(el).attr('href', href.replace('/blog/best-notion-templates/', '/best-notion-templates/'));
                fileChanged = true;
            }
            if (href.includes('/blog/free-notion-templates/')) {
                $(el).attr('href', href.replace('/blog/free-notion-templates/', '/free-notion-templates/'));
                fileChanged = true;
            }
        });

        if (fileChanged) {
            fs.writeFileSync(file, $.html());
            totalFixed++;
        }
    }

    console.log(`Finished! Fixed links in ${totalFixed} files.`);

    // 3. Remove the problematic empty directories
    const dirsToRemove = [
        'blog/best-notion-templates',
        'blog/free-notion-templates'
    ];

    for (const dir of dirsToRemove) {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing problematic directory: ${dir}`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    }
}

fixInternalLinks().catch(err => {
    console.error('Error fixing internal links:', err);
    process.exit(1);
});
