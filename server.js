// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Basic Setup ---
const app = express();
const port = 3000; // We'll run this server on port 3000

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the express server to understand JSON in request bodies

// --- Configure the Gemini API ---
// Check for API Key
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: Gemini API Key not found. Please set it in the .env file.');
  process.exit(1);
}
// Initialize the Google Gemini client
// --- Configure the Gemini API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define a generation config with a high temperature for unique responses.
const generationConfig = {
  temperature: 0.9,
};

// Initialize the model WITH the new generation configuration
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: generationConfig, // Pass our new config here
});

// --- API Endpoints ---

// 1. Endpoint to generate interview questions
app.post('/generate-questions', async (req, res) => {
  try {
    const { topic } = req.body; // Get topic from request body

    if (!topic) {
      return res.status(400).json({ error: 'Missing "topic" in request body' });
    }

    const prompt = `Generate 5 fresh and insightful technical interview questions about ${topic}. Avoid overly common questions. Return the questions as a JSON-formatted list of strings. For example: ["Question 1", "Question 2"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response from the AI to ensure it's valid JSON
    text = text.replace(/```json\n?/g, '').replace(/```/g, '');

    // Send the cleaned text back as a JSON response
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error('Error in /generate-questions:', error);
    res.status(500).json({ error: 'Failed to generate questions from AI model.' });
  }
});

// 2. Endpoint to analyze answers and give feedback
app.post('/analyze-answers', async (req, res) => {
  try {
    const { qa_list, topic } = req.body;

    if (!qa_list || !topic) {
      return res.status(400).json({ error: 'Missing qa_list or topic in request body' });
    }

    // The prompt is the same as our Python version
    // In server.js, inside the app.post('/analyze-answers', ...) route

    const prompt_text = `
      You are a helpful and experienced tech interview coach.
      Your task is to generate a performance report based on the following interview.

      Your entire response MUST be a single block of HTML content suitable for placing inside a <div>.
      Please follow this structure precisely:

      1.  Begin with a "<div>" with the class "overall-summary". This div should contain your brief analysis of the candidate's performance, including strengths and areas for improvement.

      2.  After the summary, provide a series of accordion items for each question. For each item, you must use this exact HTML structure:
          <div class="accordion-item">
            <button class="accordion-header" aria-expanded="false">
              <span class="question-title">Question X: [The first few words of the question]...</span>
              <span class="accordion-icon">+</span>
            </button>      <div class="accordion-content">
              <h4>Full Question: [The full question text]</h4>
              <p class="user-answer">[The user's full answer]</p>
              <div class="feedback">
                <h5>Feedback:</h5>
                </div>
            </div>
          </div>

      IMPORTANT: Do not include any tags like <html>, <head>, <body>, <title>, <style>, or <script> in your response.

      Here is the interview data:
      ${qa_list.map((item, index) => `\nQuestion ${index + 1}: ${item.question}\nAnswer: ${item.answer}`).join('')}`;

    const result = await model.generateContent(prompt_text);
    const response = await result.response;
    const analysisHtml = response.text();

    res.json({ analysis: analysisHtml });
  } catch (error) {
    console.error('Error in /analyze-answers:', error);
    res.status(500).json({ error: 'Failed to analyze answers.' });
  }
});

// --- Start The Server ---
app.listen(port, () => {
  console.log(`Node.js server listening at http://localhost:${port}`);
});
