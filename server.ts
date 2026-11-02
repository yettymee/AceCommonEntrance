import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Solve question step-by-step
app.post('/api/solve', async (req, res) => {
  try {
    const { question, subject, options = [], selectedAnswer, correctAnswer, solveMode = 'step-by-step' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    if (!ai) {
      // High-quality fallback if API key is not ready
      return res.json({
        correctOption: correctAnswer || (options.length > 0 ? options[0] : 'See working'),
        shortSummary: `Here is how to solve this ${subject || 'Common Entrance'} question systematically.`,
        steps: [
          {
            stepNumber: 1,
            title: 'Identify the Given Information',
            explanation: `Carefully read the question prompt: "${question}". Highlight the numbers, keywords, or conditions given.`,
            calculationOrFormula: 'Step 1: Check what is known and what needs to be found.',
          },
          {
            stepNumber: 2,
            title: 'Apply the Core Rule',
            explanation: `For ${subject || 'this subject'}, recall the standard formula or grammatical/scientific rule needed.`,
            calculationOrFormula: 'Step 2: Carry out calculations or logic checks step-by-step.',
          },
          {
            stepNumber: 3,
            title: 'Verify Against the Options',
            explanation: 'Match your final result with the multiple-choice options provided.',
            calculationOrFormula: `Final Answer: ${correctAnswer || 'Option matched'}`,
          },
        ],
        keyConcept: `Mastering fundamentals in ${subject || 'Common Entrance'}.`,
        kidTip: 'Always double-check your rough work on paper or scratchpad before selecting your answer bubble!',
        whyOthersAreWrong: [],
      });
    }

    const systemInstruction = `You are "Teacher Ayo", a brilliant, warm, and encouraging primary school teacher and Common Entrance exam specialist.
Your mission is to guide Grade 5/6 (Primary 5/6) pupils (ages 9-12) through solving Common Entrance examination past questions across approved subjects:
Mathematics, English Language, Quantitative Aptitude, Verbal Aptitude, Basic Science & Technology, and Social Studies / National Values.

Tone: Friendly, encouraging, crystal-clear, structured, and easy for a 10-year-old child to understand.
Explain formulas using real-life examples where helpful.
Never use complicated academic jargon without immediately defining it simply.`;

    const prompt = `Solve this Common Entrance question for a kid:
Subject: ${subject || 'General'}
Question: "${question}"
Options: ${JSON.stringify(options)}
${correctAnswer ? `Official Correct Answer: ${correctAnswer}` : ''}
${selectedAnswer ? `Student Selected: ${selectedAnswer}` : ''}
Requested Mode: ${solveMode}

Provide a comprehensive, crystal clear step-by-step breakdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctOption: {
              type: Type.STRING,
              description: 'The exact correct answer or option letter and text (e.g. "B) 45 km/h" or explanation)',
            },
            shortSummary: {
              type: Type.STRING,
              description: 'A 1-2 sentence kid-friendly overview of how to arrive at the solution.',
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: 'Short step name, e.g. "Step 1: Convert units to minutes"' },
                  explanation: { type: Type.STRING, description: 'Clear explanation for a 10-year-old child.' },
                  calculationOrFormula: { type: Type.STRING, description: 'Math line or logical pattern breakdown' },
                },
                required: ['stepNumber', 'title', 'explanation'],
              },
            },
            keyConcept: {
              type: Type.STRING,
              description: 'The core educational principle or syllabus topic.',
            },
            kidTip: {
              type: Type.STRING,
              description: 'A fun memory trick or golden rule for kids to remember in the exam hall.',
            },
            whyOthersAreWrong: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  option: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['option', 'reason'],
              },
              description: 'Why incorrect options are common traps (distractors)',
            },
          },
          required: ['correctOption', 'shortSummary', 'steps', 'keyConcept', 'kidTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error solving question:', error);
    res.status(500).json({
      error: 'Failed to solve question with AI. Please try again.',
      details: error.message,
    });
  }
});

// Endpoint: Ask Teacher Ayo (Interactive Student Tutor)
app.post('/api/ask-tutor', async (req, res) => {
  try {
    const { questionContext, studentQuery, subject } = req.body;

    if (!studentQuery) {
      return res.status(400).json({ error: 'Student query is required.' });
    }

    if (!ai) {
      return res.json({
        reply: `Great question! When solving ${subject || 'this problem'}, remember to take it one step at a time. Write down what you know, calculate carefully, and check your answer!`,
      });
    }

    const prompt = `A primary school student studying for their Common Entrance exam has a question:
Subject: ${subject || 'Common Entrance'}
Question Context: "${questionContext || 'None'}"
Student asks: "${studentQuery}"

Answer as Teacher Ayo: warm, friendly, using simple analogies (like sharing candies, walking to school, or building blocks), praise their curiosity, and give a clear, direct answer in 2-3 short paragraphs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are Teacher Ayo, a kind, encouraging elementary school educator teaching Common Entrance pupils.',
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in ask-tutor:', error);
    res.status(500).json({ error: 'Failed to generate tutor reply.', details: error.message });
  }
});

// Endpoint: Generate similar Common Entrance practice question
app.post('/api/generate-similar', async (req, res) => {
  try {
    const { subject, topic, difficulty = 'Standard Common Entrance' } = req.body;

    if (!ai) {
      return res.json({
        question: `In a school of 450 pupils, 3/5 are boys. How many girls are in the school?`,
        options: ['A) 180', 'B) 270', 'C) 150', 'D) 300', 'E) 90'],
        correctAnswer: 'A) 180',
        topic: topic || 'Fractions & Proportions',
        hint: 'Find the fraction of girls first (1 - 3/5 = 2/5) or calculate the number of boys and subtract.',
        explanation: 'Fraction of girls = 1 - 3/5 = 2/5. Number of girls = 2/5 × 450 = 180.',
      });
    }

    const prompt = `Generate 1 realistic, high-quality Common Entrance exam multiple-choice question for:
Subject: ${subject || 'Mathematics'}
Topic: ${topic || 'Standard Syllabus'}
Difficulty: ${difficulty}

Standard format: Question stem, 5 options (A, B, C, D, E), correct answer, a kid-friendly hint, and step-by-step explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            topic: { type: Type.STRING },
            hint: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ['question', 'options', 'correctAnswer', 'hint', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating similar question:', error);
    res.status(500).json({ error: 'Failed to generate question.', details: error.message });
  }
});

// Vite middleware / static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
