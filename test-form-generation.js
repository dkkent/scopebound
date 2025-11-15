const http = require('http');

const projectId = 'test-ai-project-123'; // E-commerce platform project

console.log('🧪 Testing Claude AI Form Generation');
console.log('=====================================\n');

// Step 1: Login to get session cookie
function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    console.log('🔐 Step 1: Logging in...');
    const req = http.request(options, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 && cookies.length > 0) {
          console.log('   ✅ Login successful\n');
          resolve(cookies.join('; '));
        } else {
          console.log('   ❌ Login failed:', res.statusCode);
          console.log('   Response:', data);
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Step 2: Generate form with authentication
function generateForm(cookies) {
  return new Promise((resolve, reject) => {
    console.log(`🤖 Step 2: Generating form with Claude AI...`);
    console.log(`   Project ID: ${projectId}\n`);

    const postData = JSON.stringify({});

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${projectId}/generate-form`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      console.log(`   Response Status: ${res.statusCode}`);

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonResponse });
        } catch (error) {
          console.log('   Raw response:', data);
          reject(new Error('Failed to parse JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run the test
(async () => {
  try {
    const cookies = await login();
    const result = await generateForm(cookies);

    console.log('📦 Response:\n');
    console.log(JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.success && result.data.formData) {
      console.log('\n✅ SUCCESS! Form generated successfully');
      console.log(`\n📋 Form Structure:`);
      console.log(`   - Form ID: ${result.data.formId}`);
      console.log(`   - Sections: ${result.data.formData.sections?.length || 0}`);
      
      if (result.data.formData.sections) {
        result.data.formData.sections.forEach((section, idx) => {
          console.log(`\n   Section ${idx + 1}: "${section.title}"`);
          console.log(`   ${section.description || '(no description)'}`);
          console.log(`   Questions: ${section.questions?.length || 0}`);
          
          section.questions?.forEach((q, qIdx) => {
            console.log(`      ${qIdx + 1}. [${q.type}] ${q.label}`);
            if (q.options) {
              console.log(`         Options: ${q.options.length}`);
            }
          });
        });
      }

      console.log(`\n🔒 Security Check:`);
      console.log(`   - shareToken in response: ${result.data.shareToken ? '❌ LEAKED!' : '✅ Excluded'}`);
      console.log(`   - formId in response: ${result.data.formId ? '✅ Included' : '❌ Missing'}`);
      console.log(`   - formData in response: ${result.data.formData ? '✅ Included' : '❌ Missing'}`);
      
      console.log('\n🎉 Test completed successfully!');
    } else {
      console.log('\n❌ FAILED!');
      console.log(`Status: ${result.status}`);
      console.log(`Error: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();
