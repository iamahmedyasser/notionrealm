const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'notion-templates', 'index.html');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // 1. Remove all occurrences of lemon.js
    // Typcial tag: <script src="https://assets.lemonsqueezy.com/lemon.js" defer=""></script>
    // Using simple string replace for specific format observed
    const lemonScriptTag = '<script src="https://assets.lemonsqueezy.com/lemon.js" defer=""></script>';
    const regex = /<script src="https:\/\/assets\.lemonsqueezy\.com\/lemon\.js"(?: defer="")?><\/script>/g;

    let matchCount = (content.match(regex) || []).length;

    if (matchCount > 0) {
        console.log(`Found ${matchCount} properties of lemon.js. Consolidating...`);

        // Remove all
        content = content.replace(regex, '');

        // 2. Add SINGLE instance before </body>
        // Check if </body> exists
        if (content.includes('</body>')) {
            content = content.replace('</body>', `${lemonScriptTag}\n</body>`);
            fs.writeFileSync(targetFile, content, 'utf8');
            console.log('Optimized: Removed duplicates and added single script at end of body.');
        } else {
            console.log('Error: Could not find </body> tag.');
        }
    } else {
        console.log('No lemon.js scripts found to optimize (or regex mismatch).');
    }
} else {
    console.log('Target file not found.');
}
