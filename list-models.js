const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await response.json();
    console.log("--- AVAILABLE MODELS ---");
    data.models.forEach(m => {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`Model: ${m.name} | Display: ${m.displayName}`);
      }
    });
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

list();