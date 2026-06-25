const { chromium } = require('playwright');

exports.createProfile = async (firstName, lastName) => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://www.facebook.com/r.php');
        
        // វាយបញ្ចូលទិន្នន័យ
        await page.fill('input[name="firstname"]', firstName);
        await page.fill('input[name="lastname"]', lastName);
        
        // បន្ថែម Logic បន្តតាមតម្រូវការ (ចុចប៊ូតុង, ជ្រើសរើសថ្ងៃខែឆ្នាំកំណើត)
        console.log(`Bot started for: ${firstName} ${lastName}`);
        
        return { status: 'Success' };
    } catch (err) {
        throw new Error(err.message);
    }
};