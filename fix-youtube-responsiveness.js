const fs = require('fs');
const path = require('path');

const templates = [
    "notion-life-planner-template",
    "notion-productivity-system-template",
    "notion-artist-template",
    "notion-agency-template",
    "notion-content-creator-template",
    "notion-freelancer-template",
    "notion-language-learning-template",
    "notion-fitness-life-template",
    "notion-second-brain-template",
    "notion-sales-crm-template",
    "notion-finance-tracker-template",
    "notion-student-planner-template"
];

const basePathFull = "d:\\Work\\Notionrealm\\notionrealm\\notionrealm\\notionrealm.com";

templates.forEach(t => {
    let filePath = path.join(basePathFull, t, 'index.html');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let updated = false;
        
        // Find iframe with youtube
        content = content.replace(/(<iframe[^>]*src="[^"]*youtube\.com[^"]*"[^>]*)>/ig, (match, p1) => {
            // Remove existing width, height, style
            let clean = p1.replace(/\s(?:width|height|style)="[^"]*"/ig, '');
            updated = true;
            return clean + ' style="width: 100%; aspect-ratio: 16/9; height: auto; max-width: 800px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">';
        });

        // Some embeds might also have a wrapper that restricts width or messes up alignment, 
        // let's ensure the figure tag is also responsive just in case.
        content = content.replace(/(<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*)>/ig, (match, p1) => {
            let clean = p1.replace(/\sstyle="[^"]*"/ig, '');
            return clean + ' style="width: 100%; max-width: 100%; margin: 0 auto; text-align: center;">';
        });

        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Fixed responsiveness: " + t);
        } else {
            console.log("No Youtube iframe found in: " + t);
        }
    } else {
        console.log("File not found: " + filePath);
    }
});
