
const fs = require('fs');
const path = require('path');

// CSS to inject
const cssBlock = `
/* Mobile Header Fixes */
@media (max-width: 768px) {
    /* Unhide Logo (just in case) */
    .o-hide-on-mobile {
        display: block !important;
        margin-bottom: 15px;
    }

    /* Allow Wrapping & Stacking */
    header .wp-block-group.is-nowrap {
        flex-wrap: wrap !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
        gap: 15px !important;
    }

    /* Adjust Navigation */
    header nav ul {
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
        padding-left: 0 !important;
        gap: 15px !important;
    }
    
    /* Ensure Button is visible and centered */
    header .wp-block-buttons {
        width: 100%;
        justify-content: flex-start !important;
        margin-top: 10px;
    }
}
`;

// Old CSS to find and replace
const oldCssBlock = `
/* Mobile Header Fixes */
@media (max-width: 768px) {
    /* Unhide Logo (just in case) */
    .o-hide-on-mobile {
        display: block !important;
        margin-bottom: 15px;
    }

    /* Allow Wrapping & Stacking */
    header .wp-block-group.is-nowrap {
        flex-wrap: wrap !important;
        flex-direction: column !important;
        justify-content: center !important;
        gap: 15px !important;
    }

    /* Adjust Navigation */
    header nav ul {
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 15px !important;
    }
    
    /* Ensure Button is visible and centered */
    header .wp-block-buttons {
        width: 100%;
        justify-content: center !important;
        margin-top: 10px;
    }
}
`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // Ignore node_modules, wp-content, wp-admin, wp-includes
            if (!/node_modules|wp-content|wp-admin|wp-includes/.test(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            if (path.extname(f) === '.html') {
                callback(dirPath);
            }
        }
    });
}

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    // 1. Remove o-hide-on-mobile from logo
    // Target: <div class="o-hide-on-mobile wp-block-site-logo">
    if (content.includes('class="o-hide-on-mobile wp-block-site-logo"')) {
        content = content.replace('class="o-hide-on-mobile wp-block-site-logo"', 'class="wp-block-site-logo"');
        modified = true;
    }

    // 2. Inject or Update CSS
    // Trim blocks to avoid whitespace issues
    const cleanOldCss = oldCssBlock.trim();
    const cleanNewCss = cssBlock.trim();

    if (content.includes(cleanOldCss)) {
        // REPLACE existing old block
        content = content.replace(cleanOldCss, cleanNewCss);
        modified = true;
    } else if (!content.includes('/* Mobile Header Fixes */')) {
        // Inject if not present at all
        if (content.includes('</style>')) {
            const lastStyleIndex = content.lastIndexOf('</style>');
            content = content.slice(0, lastStyleIndex) + "\n" + cleanNewCss + "\n" + content.slice(lastStyleIndex);
            modified = true;
        } else if (content.includes('</head>')) {
            content = content.replace('</head>', `<style>\n${cleanNewCss}\n</style></head>`);
            modified = true;
        }
    }

    // 3. Align Header Left (Logo & Nav)
    // Replace items-justified-center with items-justified-left in navigation context
    // Target: "items-justified-center no-wrap wp-block-navigation"
    if (content.includes('items-justified-center no-wrap wp-block-navigation')) {
        content = content.replaceAll('items-justified-center no-wrap wp-block-navigation', 'items-justified-left no-wrap wp-block-navigation');
        modified = true;
    }

    // Target: "is-horizontal is-content-justification-center is-nowrap" in nav element
    if (content.includes('is-horizontal is-content-justification-center is-nowrap')) {
        content = content.replaceAll('is-horizontal is-content-justification-center is-nowrap', 'is-horizontal is-content-justification-left is-nowrap');
        modified = true;
    }

    if (modified && content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Start walking from current directory
console.log("Starting batch update for header...");
walkDir(__dirname, updateFile);
console.log("Batch update complete.");
