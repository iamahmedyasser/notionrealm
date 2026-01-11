const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = __dirname;

console.log('Replacing MonsterInsights with clean GA4 snippet...\n');

// Clean GA4 snippet
const cleanGA4 = `\t<!-- Google Analytics GA4 -->
\t<script async src="https://www.googletagmanager.com/gtag/js?id=G-NNFPSS0Q66"></script>
\t<script>
\t  window.dataLayer = window.dataLayer || [];
\t  function gtag(){dataLayer.push(arguments);}
\t  gtag('js', new Date());
\t  gtag('config', 'G-NNFPSS0Q66');
\t</script>`;

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'wp-content/**', 'wp-includes/**']
});

let filesUpdated = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Check if file contains MonsterInsights code
    if (html.includes('MonsterInsights') || html.includes('monsterinsights')) {
        // Remove the entire MonsterInsights block
        // Pattern: from "<!-- This site uses the Google Analytics by MonsterInsights" to "<!-- / Google Analytics by MonsterInsights -->"
        const monsterInsightsPattern = /\t\t<!-- This site uses the Google Analytics by MonsterInsights.*?<!-- \/ Google Analytics by MonsterInsights -->\s*/gs;

        if (monsterInsightsPattern.test(html)) {
            html = html.replace(monsterInsightsPattern, cleanGA4 + '\n');

            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`✓ ${file}`);
            filesUpdated++;
        }
    }
});

console.log(`\n✅ Updated ${filesUpdated} files with clean GA4 snippet`);
console.log('=== Google Analytics Update Complete ===');
