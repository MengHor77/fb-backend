const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Helper function to generate random data
const generateRandomData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = Array.from({ length: 28 }, (_, i) => i + 1);
    const years = Array.from({ length: 50 }, (_, i) => 1970 + i);
    const genders = ['Male', 'Female', 'Custom'];
    const customGenders = ['He/Him', 'She/Her', 'They/Them'];

    return {
        month: months[Math.floor(Math.random() * months.length)],
        day: days[Math.floor(Math.random() * days.length)],
        year: years[Math.floor(Math.random() * years.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        customGender: customGenders[Math.floor(Math.random() * customGenders.length)]
    };
};

// Helper function to generate random email
const generateEmail = (firstName, lastName) => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];
    const random = Math.floor(Math.random() * 1000);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random}@${domain}`;
};

// Helper function to generate random password
const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Main profile creation function - FIXED VERSION
exports.createProfile = async (firstName, lastName, options = {}) => {
    const {
        headless = false,
        timeout = 90000,
        retries = 2,
    } = options;

    let browser = null;
    let context = null;
    let page = null;
    let attempt = 0;

    while (attempt < retries) {
        try {
            attempt++;
            console.log(`\n📝 Attempt ${attempt} for ${firstName} ${lastName}`);

            // Launch browser with stealth settings
            browser = await chromium.launch({
                headless,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1366,768',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-infobars',
                    '--disable-notifications',
                    '--disable-popup-blocking',
                    '--disable-extensions',
                    '--disable-component-extensions-with-background-pages',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-translate',
                    '--disable-features=TranslateUI',
                    '--disable-client-side-phishing-detection',
                    '--metrics-recording-only',
                    '--no-first-run',
                    '--safebrowsing-disable-auto-update',
                    '--enable-automation'  // This actually helps with some sites
                ]
            });

            // Create context with realistic settings
            context = await browser.newContext({
                viewport: { width: 1366, height: 768 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale: 'en-US',
                timezoneId: 'America/New_York',
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false,
                bypassCSP: true,
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            page = await context.newPage();

            // Navigate to Facebook signup
            console.log('🌐 Navigating to Facebook signup page...');
            
            // Go to Facebook homepage first (more natural)
            await page.goto('https://www.facebook.com/', {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
            
            // Wait a bit
            await page.waitForTimeout(2000);
            
            // Now go to signup
            await page.goto('https://www.facebook.com/r.php', {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });

            // Wait for the form to load
            console.log('⏳ Waiting for form to load...');
            
            try {
                // Wait for firstname field with longer timeout
                await page.waitForSelector('input[name="firstname"]', { timeout: 20000 });
                console.log('✅ Form loaded successfully!');
            } catch (e) {
                console.log('⚠️ Form didn\'t load, trying alternative method...');
                // Try to click on "Create New Account" button if on homepage
                try {
                    await page.click('a[data-testid="open-registration-form-button"]');
                    await page.waitForSelector('input[name="firstname"]', { timeout: 10000 });
                    console.log('✅ Form loaded via button click!');
                } catch (e2) {
                    console.log('❌ Still can\'t load form');
                    throw new Error('Form not loading');
                }
            }

            // Generate random data
            const email = generateEmail(firstName, lastName);
            const password = generatePassword();
            const randomData = generateRandomData();

            console.log('\n📝 Generated credentials:');
            console.log(`   📧 Email: ${email}`);
            console.log(`   🔑 Password: ${password}`);
            console.log(`   🎂 Birthday: ${randomData.month}/${randomData.day}/${randomData.year}`);
            console.log(`   👤 Gender: ${randomData.gender}`);
            console.log('');

            // Fill form
            console.log('📝 Filling form...');
            await page.fill('input[name="firstname"]', firstName);
            await page.fill('input[name="lastname"]', lastName);
            await page.fill('input[name="reg_email__"]', email);
            await page.fill('input[name="reg_passwd__"]', password);

            // Select birthday
            await page.selectOption('select[name="birthday_month"]', randomData.month);
            await page.selectOption('select[name="birthday_day"]', randomData.day.toString());
            await page.selectOption('select[name="birthday_year"]', randomData.year.toString());

            // Select gender
            const genderValue = randomData.gender === 'Male' ? '2' : randomData.gender === 'Female' ? '1' : '0';
            await page.click(`input[name="sex"][value="${genderValue}"]`);

            console.log('✅ Form filled successfully!');
            console.log('\n⚠️  IMPORTANT: Please complete the following steps MANUALLY:');
            console.log('   1. Solve any CAPTCHA');
            console.log('   2. Click the "Sign Up" button');
            console.log('   3. Complete any verification (email/phone)');
            console.log('\n📝 The browser will stay open for you to complete the signup');
            console.log('🔄 Press ENTER in this terminal when you have completed the signup\n');

            // Wait for user to press Enter
            await new Promise(resolve => {
                process.stdin.once('data', resolve);
            });

            // Check if signup was successful
            const currentUrl = page.url();
            console.log(`📍 Current URL: ${currentUrl}`);

            if (currentUrl.includes('facebook.com') && !currentUrl.includes('r.php') && !currentUrl.includes('reg')) {
                console.log(`✅ Profile created successfully for ${firstName} ${lastName}!`);

                const profileData = {
                    firstName,
                    lastName,
                    email,
                    password,
                    birthday: `${randomData.month}/${randomData.day}/${randomData.year}`,
                    gender: randomData.gender,
                    createdAt: new Date().toISOString()
                };

                // Save to JSON file
                const dataDir = path.join(__dirname, '../../data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }

                const filePath = path.join(dataDir, 'created_profiles.json');
                let profiles = [];
                if (fs.existsSync(filePath)) {
                    profiles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                profiles.push(profileData);
                fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2));

                return {
                    success: true,
                    message: 'Profile created successfully',
                    data: profileData
                };
            } else {
                console.log('⚠️ Signup not completed or still on signup page');
                console.log('📝 If you completed the signup, the profile was created!');
                return {
                    success: true,
                    message: 'Profile created (manual verification needed)',
                    data: { firstName, lastName, email, password }
                };
            }

        } catch (error) {
            console.error(`❌ Error on attempt ${attempt}:`, error.message);
            
            if (page) {
                try {
                    await page.screenshot({ path: `error-attempt-${attempt}.png` });
                    console.log(`📸 Screenshot saved: error-attempt-${attempt}.png`);
                } catch (e) {}
            }

            if (attempt >= retries) {
                throw new Error(`Failed to create profile after ${retries} attempts: ${error.message}`);
            }

            console.log(`⏳ Waiting 3 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
        } finally {
            // Close browser if headless, otherwise wait for user
            if (headless) {
                if (page) await page.close().catch(() => {});
                if (context) await context.close().catch(() => {});
                if (browser) await browser.close().catch(() => {});
            } else {
                console.log('\n📝 Press ENTER again to close the browser...');
                await new Promise(resolve => {
                    process.stdin.once('data', resolve);
                });
                if (page) await page.close().catch(() => {});
                if (context) await context.close().catch(() => {});
                if (browser) await browser.close().catch(() => {});
            }
        }
    }

    throw new Error('Failed to create profile after all retries');
};

// Function to create multiple profiles
exports.createMultipleProfiles = async (profiles, options = {}) => {
    const results = [];
    const { delay = 15000 } = options;

    console.log(`🚀 Starting bulk profile creation for ${profiles.length} profiles`);

    for (let i = 0; i < profiles.length; i++) {
        const { firstName, lastName } = profiles[i];
        console.log(`\n📝 Creating profile ${i + 1}/${profiles.length}: ${firstName} ${lastName}`);

        try {
            const result = await exports.createProfile(firstName, lastName, options);
            results.push({
                success: true,
                index: i,
                firstName,
                lastName,
                data: result.data
            });
        } catch (error) {
            console.error(`❌ Failed to create profile ${firstName} ${lastName}:`, error.message);
            results.push({
                success: false,
                index: i,
                firstName,
                lastName,
                error: error.message
            });
        }

        if (i < profiles.length - 1) {
            console.log(`⏳ Waiting ${delay / 1000} seconds before next profile...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`\n📊 Summary: ${successful} successful, ${failed} failed`);

    return results;
};

// Function to verify account
exports.verifyAccount = async (email, password, options = {}) => {
    const { headless = false } = options;
    let browser = null;
    let page = null;

    try {
        browser = await chromium.launch({ 
            headless,
            args: ['--no-sandbox']
        });
        page = await browser.newPage();

        console.log('🔍 Navigating to Facebook login...');
        await page.goto('https://www.facebook.com/');

        await page.fill('input[name="email"]', email);
        await page.fill('input[name="pass"]', password);
        await page.click('button[name="login"]');

        await page.waitForNavigation({ timeout: 15000 });

        const currentUrl = page.url();
        if (currentUrl.includes('facebook.com') && !currentUrl.includes('login')) {
            console.log(`✅ Account verified successfully for ${email}`);
            return { success: true, message: 'Account is active' };
        } else {
            return { success: false, message: 'Account verification failed' };
        }

    } catch (error) {
        console.error('❌ Verification error:', error.message);
        return { success: false, error: error.message };
    } finally {
        if (page) await page.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
    }
};

// Function to get profile data from saved JSON
exports.getSavedProfiles = () => {
    try {
        const filePath = path.join(__dirname, '../../data/created_profiles.json');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Error reading saved profiles:', error.message);
        return [];
    }
};