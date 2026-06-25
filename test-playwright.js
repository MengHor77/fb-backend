const { chromium } = require('playwright');

async function testPlaywright() {
    console.log('🔍 Testing Playwright installation...');
    
    try {
        console.log('📝 Launching browser...');
        const browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox']
        });
        console.log('✅ Browser launched successfully!');
        
        const page = await browser.newPage();
        console.log('📝 Navigating to example.com...');
        await page.goto('https://example.com');
        console.log('✅ Page loaded!');
        
        const title = await page.title();
        console.log(`📝 Page title: ${title}`);
        
        await browser.close();
        console.log('✅ Playwright is working perfectly! 🎉');
        console.log('\n📝 You can now create Facebook profiles!');
        
    } catch (error) {
        console.error('❌ Playwright error:', error.message);
        console.log('\n📝 Troubleshooting:');
        console.log('1. Run: npx playwright install');
        console.log('2. Check if Windows Defender is blocking');
        console.log('3. Try running PowerShell as Administrator');
    }
}

testPlaywright();
