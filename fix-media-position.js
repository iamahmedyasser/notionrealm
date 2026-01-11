const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Template configuration with folder names, page paths, and YouTube video IDs
const templates = [
    {
        name: 'Life Planner',
        folder: 'life planner',
        pagePath: 'notion-life-planner-template/index.html',
        youtubeId: 'IVsL9dERS-Q'
    },
    {
        name: 'Productivity System',
        folder: 'productivity system',
        pagePath: 'notion-productivity-system-template/index.html',
        youtubeId: 'v2k3q-5Ajkc'
    },
    {
        name: 'Artist',
        folder: 'artist',
        pagePath: 'notion-artist-template/index.html',
        youtubeId: 'J11k50p2Soc'
    },
    {
        name: 'Agency',
        folder: 'agency',
        pagePath: 'notion-agency-template/index.html',
        youtubeId: 'wNIW9jhdYsY'
    },
    {
        name: 'Content Creator',
        folder: 'content creator',
        pagePath: 'notion-content-creator-template/index.html',
        youtubeId: 'ZVAT4oudyTg'
    },
    {
        name: 'Freelancer',
        folder: 'freelancer',
        pagePath: 'notion-freelancer-template/index.html',
        youtubeId: 'f3t9_2T9TUY'
    },
    {
        name: 'Language Learning',
        folder: 'Languages Learning',
        pagePath: 'notion-language-learning-template/index.html',
        youtubeId: 'S8eWIHNTVVo'
    },
    {
        name: 'Fitness Life',
        folder: 'Fitness Life',
        pagePath: 'notion-fitness-life-template/index.html',
        youtubeId: '4RYgsbdS52w'
    },
    {
        name: 'Second Brain',
        folder: 'Second Brain',
        pagePath: 'notion-second-brain-template/index.html',
        youtubeId: '2PcmOl92aEI'
    },
    {
        name: 'Sales CRM',
        folder: 'Sales CRM',
        pagePath: 'notion-sales-crm-template/index.html',
        youtubeId: 'AXul1aqWGYQ'
    },
    {
        name: 'Finance Tracker',
        folder: 'Finance Tracker',
        pagePath: 'notion-finance-tracker-template/index.html',
        youtubeId: '4Vnf-vRbukQ'
    },
    {
        name: 'Student Planner',
        folder: 'Student Planner',
        pagePath: 'notion-student-planner-template/index.html',
        youtubeId: 'uUtvh-ZvPLw'
    }
];

const baseDir = __dirname;

function fixTemplate(template) {
    console.log(`\n=== Fixing ${template.name} ===`);

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

    // 1. Find and remove existing YouTube embed
    const existingYouTube = postContent.find('figure.wp-block-embed-youtube');
    if (existingYouTube.length > 0) {
        existingYouTube.remove();
        console.log('✓ Removed existing YouTube embed');
        modified = true;
    }

    // 2. Create new bigger, properly centered YouTube embed
    const youtubeEmbed = `
<figure class="wp-block-embed aligncenter is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
<div class="wp-block-embed__wrapper">
<iframe title="${template.name} Template" width="800" height="450" src="https://www.youtube.com/embed/${template.youtubeId}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="no-referrer-when-downgrade" allowfullscreen=""></iframe>
</div>
</figure>
`;

    // 3. Insert YouTube embed at the top (after first spacer)
    const firstSpacer = postContent.find('.wp-block-spacer').first();
    if (firstSpacer.length > 0) {
        firstSpacer.after(youtubeEmbed);
        console.log('✓ Added bigger YouTube embed at top');
        modified = true;
    } else {
        console.log('⚠ Could not find first spacer');
    }

    // 4. Fix image centering - find the template image and ensure it's properly centered
    const templateImage = postContent.find('img[src*="missing/templates"]').first();
    if (templateImage.length > 0) {
        const $figure = templateImage.closest('figure');

        // Update figure to use aligncenter class (WordPress standard for centering)
        if ($figure.length > 0) {
            $figure.removeClass('size-full');
            $figure.addClass('aligncenter');
            $figure.removeAttr('style'); // Remove inline styles

            // Update image styles for proper centering
            templateImage.attr('style', 'max-width: 600px; width: 100%; height: auto; display: block; margin: 0 auto;');

            console.log('✓ Fixed image centering');
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(htmlPath, $.html(), 'utf8');
        console.log(`✅ Saved changes to ${template.pagePath}`);
    } else {
        console.log(`⊘ No changes needed for ${template.pagePath}`);
    }
}

// Main execution
console.log('Starting template media repositioning and centering fix...\n');

templates.forEach(template => {
    try {
        fixTemplate(template);
    } catch (error) {
        console.error(`❌ Error processing ${template.name}:`, error.message);
    }
});

console.log('\n=== Process Complete ===');
