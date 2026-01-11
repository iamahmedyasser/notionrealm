const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { glob } = require('glob');

const ROOT_URL = 'https://notionrealm.com';
const ROOT_URL_WWW = 'https://www.notionrealm.com';

// Helper to make a path relative from the current file being processed
function makeRelative(currentFilePath, targetUrl) {
    if (!targetUrl) return targetUrl;

    // 1. Strip domain if present
    let url = targetUrl;
    if (url.startsWith(ROOT_URL)) {
        url = url.substring(ROOT_URL.length);
    } else if (url.startsWith(ROOT_URL_WWW)) {
        url = url.substring(ROOT_URL_WWW.length);
    }

    // If it's still absolute HTTP, ignore
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        return url;
    }

    // If it's an anchor or protocol, ignore
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
        return url;
    }

    // If it starts with /, calculate relative path
    if (url.startsWith('/')) {
        const fromDir = path.dirname(path.join(process.cwd(), currentFilePath));
        const toPath = path.join(process.cwd(), url);
        let relPath = path.relative(fromDir, toPath);
        relPath = relPath.split(path.sep).join('/');
        if (!relPath.startsWith('.') && !relPath.startsWith('/')) {
            relPath = './' + relPath;
        }
        return relPath;
    }

    return url;
}

async function processHtmlFiles() {
    try {
        const files = await glob(['*.html', '**/*.html'], { ignore: 'node_modules/**' });
        console.log(`Found ${files.length} HTML files.`);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const $ = cheerio.load(content);
            let modified = false;

            // 1. URL & Link Cleaning
            $('a').each((i, el) => {
                let href = $(el).attr('href');
                if (href) {
                    // Handle query/hash
                    let [base, ...rest] = href.split(/([?#])/);
                    // rest will be ['?', 'query', '#', 'hash'] or similar

                    // Remove index.html from base
                    if (base.endsWith('index.html')) {
                        base = base.substring(0, base.length - 10);
                        // If base became empty but not root-relative slash, usually implies ./
                        if (base === '') base = './';
                    } else if (base.endsWith('index.html/')) {
                        base = base.substring(0, base.length - 11) + '/';
                    }

                    // Reconstruct
                    href = base + rest.join('');

                    // Relativeize
                    const newHref = makeRelative(file, href);

                    if (newHref !== $(el).attr('href')) {
                        $(el).attr('href', newHref);
                        modified = true;
                    }
                }
            });

            // Standardize relative paths for images and scripts
            $('img, script, link, source').each((i, el) => {
                const src = $(el).attr('src');
                const href = $(el).attr('href');

                if (src) {
                    const newSrc = makeRelative(file, src);
                    if (newSrc !== src) {
                        $(el).attr('src', newSrc);
                        modified = true;
                    }
                }
                if (href) {
                    const newHref = makeRelative(file, href);
                    if (newHref !== href) {
                        $(el).attr('href', newHref);
                        modified = true;
                    }
                }

                // 4. Asset Fixes: broken blog images, remove srcset/sizes
                if ($(el).is('img')) {
                    if ($(el).attr('srcset')) {
                        $(el).removeAttr('srcset');
                        modified = true;
                    }
                    if ($(el).attr('sizes')) {
                        $(el).removeAttr('sizes');
                        modified = true;
                    }
                }
            });


            // 2. UI Refinement
            // Footer Copyright
            const cleanCopyright = (text) => {
                let newText = text;
                // Standard symbol cleaning
                if (newText.includes('©')) {
                    newText = newText.replace(/©\s*(\d{4}-)?\d{4}\s*/, '© ');
                }
                // Specific user request: remove 2025 (aggressive replacement)
                if (newText.includes('2025')) {
                    newText = newText.replace('2025', '');
                }
                return newText;
            };

            const footerCandidates = $('footer, .site-footer, #footer, .copyright, .footer');
            if (footerCandidates.length) {
                footerCandidates.find('*').contents().each(function () {
                    if (this.type === 'text') {
                        const text = $(this).text();

                        // Check for both symbol and text-based copyright
                        if (text.includes('©') || text.includes('Copyright') || text.includes('2025')) {
                            const newText = cleanCopyright(text);
                            if (newText !== text) {
                                $(this).replaceWith(newText);
                                modified = true;
                            }
                        }
                    }
                });
            } else {
                $('body').find('*').contents().each(function () {
                    if (this.type === 'text') {
                        const text = $(this).text();
                        if (text.includes('©')) {
                            const newText = cleanCopyright(text);
                            if (newText !== text) {
                                $(this).replaceWith(newText);
                                modified = true;
                            }
                        }
                    }
                });
            }

            // Header position
            const headerInHead = $('head').find('header');
            if (headerInHead.length > 0) {
                console.log(`Found header in <head> for ${file}. Moving to <body>.`);
                const headerHtml = headerInHead.toString();
                headerInHead.remove();
                $('body').prepend(headerHtml);
                modified = true;
            }

            // Header Navigation Redesign (Horizontal Menu)
            const nav = $('nav.wp-block-navigation');
            if (nav.length > 0) {
                const ul = nav.find('ul.wp-block-navigation__container');

                // 1. Flatten if wrapper exists
                if (ul.length > 0 && nav.find('.wp-block-navigation__responsive-container').length > 0) {
                    // Remove hamburger button and wrapper, keep only the list
                    nav.empty();
                    nav.append(ul);
                    modified = true;
                }

                // 2. Remove 'is-responsive' class (Check nav)
                if (nav.hasClass('is-responsive')) {
                    nav.removeClass('is-responsive');
                    modified = true;
                }

                // 3. Remove 'is-responsive' class (Check ul) and add Flex styles
                const currentUl = nav.find('ul.wp-block-navigation__container');
                if (currentUl.length > 0) {
                    if (currentUl.hasClass('is-responsive')) {
                        currentUl.removeClass('is-responsive');
                        modified = true;
                    }
                    // Force horizontal layout via inline styles to override any theme CSS issues
                    const currentStyle = currentUl.attr('style') || '';
                    if (!currentStyle.includes('display: flex')) {
                        // Ensure we don't create double semicolons
                        const prefix = currentStyle.trim().endsWith(';') ? '' : ';';
                        currentUl.attr('style', currentStyle + prefix + ' display: flex !important; list-style: none !important; padding: 0 !important; margin: 0 !important; gap: 20px !important; flex-direction: row !important;');
                        modified = true;
                    }
                }
            }


            // 3. SEO & Crawl Error Fixes
            const selectorsToRemove = [
                'link[type="application/json+oembed"]',
                'link[type="text/xml+oembed"]',
                'link[rel="EditURI"]',
                'link[href*="wp-json"]',
                'link[rel="https://api.w.org/"]'
            ];

            selectorsToRemove.forEach(sel => {
                if ($(sel).length > 0) {
                    $(sel).remove();
                    modified = true;
                }
            });

            // 4. Broken JS Removal
            $('script[src*="wp-includes/js"]').each((i, el) => {
                const src = $(el).attr('src');
                if (!src) return;

                // Skip external
                if (src.startsWith('http') || src.startsWith('//')) return;

                // Resolve path
                const absScriptPath = path.resolve(path.dirname(file), src);

                // Simple file existence check
                if (!fs.existsSync(absScriptPath)) {
                    console.log(`Removing broken script: ${src} in ${file}`);
                    $(el).remove();
                    modified = true;
                }
            });


            if (repairLayoutIssues($)) {
                modified = true;
            }

            if (file.endsWith('index.html')) {
                // Main Homepage
                // Main Homepage or Index pages
                // Ensure it is technically an index.html file (preceded by separator or start of string)
                if (file === 'index.html' || file.includes('/index.html') || file.includes('\\index.html')) {
                    // If it is the root index.html
                    if (path.resolve(file) === path.resolve('index.html')) {
                        if (refineHomepageLayout($)) {
                            modified = true;
                        }
                    }

                    // If it is notion-templates/index.html
                    if (file.includes('notion-templates')) {
                        console.log(`Checking templates page: ${file}`);
                        if (refineTemplatesPage($, file)) {
                            modified = true;
                        }
                    }
                }
            }

            if (modified) {
                fs.writeFileSync(file, $.html(), 'utf8');
                console.log(`Updated ${file}`);
            }
        });
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

function processSitemap() {
    const sitemapPath = 'sitemap.xml';
    if (!fs.existsSync(sitemapPath)) {
        console.log('No sitemap.xml found.');
        return;
    }

    try {
        let content = fs.readFileSync(sitemapPath, 'utf8');
        const $ = cheerio.load(content, { xmlMode: true });
        let modified = false;

        const seenUrls = new Set();
        const toRemove = [];

        $('url').each((i, el) => {
            const loc = $(el).find('loc');
            let url = loc.text();
            let originalUrl = url;

            // Remove index.html
            if (url.endsWith('index.html')) {
                url = url.substring(0, url.length - 10);
                modified = true;
            }

            // Deduplicate
            if (seenUrls.has(url)) {
                toRemove.push(el);
                modified = true;
            } else {
                seenUrls.add(url);
                if (url !== originalUrl) {
                    loc.text(url);
                }
            }
        });

        toRemove.forEach(el => $(el).remove());

        if (modified) {
            fs.writeFileSync(sitemapPath, $.xml(), 'utf8');
            console.log('Updated sitemap.xml');
        }
    } catch (err) {
        console.error("Sitemap error:", err);
    }
}

// Repair function for accidental layout breakage (rogue inline styles)
// Repair function for accidental layout breakage (rogue inline styles)
function repairLayoutIssues($) {
    let modified = false;

    // 1. Remove rogue 'justify-content: center' from EVERYTHING (it interferes with space-between)
    $('[style*="justify-content: center !important"]').each((i, el) => {
        const style = $(el).attr('style');
        console.log('Removing rogue justify-center style');
        let newStyle = style.replace(/justify-content:\s*center\s*!important;?/g, '');
        $(el).attr('style', newStyle);
        modified = true;
    });

    // 2. Remove rogue 'display: flex' from DIV wrappers and NAVs 
    // (We only want it on the UL inside the NAV)
    $('div[style*="display: flex !important"], nav[style*="display: flex !important"]').each((i, el) => {
        const style = $(el).attr('style');
        console.log('Removing rogue flex style from container/nav');
        let newStyle = style.replace(/display:\s*flex\s*!important;?/g, '')
            .replace(/flex-direction:\s*row\s*!important;?/g, '');
        $(el).attr('style', newStyle);
        modified = true;
    });

    return modified;
}

// Specific homepage refinements (Centering images)
function refineHomepageLayout($) {
    let modified = false;

    // 1. Center Hero Image (Top Notion templates...)
    $('img[src*="Top-Notion-templates-with-logo"]').each((i, el) => {
        const style = $(el).attr('style') || '';
        if (!style.includes('margin-left: auto')) {
            console.log('Centering Homepage Hero Image');
            const newStyle = style + '; display: block !important; margin-left: auto !important; margin-right: auto !important;';
            $(el).attr('style', newStyle);
            modified = true;
        }
    });

    // 2. Center Card Images (Premium and Free Templates)
    $('img[alt="Premium Notion Templates"], img[alt="Free Notion Templates"]').each((i, el) => {
        const style = $(el).attr('style') || '';
        // Also ensure parent figure has center alignment if needed, but centering the IMG block usually works
        if (!style.includes('margin-left: auto')) {
            console.log(`Centering Card Image: ${$(el).attr('alt')}`);
            const newStyle = style + '; display: block !important; margin-left: auto !important; margin-right: auto !important;';
            $(el).attr('style', newStyle);
            modified = true;
        }
    });

    return modified;
}

// Specific templates page refinements
function refineTemplatesPage($, filePath) {
    let modified = false;

    // 1. Center all card images (figure.wp-block-image img)
    // We target images inside columns specifically to avoid centering things that shouldn't be
    $('.wp-block-themeisle-blocks-advanced-column figure.wp-block-image img').each((i, el) => {
        const style = $(el).attr('style') || '';
        if (!style.includes('margin-left: auto')) {
            console.log('Centering Template Page Image');
            const newStyle = style + '; display: block !important; margin-left: auto !important; margin-right: auto !important;';
            $(el).attr('style', newStyle);
            modified = true;
        }
    });

    // 2. Fix broken Content Creator Kit image
    $('img[src*="Content-Creator-Kit-Notion-Template"]').each((i, el) => {
        const src = $(el).attr('src');
        console.log(`Found Content Creator Kit image with src: ${src}`);

        if (src && (src.includes('.html') || src.includes('Content-Creator-Kit-Notion-Template-300x229.png'))) {
            console.log('Fixing broken Content Creator Kit image - using hardcoded correct path');
            // The actual file is: Content-Creator-Kit-Notion-Template-1-300x229.png
            // Hardcode the correct path relative to notion-templates/index.html
            $(el).attr('src', '../wp-content/uploads/2023/07/Content-Creator-Kit-Notion-Template-1-300x229.png');

            // Also ensure it is visible/centered
            const style = $(el).attr('style') || '';
            if (!style.includes('margin-left: auto')) {
                const newStyle = style + '; display: block !important; margin-left: auto !important; margin-right: auto !important;';
                $(el).attr('style', newStyle);
            }
            modified = true;
        }
    });

    return modified;
}

// Fix blog post featured images
async function fixBlogPostImages() {
    const missingImagesDir = 'wp-content/uploads/missing/posts';

    // Check if directory exists
    if (!fs.existsSync(missingImagesDir)) {
        console.log('Missing images directory not found, skipping blog post image fix');
        return;
    }

    // Get all images from missing folder
    const imageFiles = fs.readdirSync(missingImagesDir);
    console.log(`Found ${imageFiles.length} images in missing folder`);

    // Get all blog post HTML files
    const blogPosts = await glob(['blog/**/index.html'], { ignore: ['blog/index.html'] });
    console.log(`Found ${blogPosts.length} blog posts to process`);

    let fixedCount = 0;

    for (const postFile of blogPosts) {
        try {
            const content = fs.readFileSync(postFile, 'utf8');
            const $ = cheerio.load(content);

            // Extract post title from h1.wp-block-post-title
            const postTitle = $('h1.wp-block-post-title').first().text().trim();
            if (!postTitle) {
                console.log(`No title found in ${postFile}, skipping`);
                continue;
            }

            // Normalize title for matching
            const normalizedTitle = postTitle.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Remove special chars
                .replace(/\s+/g, ' ')         // Normalize spaces
                .trim();

            // Find matching image
            let matchedImage = null;
            for (const imageFile of imageFiles) {
                const imageName = path.parse(imageFile).name; // Get filename without extension
                const normalizedImageName = imageName.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (normalizedTitle === normalizedImageName) {
                    matchedImage = imageFile;
                    break;
                }
            }

            if (!matchedImage) {
                console.log(`No matching image found for: "${postTitle}"`);
                continue;
            }

            // Check if image already exists in the post
            const existingImage = $('.wp-block-post-content figure.wp-block-image img').first();
            const existingImageSrc = existingImage.attr('src');

            // Skip if there's already a valid image (not .html)
            if (existingImage.length > 0 && existingImageSrc && !existingImageSrc.endsWith('.html')) {
                console.log(`Valid image already exists in ${postFile}, skipping`);
                continue;
            }

            // Calculate relative path from blog post to image
            const postDir = path.dirname(postFile);
            const imagePath = path.join(missingImagesDir, matchedImage);
            const relativeImagePath = path.relative(postDir, imagePath).split(path.sep).join('/');

            // If there's a broken image (.html extension), replace it
            if (existingImage.length > 0 && existingImageSrc && existingImageSrc.endsWith('.html')) {
                console.log(`Replacing broken image in ${postFile} with ${matchedImage}`);
                existingImage.attr('src', relativeImagePath);
                existingImage.attr('alt', postTitle);
                // Ensure centering styles
                const imgStyle = existingImage.attr('style') || '';
                if (!imgStyle.includes('margin-left: auto')) {
                    existingImage.attr('style', imgStyle + '; display: block !important; margin-left: auto !important; margin-right: auto !important;');
                }
                fs.writeFileSync(postFile, $.html(), 'utf8');
                console.log(`✓ Fixed broken image in: ${postFile}`);
                fixedCount++;
            } else {
                // No image exists, insert new one
                // Create image HTML
                const imageHtml = `
<figure class="wp-block-image aligncenter size-full" style="display: block !important; margin-left: auto !important; margin-right: auto !important;">
    <img decoding="async" src="${relativeImagePath}" alt="${postTitle}" style="display: block !important; margin-left: auto !important; margin-right: auto !important;">
</figure>
`;

                // Insert image at the beginning of post content
                const postContent = $('.wp-block-post-content').first();
                if (postContent.length > 0) {
                    postContent.prepend(imageHtml);
                    fs.writeFileSync(postFile, $.html(), 'utf8');
                    console.log(`✓ Added image to: ${postFile} (${matchedImage})`);
                    fixedCount++;
                } else {
                    console.log(`No post content container found in ${postFile}`);
                }
            }

        } catch (err) {
            console.error(`Error processing ${postFile}:`, err.message);
        }
    }

    console.log(`\nFixed ${fixedCount} blog posts with images`);
}

(async () => {
    await processHtmlFiles();
    await fixBlogPostImages();
    processSitemap();
})();
