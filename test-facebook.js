const { createProfile } = require('./src/services/facebookBot');

async function testFacebook() {
    console.log('🚀 Testing Facebook profile creation...');
    console.log('📝 This will open a browser and try to create a Facebook account');
    console.log('⚠️  Make sure you have a good internet connection');
    console.log('');
    
    try {
        // Use headless: false to see what's happening
        const result = await createProfile('Jane', 'Smith', { 
            headless: false,  // ← Set to true to run in background
            timeout: 60000    // Increase timeout to 60 seconds
        });
        
        console.log('✅ Profile created!');
        console.log('📝 Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('📝 Common issues:');
        console.log('1. Facebook might be blocking automated requests');
        console.log('2. You might need to complete a CAPTCHA');
        console.log('3. Internet connection might be slow');
        console.log('4. Facebook might have changed their signup form');
    }
}

testFacebook();