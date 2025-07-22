#!/usr/bin/env node

/**
 * Test script for Raindrop.io API endpoints
 * Usage: node test-endpoints.js or pnpm test:endpoints
 */

const RAINDROP_TOKEN = process.env.RAINDROP_TOKEN;
const BASE_URL = 'https://api.raindrop.io/rest/v1';

if (!RAINDROP_TOKEN) {
  console.error('❌ RAINDROP_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to make HTTP requests using native fetch
async function makeRequest(path, method = 'GET', data = null) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log({ url });

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${RAINDROP_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Raindrop-MCP-Test/1.0',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    let responseData;
    const contentType = response.headers.get('content-type');

    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (e) {
      responseData = `Error reading response: ${e.message}`;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Test functions
async function testEndpoint(name, path, method = 'GET', data = null) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`   ${method} ${BASE_URL}${path}`);

    const result = await makeRequest(path, method, data);

    if (result.status >= 200 && result.status < 300) {
      console.log(`   ✅ Success (${result.status})`);
      if (result.data) {
        console.log(
          `   📊 Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`
        );
      }
      return true;
    } else {
      console.log(`   ❌ Failed (${result.status})`);
      console.log(`   📊 Error: ${JSON.stringify(result.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Raindrop.io API endpoint tests\n');
  console.log(`🔑 Using token: ${RAINDROP_TOKEN.substring(0, 8)}...`);

  const tests = [
    // User endpoints
    ['Get User Profile', '/user'],

    // Collection endpoints
    ['Get All Collections', '/collections'],
    ['Get Root Collections', '/collections/childrens'],

    // Raindrop endpoints
    ['Get All Raindrops', '/raindrops/0'],
    ['Get Unsorted Raindrops', '/raindrops/-1'],

    // Filter endpoints
    ['Get Filters for All', '/filters/0'],

    // Tags endpoints
    ['Get All Tags', '/tags'],

    // Search endpoint
    ['Search Raindrops', '/raindrops/0?search=test&perpage=5'],
  ];

  const results = [];

  for (const [name, path, method, data] of tests) {
    const success = await testEndpoint(name, path, method, data);
    results.push({ name, success });

    // Add small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}`);
  });

  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! API connection is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check your API token and permissions.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
