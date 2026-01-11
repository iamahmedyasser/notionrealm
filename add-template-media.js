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
const imagesBaseDir = path.join(baseDir, 'wp-content/uploads/missing/templates');

function processTemplate(template) {
    console.log(`\n=== Processing ${template.name} ===`);

    const htmlPath = path.join(baseDir, template.pagePath);

    // Check if HTML file exists
    if (!fs.existsSync(htmlPath)) {
        console.log(`❌ HTML file not found: ${htmlPath}`);
        return;
    }

    // Find the image file in the template folder
    const imageFolderPath = path.join(imagesBaseDir, template.folder);
    if (!fs.existsSync(imageFolderPath)) {
        console.log(`❌ Image folder not found: ${imageFolderPath}`);
        return;
    }

    const imageFiles = fs.readdirSync(imageFolderPath).filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')
    );

    if (imageFiles.length === 0) {
        console.log(`❌ No image found in: ${imageFolderPath}`);
        return;
    }

    const imageFileName = imageFiles[0];
    console.log(`✓ Found image: ${imageFileName}`);

    // Read HTML file
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    let modified = false;

    // Find the wp-block-post-content div
    const postContent = $('.wp-block-post-content');

    if (postContent.length === 0) {
        console.log(`❌ Could not find .wp-block-post-content in ${template.pagePath}`);
        return;
    }

    // 1. Replace existing <video> element with YouTube embed (centered)
    const videoElement = postContent.find('figure.wp-block-video');

    if (videoElement.length > 0) {
        console.log('Replacing video element with YouTube embed...');

        // Create centered YouTube embed HTML
        const youtubeEmbed = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio" style=" display: block !important; margin-left: auto !important; margin-right: auto !important;"><div class="wp-block-embed__wrapper">
<iframe title="${template.name} Template" width="500" height="281" src="https://www.youtube.com/embed/${template.youtubeId}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="no-referrer-when-downgrade" allowfullscreen=""></iframe>
</div></figure>`;

        videoElement.replaceWith(youtubeEmbed);
        modified = true;
        console.log('✓ Video replaced with centered YouTube embed');
    } else {
        console.log('⊘ No video element found to replace');
    }

    // 2. Replace broken image (with .html extension or missing) with new smaller image
    // Look for images with .html extension in src
    const brokenImages = postContent.find('img[src*=".html"]');

    if (brokenImages.length > 0) {
        console.log(`Found ${brokenImages.length} broken image(s), replacing...`);

        brokenImages.each((i, el) => {
            const $img = $(el);
            const $figure = $img.closest('figure.wp-block-image');

            // Construct the relative path to the image
            const relativeImagePath = `../wp-content/uploads/missing/templates/${template.folder}/${imageFileName}`;

            // Create smaller, centered image HTML (width: 600px instead of full size)
            const imageHtml = `<figure class="wp-block-image aligncenter" style=" display: block !important; margin-left: auto !important; margin-right: auto !important;"><img decoding="async" src="${relativeImagePath}" alt="${template.name} Template" style="max-width: 600px; width: 100%; height: auto;"></figure>`;

            if ($figure.length > 0) {
                $figure.replaceWith(imageHtml);
            } else {
                $img.parent().replaceWith(imageHtml);
            }

            modified = true;
        });

        console.log('✓ Broken image(s) replaced with smaller centered image');
    } else {
        console.log('⊘ No broken images found to replace');
    }

    // Save the modified HTML if changes were made
    if (modified) {
        fs.writeFileSync(htmlPath, $.html(), 'utf8');
        console.log(`✅ Saved changes to ${template.pagePath}`);
    } else {
        console.log(`⊘ No changes needed for ${template.pagePath}`);
    }
}

// Main execution
console.log('Starting template media replacement process...\n');
console.log(`Base directory: ${baseDir}`);
console.log(`Images directory: ${imagesBaseDir}\n`);

templates.forEach(template => {
    try {
        processTemplate(template);
    } catch (error) {
        console.error(`❌ Error processing ${template.name}:`, error.message);
    }
});

console.log('\n=== Process Complete ===');
