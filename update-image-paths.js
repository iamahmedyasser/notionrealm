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

console.log('Updating image paths from .png to .webp...\n');

templates.forEach(template => {
    const htmlPath = path.join(baseDir, template.pagePath);

    if (!fs.existsSync(htmlPath)) {
        console.log(`⚠ File not found: ${template.pagePath}`);
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    let modified = false;

    // Find images with missing/templates path
    $('img[src*="missing/templates"]').each((i, el) => {
        const $img = $(el);
        const src = $img.attr('src');

        if (src && src.endsWith('.png')) {
            const newSrc = src.replace('.png', '.webp');
            $img.attr('src', newSrc);
            console.log(`✓ ${template.name}: Updated image path to .webp`);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(htmlPath, $.html(), 'utf8');
    }
});

console.log('\n=== Image Path Update Complete ===');
