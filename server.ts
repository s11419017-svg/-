import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Server-side Gemini AI client initialization
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// -------------------------------------------------------------
// AI API Routes
// -------------------------------------------------------------

// 1. Character Roleplay & General Les Mis Q&A
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, characterId, characterName, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getAiClient();

    let systemInstruction = `You are a deeply knowledgeable and empathetic AI drama scholar and guide for the 2026 TCSH High School English Drama Production of "Les Misérables" (慈大附中高二表演英文公演《悲慘世界》). 
You provide elegant, insightful, and emotionally resonant answers in Traditional Chinese (繁體中文), with relevant English quotes from Victor Hugo's original work or the musical when appropriate.
Maintain a warm, literary, and dramatic tone.`;

    if (characterId && characterName) {
      systemInstruction = `You are roleplaying as the character ${characterName} (character ID: ${characterId}) from Victor Hugo's "Les Misérables" (悲慘世界).
Speak in the authentic voice, personality, moral philosophy, and dramatic tone of ${characterName}.
Respond primarily in Traditional Chinese (繁體中文), while seamlessly embedding iconic English lines or quotes from the musical/novel where fitting.
Remain in character while being respectful, artistic, and emotionally engaging.
Character traits guidance:
- Jean Valjean (尚萬強): Compassionate, noble, tormented by his past (24601), dedicated to redemption, love for Cosette, and God.
- Javert (沙威): Rigid, unyielding devotion to the strict law, moral dilemma, dark solemn duty, struggling with mercy vs law.
- Fantine (芳婷): Devoted mother, tragedy, fragile yet heroic love for Cosette, yearning for peace.
- Marius (馬里歐): Romantic, idealistic revolutionary student, torn between devotion to revolution ("Do You Hear the People Sing") and love for Cosette.
- Cosette (柯賽特): Pure, innocent, hopeful, symbolizes the light and future after dark suffering.
- Éponine (艾波妮): Fierce, tragic, unrequited love ("On My Own"), street-smart, loyal despite heartbreak.
- Enjolras (恩佐拉): Fiery, charismatic leader of the ABC student revolution, willing to die for liberty and democracy.
- M. Thénardier (德納第): Cynical, greedy, comical rogue, survivor of the dark underworld ("Master of the House").`;
    }

    // Format previous history into prompt context if provided
    let fullPrompt = message;
    if (history && Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6).map((h: { role: string; text: string }) => `${h.role === 'user' ? 'Visitor' : characterName || 'AI Guide'}: ${h.text}`).join('\n');
      fullPrompt = `[Conversation Context]\n${recentHistory}\n\nVisitor: ${message}\n${characterName || 'AI Guide'}:`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const reply = response.text || '抱歉，思想的沉吟暫時無法化為言語，請稍後再試。';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return res.status(500).json({
      error: 'AI 服務連線失敗',
      details: error?.message || '未知錯誤',
    });
  }
});

// 2. Mood & Empathy Matcher
app.post('/api/ai/analyze-mood', async (req, res) => {
  try {
    const { moodText, moodCategory } = req.body;
    if (!moodText && !moodCategory) {
      return res.status(400).json({ error: 'Mood description is required' });
    }

    const ai = getAiClient();
    const systemInstruction = `You are an AI Musical Empathy Analyst for "Les Misérables". Given a user's mood or life state, analyze their current emotion, pair them with the Les Misérables character and song that best matches their spirit, and write a deeply encouraging bilingual quote & message. Response MUST be valid JSON conforming to the schema.`;

    const prompt = `User's current state: Category: "${moodCategory || 'General'}", Details: "${moodText || 'Seeking inspiration'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            characterName: { type: 'STRING' as any, description: 'Matching Les Mis character name in Traditional Chinese' },
            characterEnglish: { type: 'STRING' as any, description: 'English name of character' },
            matchedSong: { type: 'STRING' as any, description: 'Title of matching song from Les Mis (bilingual)' },
            empathyInsight: { type: 'STRING' as any, description: 'Analytic reflection on why this character matches the user\'s state' },
            bilingualQuote: { type: 'STRING' as any, description: 'A famous English quote from the song with Traditional Chinese translation' },
            encouragementMessage: { type: 'STRING' as any, description: 'Warm uplifting guidance inspired by Les Mis theme of hope and tomorrow' },
          },
          required: ['characterName', 'characterEnglish', 'matchedSong', 'empathyInsight', 'bilingualQuote', 'encouragementMessage'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const resultData = JSON.parse(jsonText);
    return res.json(resultData);
  } catch (error: any) {
    console.error('Gemini Mood API Error:', error);
    return res.status(500).json({
      error: 'AI 心境解析失敗',
      details: error?.message || '未知錯誤',
    });
  }
});

// 3. Theater Review & Social Post Generator
app.post('/api/ai/generate-review', async (req, res) => {
  try {
    const { userNotes, favoriteCharacter, rating } = req.body;

    const ai = getAiClient();
    const prompt = `Write a beautiful, poetic audience reaction / theater review for 2026 TCSH English Drama Production of "Les Misérables" (慈大附中高二表演英文公演《悲慘世界》).
User notes: "${userNotes || '感動萬分，高二同學英文詮釋太精彩了！'}"
Favorite character: "${favoriteCharacter || 'Jean Valjean'}"
Rating: ${rating || 5}/5 stars.

Generate a JSON object with:
- title: catchy title in Traditional Chinese
- reviewBody: multi-paragraph elegant review (approx 200 words) blending applause for high school performers and deep reflection on Les Mis themes.
- socialCaption: concise IG/FB social media post with hashtags.
- favoriteLine: iconic line related to the review.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any },
            reviewBody: { type: 'STRING' as any },
            socialCaption: { type: 'STRING' as any },
            favoriteLine: { type: 'STRING' as any },
          },
          required: ['title', 'reviewBody', 'socialCaption', 'favoriteLine'],
        },
      },
    });

    const resultData = JSON.parse(response.text || '{}');
    return res.json(resultData);
  } catch (error: any) {
    console.error('Gemini Review API Error:', error);
    return res.status(500).json({
      error: 'AI 觀劇心得生成失敗',
      details: error?.message || '未知錯誤',
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Les Misérables Production Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
