const fs = require('fs');
const path = require('path');

// Target IDs based on inspection of notion-templates/index.html
const BUNDLE_ROW_ID = 'wp-block-themeisle-blocks-advanced-columns-cc41659b';
const BUNDLE_COL_ID = 'wp-block-themeisle-blocks-advanced-column-cfed8ab9';
const HABIT_ROW_ID = 'wp-block-themeisle-blocks-advanced-columns-29cb8890';

function traverseDirectory(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!/node_modules|wp-content|wp-admin|wp-includes/.test(file)) {
                traverseDirectory(fullPath, callback);
            }
        } else if (file.endsWith('.html')) {
            callback(fullPath);
        }
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // --- Fix 1: Habit Row (Equal Height) ---
    if (content.includes(HABIT_ROW_ID)) {
        const rowRegex = new RegExp(`(<div id="${HABIT_ROW_ID}"[^>]*class=")([^"]*)(")`);
        const match = content.match(rowRegex);
        if (match) {
            const originalClasses = match[2];
            let newClasses = originalClasses.replace(/\bhas-vertical-center\b/g, '').replace(/\s{2,}/g, ' ').trim();
            if (originalClasses !== newClasses) {
                content = content.replace(match[0], `${match[1]}${newClasses}${match[3]}`);
                modified = true;
            }
        }
    }

    // --- Fix 2: Ultimate Bundle "Box in Box" -> Transparent Child ---
    if (content.includes(BUNDLE_ROW_ID)) {
        // Parent: Ensure 'has-light-bg'
        const parentRegex = new RegExp(`(<div id="${BUNDLE_ROW_ID}"[^>]*class=")([^"]*)(")`);
        const parentMatch = content.match(parentRegex);
        if (parentMatch) {
            let newClasses = parentMatch[2];
            if (!newClasses.includes('has-light-bg')) newClasses = `${newClasses} has-light-bg`;
            newClasses = newClasses.replace(/\s{2,}/g, ' ').trim();
            if (parentMatch[2] !== newClasses) {
                content = content.replace(parentMatch[0], `${parentMatch[1]}${newClasses}${parentMatch[3]}`);
                modified = true;
            }
        }

        // Child: Remove 'has-light-bg', force Transparent
        const childRegex = new RegExp(`(<div id="${BUNDLE_COL_ID}")([^>]*)>`);
        const childMatch = content.match(childRegex);
        if (childMatch) {
            let attrs = childMatch[2];
            // Remove class
            if (attrs.includes('class="')) {
                attrs = attrs.replace(/class="([^"]*)"/, (m, c) => `class="${c.replace(/\bhas-light-bg\b/g, '').trim()}"`);
            }
            // Add/Update style
            const styleString = 'background-color: transparent !important; box-shadow: none !important; border: none !important;';
            if (attrs.includes('style="')) {
                attrs = attrs.replace(/style="([^"]*)"/, (m, s) => `style="${s} ${styleString}"`);
            } else {
                attrs += ` style="${styleString}"`;
            }

            const newTag = `<div id="${BUNDLE_COL_ID}"${attrs}>`;
            if (childMatch[0] !== newTag) {
                content = content.replace(childMatch[0], newTag);
                modified = true;
            }
        }
    }

    // --- Fix 3: Sticky Nav Background (Off-White) ---
    // Target the CSS definition directly
    if (content.includes('.sticky-nav')) {
        // Look for: background: rgba(255, 255, 255, 0.9);
        // Replace with: background: #f7f7f5 !important;
        const originalCss = 'background: rgba(255, 255, 255, 0.9);';
        const newCss = 'background: #f7f7f5 !important;';

        if (content.includes(originalCss)) {
            content = content.replace(originalCss, newCss);
            modified = true;
            console.log(`[${filePath}] Updated .sticky-nav background to off-white.`);
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log('Starting template page layout fixes v4...');
traverseDirectory(__dirname, processFile);
console.log('Fixes completed.');
