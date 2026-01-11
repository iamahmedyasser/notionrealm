const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Template configuration
const templates = [
    { name: 'Life Planner', pagePath: 'notion-life-planner-template/index.html' },
    { name: 'Productivity System', pagePath: 'notion-productivity-system-template/index.html' },
    { name: 'Artist', pagePath: 'notion-artist-template/index.html' },
    { name: 'Agency', pagePath: 'notion-agency-template/index.html' },
    { name: 'Content Creator', pagePath: 'notion-content-creator-template/index.html' },
    { name: 'Freelancer', pagePath: 'notion-freelancer-template/index.html' },
    { name: 'Language Learning', pagePath: 'notion-language-learning-template/index.html' },
    { name: 'Fitness Life', pagePath: 'notion-fitness-life-template/index.html' },
    { name: 'Second Brain', pagePath: 'notion-second-brain-template/index.html' },
    { name: 'Sales CRM', pagePath: 'notion-sales-crm-template/index.html' },
    { name: 'Finance Tracker', pagePath: 'notion-finance-tracker-template/index.html' },
    { name: 'Student Planner', pagePath: 'notion-student-planner-template/index.html' }
];

const baseDir = __dirname;

function cleanDuplicates(template) {
    console.log(`\n=== Cleaning ${template.name} ===`);

    const htmlPath = path.join(baseDir, template.pagePath);

    if (!fs.existsSync(htmlPath)) {
        console.log(`❌ HTML file not found: ${htmlPath}`);
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    let modified = false;
    const postContent = $('.wp-block-post-content');

    if (postContent.length === 0) {
        console.log(`❌ Could not find .wp-block-post-content`);
        return;
    }

    // Find all YouTube embeds
    const youtubeEmbeds = postContent.find('figure.wp-block-embed-youtube');

    if (youtubeEmbeds.length > 1) {
        console.log(`Found ${youtubeEmbeds.length} YouTube embeds, removing duplicates...`);

        // Keep only the one with centering styles (the new one)
        youtubeEmbeds.each((i, el) => {
            const $el = $(el);
            const style = $el.attr('style') || '';

            // Remove the one WITHOUT centering styles (the old one)
            if (!style.includes('margin-left: auto')) {
                console.log(`  Removing old YouTube embed #${i + 1}`);
                $el.remove();
                modified = true;
            }
        });
    } else {
        console.log('✓ Only one YouTube embed found');
    }

    // Find all images with the template image source
    const templateImages = postContent.find('img[src*="missing/templates"]');

    if (templateImages.length > 1) {
        console.log(`Found ${templateImages.length} template images, removing duplicates...`);

        // Keep only the one with max-width: 600px (the new smaller one)
        templateImages.each((i, el) => {
            const $img = $(el);
            const style = $img.attr('style') || '';

            // Remove the one WITHOUT max-width: 600px (the old full-size one)
            if (!style.includes('max-width: 600px')) {
                const $figure = $img.closest('figure');
                console.log(`  Removing old template image #${i + 1}`);
                if ($figure.length > 0) {
                    $figure.remove();
                } else {
                    $img.remove();
                }
                modified = true;
            }
        });
    } else {
        console.log('✓ Only one template image found');
    }

    if (modified) {
        fs.writeFileSync(htmlPath, $.html(), 'utf8');
        console.log(`✅ Cleaned duplicates in ${template.pagePath}`);
    } else {
        console.log(`⊘ No duplicates found in ${template.pagePath}`);
    }
}

// Main execution
console.log('Starting duplicate cleanup process...\n');

templates.forEach(template => {
    try {
        cleanDuplicates(template);
    } catch (error) {
        console.error(`❌ Error processing ${template.name}:`, error.message);
    }
});

console.log('\n=== Cleanup Complete ===');
