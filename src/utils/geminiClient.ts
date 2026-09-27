/**
 * Unified Client-Side & Server-Side Gemini AI Service with In-Memory LRU Cache & Request Deduplication
 * Compatible with standard Express backend, Vercel Static SPAs, and Standalone Single-file deployments.
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MoodResult {
  characterName: string;
  characterEnglish: string;
  matchedSong: string;
  empathyInsight: string;
  bilingualQuote: string;
  encouragementMessage: string;
}

// -------------------------------------------------------------
// In-Memory Bounded LRU Cache & In-Flight Promise Deduplication (SWR-Lite)
// -------------------------------------------------------------
class BoundedLRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }
}

const apiCache = new BoundedLRUCache<string, { data: any; timestamp: number }>(50);
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes TTL

function getCacheKey(endpoint: string, payload: any): string {
  return `${endpoint}:${JSON.stringify(payload)}`;
}

// Fallback intelligent literary knowledge engine if API is unreachable or offline
const LITERARY_FALLBACKS: Record<string, string[]> = {
  valjean: [
    "「只要世間仍有因貧困而導致的黑暗，我們就必須在心中點燃希望的燭火。」24601 不過是囚牢編號，而我的靈魂在卞福汝主教的寬恕中重獲新生。為了柯賽特，為了每一個渴望明天的生命，愛便是看見上帝的面容。",
    "在下水道背負馬里歐的那一夜，我望著巴黎的泥濘，深知拯救一個年輕的生命就是拯救未來的希望。縱使沙威在身後緊追，恩慈永遠大於復仇。"
  ],
  javert: [
    "「律法如星辰般恆久不移，軌道分明，絕不容許絲毫偏差。」我一生奉獻給秩序與正義，然而當尚萬強在街壘將我的性命歸還於我時，那份超乎律法的寬恕，如巨石般擊碎了我信奉一生的信仰之崖。",
    "我沙威從不偏離職守，但若罪犯能擁有聖徒般的光輝，那麼這世界究竟何謂正義？這深淵般的困惑，撕裂了我對絕對律法的恪守。"
  ],
  fantine: [
    "「曾幾何時，我也有過甜美的夢想……」但命運奪走了我的青春，卻奪不走我對柯賽特的愛。即使在最寒冷的工廠與街頭，只要能看見柯賽特平安長大，我的靈魂便能在雲端的城堡中獲得安息。",
    "請告訴尚萬強先生，感謝他守護了我的女兒。即便是最黑暗的長夜，也終將在愛的歌聲中迎來曙光。"
  ],
  marius: [
    "「這顆心充滿了愛，這顆心充滿了歌聲。」在街壘上，我看著同伴們為了自由而倒下，紅旗染透了巴黎的石板路。但當我看著柯賽特的眼眸，我知道明天的希望正等待著我們去重建。",
    "空蕩蕩的桌椅（Empty Chairs at Empty Tables）紀錄著摯友們的熱血，我將帶著恩佐拉與夥伴們的理想，在自由的新世界中好好活下去。"
  ],
  eponine: [
    "「獨自一人（On My Own），在雨夜中漫步，假裝他正擁抱著我……」我知道馬里歐的心中只有柯賽特，但只要能守護在他身旁，即便在街壘為他擋下致命的子彈，我也感到無比滿足與平靜。",
    "小雨輕輕落下，只要他在我身邊，泥濘的街道也如同盛開的花園。這是我給他最深沉、卻也最安靜的愛。"
  ],
  cosette: [
    "「雲端有一座城堡，那裡沒有哭泣與寒冷……」記憶中童年的恐懼與德納第夫婦的呵斥，都在父親尚萬強溫暖的手掌中消散。如今馬里歐與我攜手，我們將把這份愛延續至明天的世界。",
    "父親的白髮是歲月與愛的證明。他教會了我：真愛是世上最偉大的救贖與力量。"
  ],
  enjolras: [
    "「你可聽見人民的歌聲？那是憤怒人們唱響的旋律！」街壘是我們爭取自由與尊嚴的堡壘，即使六月起義的火光在黑夜中熄滅，自由之樹已汲取了青年的熱血，明日必將盛放！",
    "不要畏懼犧牲，因為每一聲吶喊都在喚醒法蘭西的靈魂。紅旗所指之處，便是新黎明的方向！"
  ],
  thenardier: [
    "「哈哈！歡迎光臨旅店客棧！這世上哪有什麼崇高理想？唯有口袋裡的銀幣才是真理！」在亂世中，愚蠢的人談論犧牲，精明的人學會搜刮死者的皮夾。活下去才是最高藝術！",
    "管他是國王還是革命黨，誰付錢誰就是大爺！在這骯髒的巴黎下水道裡，只有老德納第能永遠笑到最後！"
  ],
  default: [
    "《悲慘世界》是一部跨越時代的史詩巨作。雨果以「長夜終將過去，太陽必將升起」為主軸，深刻刻畫了愛、救贖、正義與社會底層的苦難。慈大附中雙語班同學以極富情感的英文口語演繹，正是將這份跨世紀的光芒帶入現代舞台。",
    "劇中每一首樂章——從《I Dreamed a Dream》的絕望到《Do You Hear The People Sing》的昂揚——都是對人類崇高尊嚴與自由意志的禮讚。"
  ]
};

// Helper to fetch with retry defense and backoff
async function fetchWithRetry(url: string, body: any, retries = 2): Promise<any> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
      if (res.status >= 500 || res.status === 429) {
        // Server error or rate limit, retry after backoff
        await new Promise((r) => setTimeout(r, 800 * Math.pow(1.8, i)));
        continue;
      }
      break; // 4xx client errors should not retry
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(1.8, i)));
      }
    }
  }
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Perform character roleplay or drama Q&A with caching & deduplication
 */
export async function callAiChat(params: {
  message: string;
  characterId?: string;
  characterName?: string;
  history?: ChatMessage[];
}): Promise<string> {
  const { message, characterId, characterName, history } = params;
  const cacheKey = getCacheKey('/api/ai/chat', { message, characterId, historyLength: history?.length });

  // 1. Check in-memory cache
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Check in-flight request deduplication
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 3. Try backend secure server API route with network timeout and retry defense
  const requestPromise = (async () => {
    try {
      const data = await fetchWithRetry('/api/ai/chat', { message, characterId, characterName, history }, 1);
      if (data && data.reply) {
        apiCache.set(cacheKey, { data: data.reply, timestamp: Date.now() });
        return data.reply;
      }
    } catch (e) {
      // Backend API unreachable, timed out, or standalone client mode
    } finally {
      inFlightRequests.delete(cacheKey);
    }

    // 4. High-fidelity Literary Offline Fallback Engine
    const bank = (characterId && LITERARY_FALLBACKS[characterId]) || LITERARY_FALLBACKS.default;
    const randomIndex = Math.floor(Math.random() * bank.length);
    const fallbackText = `${bank[randomIndex]}\n\n（※ 演出小筆記：2026 慈大附中英文公演將於 12/19 演藝廳登場，歡迎現場感受震撼對白！）`;
    apiCache.set(cacheKey, { data: fallbackText, timestamp: Date.now() });
    return fallbackText;
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Perform mood resonance analysis with caching & deduplication
 */
export async function callAiMood(params: {
  moodCategory?: string;
  moodText?: string;
}): Promise<MoodResult> {
  const cacheKey = getCacheKey('/api/ai/analyze-mood', params);

  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    try {
      const data: MoodResult = await fetchWithRetry('/api/ai/analyze-mood', params, 1);
      if (data) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    } catch (e) {
      // Offline fallback or timeout
    } finally {
      inFlightRequests.delete(cacheKey);
    }

    const fallback: MoodResult = {
      characterName: '尚萬強 (Jean Valjean)',
      characterEnglish: 'Jean Valjean',
      matchedSong: '《Bring Him Home》/《Who Am I》',
      empathyInsight: `在「${params.moodCategory || '心靈求索'}」的當下，您正如尚萬強在風雨中守護信念一般，堅定而充滿慈悲。`,
      bilingualQuote: 'Even the darkest night will end and the sun will rise. (即使最黑暗的長夜終將結束，太陽必將升起。)',
      encouragementMessage: '不要畏懼眼前的考驗，您的努力與善意正在為明天鋪墊溫暖的曙光！'
    };
    apiCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}
