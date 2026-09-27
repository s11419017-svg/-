import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// -------------------------------------------------------------
// Production Security Headers & Cross-Origin Resource Sharing (CORS)
// -------------------------------------------------------------
app.use((req, res, next) => {
  // CORS configuration to prevent browser Same-Origin Policy blocking
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Modern Security Hardening Headers (deprecated X-XSS-Protection removed per W3C/MDN standards)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Handle Preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Server-side Gemini AI client initialization with singleton reuse
let aiClientInstance: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not set in environment variables.');
    }
    aiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClientInstance;
};

// -------------------------------------------------------------
// In-Memory Audio Cache for Azure Speech (prevents duplicate API charges)
// -------------------------------------------------------------
interface CachedAudio {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}
const audioCache = new Map<string, CachedAudio>();
const MAX_AUDIO_CACHE_ENTRIES = 120;

// API routes FIRST
// 0. Standardized Health & System Status Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Les Misérables TCSH Backend',
    version: '1.1.0',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    azureSpeechConfigured: !!process.env.AZURE_SPEECH_KEY,
  });
});

// 0.1 Microsoft Azure Speech Service Status
app.get('/api/speech/status', (_req, res) => {
  const hasKey = !!process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'eastasia';
  res.json({
    configured: hasKey,
    region,
    provider: 'Microsoft Azure Cognitive Services Speech (Neural TTS)',
    cachedAudiosCount: audioCache.size,
    fallbackAvailable: true,
  });
});

// 0.2 Recommended Character & Accessibility Tour Voices Catalog
app.get('/api/speech/voices', (_req, res) => {
  res.json({
    characters: [
      { id: 'valjean', name: 'Jean Valjean (尚萬強)', voice: 'en-GB-RyanNeural', lang: 'en-GB', style: 'serious', role: 'Male lead, profound & compassionate' },
      { id: 'javert', name: 'Javert (沙威)', voice: 'en-GB-OliverNeural', lang: 'en-GB', style: 'strict', role: 'Male, unyielding law & authority' },
      { id: 'fantine', name: 'Fantine (芳婷)', voice: 'en-GB-SoniaNeural', lang: 'en-GB', style: 'sad', role: 'Female, delicate, tragic motherhood' },
      { id: 'cosette', name: 'Cosette (柯賽特)', voice: 'en-GB-MaisieNeural', lang: 'en-GB', style: 'cheerful', role: 'Female, youthful, pure & hopeful' },
      { id: 'eponine', name: 'Éponine (艾波妮)', voice: 'en-GB-LibbyNeural', lang: 'en-GB', style: 'sorrowful', role: 'Female, street-smart & heartbroken' },
      { id: 'marius', name: 'Marius (馬里歐)', voice: 'en-GB-AlfieNeural', lang: 'en-GB', style: 'passionate', role: 'Male, romantic & idealistic' },
      { id: 'enjolras', name: 'Enjolras (恩佐拉)', voice: 'en-GB-ThomasNeural', lang: 'en-GB', style: 'hopeful', role: 'Male, revolutionary charismatic leader' },
      { id: 'thenardier', name: 'Thénardier (德納第)', voice: 'en-GB-RyanNeural', lang: 'en-GB', style: 'cheerful', role: 'Male rogue, comic & cynical' },
    ],
    accessibilityTour: [
      { id: 'narrator-tw-female', name: '繁中導覽親切女聲 (曉臻)', voice: 'zh-TW-HsiaoChenNeural', lang: 'zh-TW', default: true },
      { id: 'narrator-tw-male', name: '繁中導覽典雅男聲 (雲哲)', voice: 'zh-TW-YunJheNeural', lang: 'zh-TW' },
      { id: 'narrator-en-british', name: '英式音樂劇導讀女聲 (Sonia)', voice: 'en-GB-SoniaNeural', lang: 'en-GB' },
      { id: 'narrator-en-formal', name: '英式歷史莊嚴男聲 (Ryan)', voice: 'en-GB-RyanNeural', lang: 'en-GB' },
    ]
  });
});

// 0.3 Microsoft Azure Neural Text-to-Speech Synthesizer
app.post('/api/speech/synthesize', async (req, res) => {
  try {
    const {
      text,
      voice = 'zh-TW-HsiaoChenNeural',
      rate = '0%',
      pitch = '0%',
      style,
      lang = 'zh-TW'
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text parameter is required for speech synthesis' });
    }

    const cleanText = text.trim();
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastasia';

    if (!apiKey) {
      // Clean fallback signal so client seamlessly falls back to window.speechSynthesis
      return res.status(503).json({
        error: 'Azure Speech Key is not configured',
        fallback: true,
        message: 'AZURE_SPEECH_KEY is missing. Client should fallback to native browser Web Speech API.'
      });
    }

    // Cache key based on voice, text, rate, pitch, style
    const cacheKey = `${voice}_${rate}_${pitch}_${style || 'none'}_${cleanText}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    // Escape special XML characters in text for SSML
    const escapedText = cleanText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Build SSML
    let innerContent = `<prosody rate="${rate}" pitch="${pitch}">${escapedText}</prosody>`;
    if (style) {
      innerContent = `<mstts:express-as style="${style}">${innerContent}</mstts:express-as>`;
    }

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
  <voice name="${voice}">
    ${innerContent}
  </voice>
</speak>`;

    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'TCSH-LesMiserables-Musical-Production',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Azure Speech API error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Azure Speech Synthesis Failed',
        status: response.status,
        details: errorText,
        fallback: true
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save into in-memory LRU cache
    if (audioCache.size >= MAX_AUDIO_CACHE_ENTRIES) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, {
      buffer,
      contentType: 'audio/mpeg',
      createdAt: Date.now(),
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (error: any) {
    console.error('TTS Route Exception:', error);
    return res.status(500).json({
      error: 'TTS synthesis error',
      details: error?.message || 'Unknown error',
      fallback: true,
    });
  }
});


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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characterName: { type: Type.STRING, description: 'Matching Les Mis character name in Traditional Chinese' },
            characterEnglish: { type: Type.STRING, description: 'English name of character' },
            matchedSong: { type: Type.STRING, description: 'Title of matching song from Les Mis (bilingual)' },
            empathyInsight: { type: Type.STRING, description: 'Analytic reflection on why this character matches the user\'s state' },
            bilingualQuote: { type: Type.STRING, description: 'A famous English quote from the song with Traditional Chinese translation' },
            encouragementMessage: { type: Type.STRING, description: 'Warm uplifting guidance inspired by Les Mis theme of hope and tomorrow' },
          },
          required: ['characterName', 'characterEnglish', 'matchedSong', 'empathyInsight', 'bilingualQuote', 'encouragementMessage'],
        },
      },
    });

    let jsonText = (response.text || '{}').trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
    }
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

// -------------------------------------------------------------
// Vite Middleware & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled
          ? false
          : {
              server: httpServer,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Les Misérables Production Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
