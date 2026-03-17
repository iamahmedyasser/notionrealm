const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = "d:\\Work\\Notionrealm\\notionrealm\\notionrealm\\notionrealm.com";

const GLOBAL_ORG_NAME = "Notionrealm";
const GLOBAL_ORG_URL = "https://notionrealm.com";
const GLOBAL_LINKEDIN = "https://www.linkedin.com/company/notionrealm"; // Replace if you have a specific company page
const DEFAULT_AUTHOR_BIO = "Founder of Notionrealm. Expert in Notion templates, productivity, and workspace optimization. Helping creators and professionals build their digital lives.";

// Recursive file search
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (file === 'index.html') {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function extractFaqSchema($) {
    let faqs = [];
    
    // Look for headers that mention FAQ or Frequently Asked Questions
    const faqHeaders = $('h2, h3').filter(function() {
        const text = $(this).text().toLowerCase();
        return text.includes('faq') || text.includes('frequently asked questions');
    });

    if (faqHeaders.length === 0) return null;

    faqHeaders.each(function() {
        let currentHeader = $(this);
        
        // This assumes a structure commonly found in WP: 
        // A container with details/summary or h3/p pairs below the main FAQ h2
        
        // Check for RankMath FAQ Block structure
        const rankmathFaqs = currentHeader.nextAll('.wp-block-rank-math-faq-block').addBack('.wp-block-rank-math-faq-block');
        if (rankmathFaqs.length > 0) {
            $('.rank-math-list-item').each(function() {
                const question = $(this).find('.rank-math-question').text().trim();
                const answer = $(this).find('.rank-math-answer').text().trim();
                if (question && answer) {
                    faqs.push({ question, answer });
                }
            });
            return; // break each loop
        }

        // Check for general H3/P pairs or strong/P pairs under an FAQ section
        let nextElem = currentHeader.next();
        let currentQuestion = null;
        
        // Limit search to next 20 siblings to avoid capturing entire page
        let siblingCount = 0;
        while (nextElem.length > 0 && siblingCount < 20) {
            const isHeader = nextElem.is('h2, h3, h4');
            const isBold = nextElem.is('p') && nextElem.find('strong').length > 0 && nextElem.text() === nextElem.find('strong').text();
            
            // If we hit another major section not related to FAQ, stop
            if (isHeader && !nextElem.text().toLowerCase().includes('?')) {
                // Heuristic: if it's an H2 and doesn't have a question mark, it might be a new topic
                if (nextElem.is('h2') && currentQuestion === null) {
                    break;
                }
            }

            if (isHeader || isBold) {
                currentQuestion = nextElem.text().trim();
            } else if (currentQuestion && nextElem.is('p')) {
                const answer = nextElem.text().trim();
                if (answer.length > 10) { // arbitrary length check for valid answer
                    faqs.push({ question: currentQuestion, answer });
                    currentQuestion = null; // reset for next
                }
            }
            
            nextElem = nextElem.next();
            siblingCount++;
        }
    });

    // Clean up duplicates just in case
    const uniqueFaqs = [];
    const seenQs = new Set();
    for (const faq of faqs) {
        if (!seenQs.has(faq.question)) {
            uniqueFaqs.push(faq);
            seenQs.add(faq.question);
        }
    }

    if (uniqueFaqs.length === 0) return null;

    return {
        "@type": "FAQPage",
        "@id": GLOBAL_ORG_URL + "/#faq",
        "mainEntity": uniqueFaqs.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };
}

function extractCitations($) {
    const citations = [];
    $('a[href]').each(function() {
        const href = $(this).attr('href');
        if (href && (href.includes('.edu') || href.includes('.gov') || href.includes('researchgate.net') || href.includes('ncbi.nlm.nih.gov'))) {
            citations.push(href);
        }
    });
    return citations.length > 0 ? [...new Set(citations)] : null;
}

function processFile(filePath) {
    try {
        let fileContent = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(fileContent, { decodeEntities: false });
        
        let schemaUpdated = false;

        // Find Rank Math Schema
        const schemaRegex = /<script type="application\/ld\+json"\s*class="rank-math-schema">([\s\S]*?)<\/script>/i;
        const match = fileContent.match(schemaRegex);

        if (!match) return;

        let jsonString = match[1];
        let schema;

        try {
            schema = JSON.parse(jsonString);
            if (!schema['@graph']) return;

            // 1. Organization & Person Schema
            let org = schema['@graph'].find(item => item['@type'] === 'Organization' || (Array.isArray(item['@type']) && item['@type'].includes('Organization')));
            if (org) {
                if (org.name !== GLOBAL_ORG_NAME || org.url !== GLOBAL_ORG_URL || !(org.sameAs && org.sameAs.includes(GLOBAL_LINKEDIN))) {
                    org.name = GLOBAL_ORG_NAME;
                    org.url = GLOBAL_ORG_URL;
                    if (!org.sameAs) org.sameAs = [];
                    if (!org.sameAs.includes(GLOBAL_LINKEDIN)) {
                        org.sameAs.push(GLOBAL_LINKEDIN);
                    }
                    schemaUpdated = true;
                }
            }

            // 2. Author Schema
            let authors = schema['@graph'].filter(item => item['@type'] === 'Person' && (item['@id'] && item['@id'].includes('/author/')));
            authors.forEach(author => {
                let authorUpdated = false;
                if (!author.description || author.description !== DEFAULT_AUTHOR_BIO) {
                    author.description = DEFAULT_AUTHOR_BIO;
                    authorUpdated = true;
                }
                if (!author.worksFor && org) {
                    author.worksFor = { "@id": org['@id'] };
                    authorUpdated = true;
                }
                if (authorUpdated) schemaUpdated = true;
            });

            // 3. FAQ Schema
            const faqSchema = extractFaqSchema($);
            if (faqSchema) {
                const existingFaqIndex = schema['@graph'].findIndex(item => item['@type'] === 'FAQPage');
                if (existingFaqIndex > -1) {
                     schema['@graph'][existingFaqIndex] = faqSchema;
                } else {
                     schema['@graph'].push(faqSchema);
                }
                schemaUpdated = true;
            }

            // 4. Citations on WebPage or BlogPosting
            const citations = extractCitations($);
            if (citations) {
                let pageOrPost = schema['@graph'].find(item => item['@type'] === 'WebPage' || item['@type'] === 'BlogPosting');
                if (pageOrPost) {
                    // Only update if citations changed
                    if (JSON.stringify(pageOrPost.citation) !== JSON.stringify(citations)) {
                        pageOrPost.citation = citations;
                        schemaUpdated = true;
                    }
                }
            }

            if (schemaUpdated) {
                // Replace in the original file content string
                fileContent = fileContent.replace(schemaRegex, `<script type="application/ld+json" class="rank-math-schema">${JSON.stringify(schema)}</script>`);
                fs.writeFileSync(filePath, fileContent);
                console.log(`Updated Schema in: ${filePath}`);
            }

        } catch (err) {
            console.error(`Error parsing schema in ${filePath}:`, err.message);
        }

    } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
    }
}

// Ensure cheerio is installed
function run() {
    console.log("Starting AI SEO Schema Propagation...");
    console.log(`Scanning directory: ${BASE_DIR}`);
    const htmlFiles = findHtmlFiles(BASE_DIR);
    console.log(`Found ${htmlFiles.length} index.html files.`);
    
    htmlFiles.forEach(file => {
        // Skip node_modules or dist folders
        if (file.includes('node_modules')) return;
        processFile(file);
    });
    console.log("Propagation complete.");
}

run();
