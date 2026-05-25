import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');

async function testModel(modelName: string) {
  console.log(`\n--- Testing Model: ${modelName} ---`);
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Write a short 1-sentence developer bio for someone with a GitHub credential."
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('Success!');
    console.log('Response text:', response.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (error: any) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', JSON.stringify(error.response?.data || error.message));
  }
}

async function run() {
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-3.5-flash');
}

run();
