const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function patchJsLinks() {
    console.log('Starting JavaScript link patching...');

    // Find all HTML files
    const files = glob.sync('**/*.html', {
        ignore: ['node_modules/**', 'wp-content/**'],
        absolute: true
    });

    console.log(`Found ${files.length} HTML files to check.`);

    let totalModified = 0;

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // 1. Fix LemonSqueezy lemon.js relative paths
        // Matches src=".../assets.lemonsqueezy.com/lemon.js"
        const lemonRegex = /src="[^"]*assets\.lemonsqueezy\.com\/lemon\.js"/g;
        if (lemonRegex.test(content)) {
            content = content.replace(lemonRegex, 'src="https://assets.lemonsqueezy.com/lemon.js"');
            modified = true;
        }

        // 2. Fix Google Tag Manager http protocol
        // Matches src="http://www.googletagmanager.com/gtag/js"
        const gtmRegex = /src="http:\/\/www\.googletagmanager\.com\/gtag\/js/g;
        if (gtmRegex.test(content)) {
            content = content.replace(gtmRegex, 'src="https://www.googletagmanager.com/gtag/js');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Patched: ${path.relative(process.cwd(), file)}`);
            totalModified++;
        }
    }

    console.log(`\nPatching complete! Modified ${totalModified} files.`);
}

patchJsLinks().catch(err => {
    console.error('Error during patching:', err);
    process.exit(1);
});
