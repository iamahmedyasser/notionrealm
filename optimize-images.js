const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Template folders
const templateFolders = [
    'life planner',
    'productivity system',
    'artist',
    'agency',
    'content creator',
    'freelancer',
    'Languages Learning',
    'Fitness Life',
    'Second Brain',
    'Sales CRM',
    'Finance Tracker',
    'Student Planner'
];

const baseDir = path.join(__dirname, 'wp-content/uploads/missing/templates');

async function optimizeImages() {
    console.log('Starting image optimization...\n');

    for (const folder of templateFolders) {
        const folderPath = path.join(baseDir, folder);

        if (!fs.existsSync(folderPath)) {
            console.log(`⚠ Folder not found: ${folder}`);
            continue;
        }

        const files = fs.readdirSync(folderPath);
        const imageFile = files.find(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));

        if (!imageFile) {
            console.log(`⚠ No image found in: ${folder}`);
            continue;
        }

        const imagePath = path.join(folderPath, imageFile);
        const stats = fs.statSync(imagePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`\n📁 ${folder}`);
        console.log(`   Original: ${imageFile} (${sizeMB} MB)`);

        try {
            // Create optimized WebP version
            const ext = path.extname(imageFile);
            const baseName = path.basename(imageFile, ext);
            const optimizedPath = path.join(folderPath, `${baseName}-optimized.webp`);

            await sharp(imagePath)
                .webp({ quality: 85, effort: 6 })
                .toFile(optimizedPath);

            const newStats = fs.statSync(optimizedPath);
            const newSizeMB = (newStats.size / (1024 * 1024)).toFixed(2);
            const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);

            console.log(`   ✅ Optimized: ${path.basename(optimizedPath)} (${newSizeMB} MB)`);
            console.log(`   💾 Saved: ${savings}%`);

            // Replace original with optimized
            fs.unlinkSync(imagePath);
            const newImagePath = imagePath.replace(ext, '.webp');
            fs.renameSync(optimizedPath, newImagePath);
            console.log(`   ✓ Replaced: ${path.basename(newImagePath)}`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n=== Optimization Complete ===');
}

optimizeImages().catch(console.error);
