const fs = require('fs');
const path = require('path');

// New CSS for Header Overhaul (Desktop + Mobile Burger)
const newCssBlock = `
<style id="header-overhaul-css">
    /* --- Global Styles --- */
    /* Hide Hamburger & Mobile Menu by default globally to prevent Desktop duplicates */
    #mobile-menu-toggle {
        display: none !important;
    }
    #mobile-menu-container {
        display: none !important;
    }

    /* --- Desktop Layout (Right-Aligned Button) --- */
    /* Ensure the main container separates Logo+Nav from Button */
    .wp-block-group.alignwide.is-content-justification-space-between {
        justify-content: space-between !important;
        align-items: center !important;
    }

    /* Group Logo and Nav together with gap */
    .wp-block-group.is-layout-flex.wp-block-group-is-layout-flex {
        display: flex !important;
        align-items: center !important;
        gap: 30px !important;
    }
    
    /* Ensure Nav items are horizontal on desktop */
    .wp-block-navigation .wp-block-navigation__container {
        display: flex !important;
        flex-direction: row !important;
        gap: 20px !important;
    }

    /* --- Mobile Layout (Hamburger Menu) --- */
    @media (max-width: 768px) {
        /* Show Hamburger Button */
        #mobile-menu-toggle {
            display: block !important;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 10px;
            margin-left: auto; /* Push to right */
        }

        /* 1. Reset Main Row to Single Line: [Logo] [Burger] */
        .wp-block-group.alignwide.is-content-justification-space-between {
            flex-wrap: nowrap !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
        }

        /* 2. Mobile Menu Container Styling */
        #mobile-menu-container {
            display: none; /* Inherits global hidden, but valid here */
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: #fff; /* Match header bg */
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            padding: 20px;
            z-index: 9999;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            border-top: 1px solid #eee;
        }

        /* Only show when open */
        #mobile-menu-container.is-open {
            display: flex !important;
        }

        /* Stack items in dropdown */
        #mobile-menu-container nav ul {
            flex-direction: column !important;
            align-items: flex-start !important;
            width: 100%;
            gap: 20px !important;
        }
    }
</style>
<script id="header-overhaul-js">
document.addEventListener('DOMContentLoaded', function() {
    // 1. Create Mobile Menu Container if not exists
    if (!document.getElementById('mobile-menu-container')) {
        const headerGroup = document.querySelector('.wp-block-template-part > .wp-block-group > .wp-block-group.alignwide');
        
        if (headerGroup) {
            // Create Toggle Button
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'mobile-menu-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.ariaLabel = 'Menu';
            
            // Container
            const logoNavGroup = headerGroup.children[0]; 
            const buttonGroup = headerGroup.children[1]; 
            
            const nav = logoNavGroup.querySelector('nav');
            
            const menuContainer = document.createElement('div');
            menuContainer.id = 'mobile-menu-container';
            
            if (nav && buttonGroup) {
                // Clone Content
                const navClone = nav.cloneNode(true);
                const btnClone = buttonGroup.cloneNode(true);
                
                // --- Mobile Layout Fixes ---
                // 1. Clear inline styles on UL to allow stacking
                const ul = navClone.querySelector('ul');
                if (ul) {
                    // Force overrides via cssText to clear any 'display: flex' horizontal constraints
                    ul.style.cssText = 'display: flex !important; flex-direction: column !important; align-items: flex-start !important; width: 100% !important; gap: 20px !important; margin: 0 !important; padding: 0 !important;';
                    
                    // Also ensure LIs take full width
                    const lis = ul.querySelectorAll('li');
                    lis.forEach(li => {
                        li.style.width = '100%';
                        li.style.marginBottom = '0';
                    });
                }
                
                // Append Modified Nav to Container
                menuContainer.appendChild(navClone);
                
                // --- FIX: Append Button SEPARATELY below Nav (All Vertically Stacked) ---
                // Reset styling on button to ensure it stacks properly
                btnClone.style.cssText = 'width: 100% !important; margin-top: 15px !important; display: flex !important; justify-content: flex-start !important;';
                
                // If it's a buttons group, ensure it flows well
                menuContainer.appendChild(btnClone);

                
                // Inject into DOM
                headerGroup.parentElement.style.position = 'relative'; 
                headerGroup.parentElement.appendChild(menuContainer);
                headerGroup.appendChild(toggleBtn);
                
                // Add Toggle Logic
                toggleBtn.addEventListener('click', function() {
                    menuContainer.classList.toggle('is-open');
                    toggleBtn.innerHTML = menuContainer.classList.contains('is-open') ? '✕' : '☰';
                });
                
                // CSS to Hide Original Elements on Mobile
                const hideCss = document.createElement('style');
                hideCss.innerHTML = \`
                    @media (max-width: 768px) {
                        /* Hide original Nav inside the Group */
                        .wp-block-group.is-layout-flex > nav { display: none !important; }
                        /* Hide original Button Group */
                        .wp-block-group.alignwide > .wp-block-buttons { display: none !important; }
                    }
                \`;
                document.head.appendChild(hideCss);
            }
        }
    }
});
</script>
`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // Ignore node_modules, wp-content, wp-admin, wp-includes
            if (!/node_modules|wp-content|wp-admin|wp-includes/.test(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            if (path.extname(f) === '.html') {
                callback(dirPath);
            }
        }
    });
}

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    // Replace old overhaul block
    const regex = /<style id="header-overhaul-css">[\s\S]*?<script id="header-overhaul-js">[\s\S]*?<\/script>/;
    if (regex.test(content)) {
        content = content.replace(regex, newCssBlock.trim()); // Update existing
        modified = true;
    } else {
        // Inject fresh if not found
        if (content.includes('</head>')) {
            content = content.replace('</head>', newCssBlock + '</head>');
            modified = true;
        }
    }

    if (modified && content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log('Starting header overhaul refinement v3...');
walkDir(__dirname, updateFile);
console.log('Batch update complete.');
