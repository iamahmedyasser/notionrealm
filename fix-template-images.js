const fs = require('fs');
const cheerio = require('cheerio');

// Fix Task Management Template
const taskFile = 'notion-task-management-template/index.html';
const taskContent = fs.readFileSync(taskFile, 'utf8');
const $task = cheerio.load(taskContent);

// Find and fix the broken image
$task('img[src*="Task-Management-Notion-Template"]').each((i, el) => {
    const src = $task(el).attr('src');
    if (src && src.endsWith('.html')) {
        console.log(`Fixing Task Management image: ${src}`);
        $task(el).attr('src', '../wp-content/uploads/2023/07/Task-Management-Notion-Template-1-300x229.png');
    }
});

fs.writeFileSync(taskFile, $task.html(), 'utf8');
console.log('✓ Fixed Task Management Template image');

// Fix Travel Planner Template
const travelFile = 'notion-travel-planner-template/index.html';
if (fs.existsSync(travelFile)) {
    const travelContent = fs.readFileSync(travelFile, 'utf8');
    const $travel = cheerio.load(travelContent);

    // Find and fix any broken images
    $travel('img[src*="Travel"]').each((i, el) => {
        const src = $travel(el).attr('src');
        if (src && src.endsWith('.html')) {
            console.log(`Fixing Travel Planner image: ${src}`);
            $travel(el).attr('src', '../wp-content/uploads/2023/07/Notion-Travel-Planner-Template-1-300x229.webp');
        }
    });

    fs.writeFileSync(travelFile, $travel.html(), 'utf8');
    console.log('✓ Fixed Travel Planner Template image');
} else {
    console.log('Travel Planner template file not found');
}

console.log('\nAll template images fixed!');
