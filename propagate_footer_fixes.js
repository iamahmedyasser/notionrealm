
const fs = require('fs');
const path = require('path');

// CSS to inject
const cssBlock = `
		/* Footer Links */
		.footer-links-row a {
			color: #555 !important;
			text-decoration: none !important;
			border-bottom: 1px solid transparent;
			transition: all 0.2s ease;
		}

		.footer-links-row a:hover {
			color: #000 !important;
			border-bottom: 1px solid #000;
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

    // 1. Fix HTML
    const markRegex = /<mark[^>]*style="background-color:rgba\(0, 0, 0, 0\);color:#616161"[^>]*>([\s\S]*?)<\/mark>/g;

    // Check if relevant footer content exists
    if (content.includes('Best Notion templates') && content.includes('Privacy Policy')) {
        const footerContextRegex = /(<p class="has-normal-font-size">Boost Productivity with Notion Templates<\/p>\s*<p class="has-small-font-size)([^"]*)(">)/;

        if (footerContextRegex.test(content)) {
            // Add class if not already there
            if (!content.includes('footer-links-row')) {
                content = content.replace(footerContextRegex, '$1 footer-links-row$3');
                modified = true;
            }

            // Strip marks
            const count = (content.match(markRegex) || []).length;
            if (count > 0) {
                content = content.replace(markRegex, '$1');
                modified = true;
            }
        }
    }

    // 2. Inject CSS
    if (!content.includes('.footer-links-row a {')) {
        if (content.includes('</style>')) {
            const lastStyleIndex = content.lastIndexOf('</style>');
            content = content.slice(0, lastStyleIndex) + cssBlock + content.slice(lastStyleIndex);
            modified = true;
        } else if (content.includes('</head>')) {
            content = content.replace('</head>', `<style>${cssBlock}</style></head>`);
            modified = true;
        }
    }

    if (modified && content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Start walking from current directory
console.log("Starting batch update...");
walkDir(__dirname, updateFile);
console.log("Batch update complete.");
