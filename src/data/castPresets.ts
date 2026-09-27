export interface CharacterPreset {
  id: string;
  roleName: string;
  roleNameEn: string;
  category: 'principal' | 'ensemble' | 'crew';
  vocalPart: string;
  characterBio: string;
  classicQuote: string;
  spokenLine: string;
  reflectionStarter: string;
  defaultImage: string;
  avatarOptions: { label: string; url: string }[];
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'valjean',
    roleName: '尚萬強',
    roleNameEn: 'Jean Valjean',
    category: 'principal',
    vocalPart: '男高音 (Dramatic Tenor)',
    characterBio: '編號 24601 的苦役犯，因偷麵包入獄十九年。在米里哀主教的感化下獲得靈魂新生，成為伸張正義的市長與養父。',
    classicQuote: '「為了這句《Who Am I》的獨白的發音與氣息，我們在語言教室練習了超過三十遍...」',
    spokenLine: 'To love another person is to see the face of God.',
    reflectionStarter: '詮釋尚萬強從苦役犯到聖潔靈魂的十九年心路歷程，不僅是英語發音與音域的挑戰，更是心靈的叩問。希望觀眾能透過我們的演繹，感受到生命的寬恕與大愛。',
    defaultImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '莊重成熟男主角 (Valjean)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80' },
      { label: '深沉長者造型', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80' },
      { label: '戲劇張力肖像', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'javert',
    roleName: '賈維爾',
    roleNameEn: 'Inspector Javert',
    category: 'principal',
    vocalPart: '男中低音 (Baritone)',
    characterBio: '冷酷執著的警督，視法律為唯一真理。畢生追捕尚萬強，最終在法律與高尚道德的衝突中陷入信仰瓦解。',
    classicQuote: '「賈維爾不是壞人，他是法律與信念的囚徒。理解他的執念是我最深刻的英文演譯體驗。」',
    spokenLine: 'Those who follow the path of the righteous shall have their reward.',
    reflectionStarter: '為了展現警官冷酷而堅定不移的威嚴，我深入研究了十九世紀法國警政歷史與發音咬字。在塞納河畔崩潰的獨白《Stars》，是我高中階段最難忘的舞台體驗。',
    defaultImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '嚴肅警官 (Javert)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80' },
      { label: '冷峻側臉造型', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'fantine',
    roleName: '芳婷',
    roleNameEn: 'Fantine',
    category: 'principal',
    vocalPart: '次女高音 (Mezzo-Soprano)',
    characterBio: '純潔而命運坎坷的底層工廠女工，為了撫養私生女珂賽特賣掉頭髮、牙齒與尊嚴，在絕望中唱出對美好生命的憧憬。',
    classicQuote: '「在唱出《I Dreamed a Dream》時，我感受到了底層女性最堅韌而絕望的母愛。」',
    spokenLine: 'I dreamed that love would never die... I had a dream my life would be so different.',
    reflectionStarter: '芳婷的母愛是整部劇最柔弱卻也最堅不可摧的光芒。在排練《I Dreamed a Dream》時，每次唱到聲音哽咽，都讓我和現場夥伴深受震撼。',
    defaultImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '溫婉抒情 (Fantine)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
      { label: '憂傷堅毅氣質', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'cosette',
    roleName: '珂賽特 (成年)',
    roleNameEn: 'Cosette',
    category: 'principal',
    vocalPart: '花腔/女高音 (Soprano)',
    characterBio: '芳婷之女，尚萬強撫育長大的愛女。經歷童年虐待後走向光明，代表著新一代的希望與愛。',
    classicQuote: '「珂賽特在黑白亂世中就像一抹鵝黃色的陽光，帶來純真與救贖。」',
    spokenLine: 'A heart full of love, a heart full of you.',
    reflectionStarter: '珂賽特的歌聲象徵著暴風雨後升起的彩虹，我嘗試用最純淨透明的共鳴演繹《In My Life》，希望把這份幸福感傳遞給台下的每一位觀眾。',
    defaultImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '清純陽光 (Cosette)', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80' },
      { label: '優雅氣質肖像', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'marius',
    roleName: '馬里歐',
    roleNameEn: 'Marius Pontmercy',
    category: 'principal',
    vocalPart: '男高音 (Lyric Tenor)',
    characterBio: '理想主義的巴黎貴族青年革命者，在街壘運動與對珂賽特的真摯愛戀之間承受考驗。',
    classicQuote: '「看著空無一人的咖啡館，唱出《Empty Chairs at Empty Tables》是我最心痛的段落。」',
    spokenLine: 'There is a grief that can\'t be spoken, there is a pain goes on and on.',
    reflectionStarter: '馬里歐既有年輕男子的浪漫迷惘，又有革命戰友倒下後的錐心劇痛。這份情感的立體度，讓我對人際羈絆有了更深刻的同理心。',
    defaultImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '熱血浪漫青年 (Marius)', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80' },
      { label: '英倫紳士風貌', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'eponine',
    roleName: '愛波寧',
    roleNameEn: 'Éponine',
    category: 'principal',
    vocalPart: '強混聲/次女高音 (Belt Mezzo)',
    characterBio: '泰納第夫婦之女，成長於巴黎街頭。深愛馬里歐卻甘願為他傳遞情書，最終在街壘戰役中為保護心愛之人而犧牲。',
    classicQuote: '「在雨中獨唱《On My Own》時，那是整部劇最令人心碎的孤獨與執著。」',
    spokenLine: 'A little fall of rain can hardly hurt me now.',
    reflectionStarter: '愛波寧是全劇中個性最鮮明也最惹人憐惜的角色。在暴雨與硝煙中唱出《A Little Fall of Rain》，我學會了用靈魂最深處的真誠去感染他人。',
    defaultImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '街頭倔強少女 (Éponine)', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80' },
      { label: '滄桑堅強特寫', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'enjolras',
    roleName: '安喬拉',
    roleNameEn: 'Enjolras',
    category: 'principal',
    vocalPart: '男高音 (Heroic Tenor)',
    characterBio: '學生革命組織「ABC 之友社」的精神領袖，英俊威嚴、目光堅定，為了法蘭西共和自由殉道於街壘頂端。',
    classicQuote: '「揮舞紅旗唱出《Do You Hear the People Sing?》，感受全場脈搏一同跳動！」',
    spokenLine: 'Let others rise to take our place, until the earth is free!',
    reflectionStarter: '飾演革命領袖安喬拉需要強大的氣場與號召力。我們在台上帶領合唱時，感受到了青年世代對於理想與正義的純粹追求。',
    defaultImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '革命青年領袖 (Enjolras)', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80' },
      { label: '英武側影造型', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'thenardier',
    roleName: '泰納第',
    roleNameEn: 'Thénardier',
    category: 'principal',
    vocalPart: '性格男中音 (Comic Baritone)',
    characterBio: '客棧老闆，貪婪狡黠的小人與街頭惡棍。在動盪時代以無底線的欺瞞手段求生，提供劇中黑色幽默亮點。',
    classicQuote: '「《Master of the House》讓排練現場充滿歡樂笑聲，反派也可以極具舞台魅力！」',
    spokenLine: 'Master of the house, quick to catch your eye! Never wants a passerby to pass him by!',
    reflectionStarter: '演繹泰納第需要極佳的肢體幽默感與誇張表情。我們反覆琢磨酒保的滑稽走位與偷扒技巧，讓整場喜劇節奏明快精彩。',
    defaultImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '市儈喜劇反派 (Thénardier)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'gavroche',
    roleName: '小加夫洛許',
    roleNameEn: 'Gavroche',
    category: 'principal',
    vocalPart: '童聲/少年 (Boy Soprano / Treble)',
    characterBio: '巴黎街頭頑童，機靈無畏、幽默風趣。為街壘守軍冒著槍林彈雨蒐集子彈，最終中彈倒地，成為自由之子。',
    classicQuote: '「身軀雖小，勇氣無畏！加夫洛許是街頭最自由的小鳥！」',
    spokenLine: 'Little people know when little people fight, we may look easy pickings but we got some bite!',
    reflectionStarter: '加夫洛許的無畏與早熟深深打動了我。穿梭在街壘收集彈藥的那一幕，讓我體驗到了超越年齡的英勇與奉獻。',
    defaultImage: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '機靈街童少年 (Gavroche)', url: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'ensemble',
    roleName: '革命青年與市民群演',
    roleNameEn: 'Students & Paris Ensemble',
    category: 'ensemble',
    vocalPart: '四部混聲大合唱 (SATB Choir)',
    characterBio: '1832 巴黎共和革命中的學生青年、工人與貧苦市民群體，以震撼人心的合唱推動歷史洪流。',
    classicQuote: '「台上沒有小角色，只有大演員！每一個群演的眼神都是法國大時代的一面鏡子。」',
    spokenLine: 'Will you join in our crusade? Who will be strong and stand with me?',
    reflectionStarter: '雖然是群戲，但每一個走位、每一次吶喊都要求極致默契。正是全班三十多位同學的聲浪匯聚，才成就了這場舞台史詩。',
    defaultImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '歌隊與群眾 (Ensemble)', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' },
      { label: '合唱舞台寫真', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    id: 'crew',
    roleName: '舞台總監與幕後執行組',
    roleNameEn: 'Stage Management & Crew',
    category: 'crew',
    vocalPart: '後台技術指令組',
    characterBio: '負責燈光、音效、大型街壘道具組裝與演員換裝調度的幕後無名英雄，確保演出的每一個 Cue 點精準落地。',
    classicQuote: '「我們在聚光燈照不到的暗處，守護著整座舞台的奇蹟。」',
    spokenLine: 'Standby light cues, sound check ready. Curtains going up!',
    reflectionStarter: '幕後團隊是整場演出的心臟。從劇本倒數、音控軌道到舞台快換，我們在黑暗中精準協作，見證了青春最美的綻放。',
    defaultImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
    avatarOptions: [
      { label: '幕後製作總監 (Crew)', url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80' },
      { label: '燈光音控作業', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80' },
    ],
  },
];

export const REHEARSAL_TEMPLATES = [
  {
    title: '全體大合唱與發聲共鳴排練',
    caption: '高二知足雙語班在音樂教室進行《Do You Hear the People Sing?》四部合唱分部協調與英語重音咬字練習。',
    category: 'rehearsal' as const,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '主要演員對手戲走位與劇本研讀',
    caption: '尚萬強與賈維爾在塞納河畔對決前的緊張走位彩排，指導老師逐句細調英國古典文法發音。',
    category: 'stage' as const,
    image: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '青年軍街壘道具組裝與試驗',
    caption: '道具組同學親手以環保木料與手繪布幔搭建長達五公尺的巴黎革命街壘，視覺震撼力十足。',
    category: 'costume' as const,
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '演藝廳舞台燈光音效走位總彩排',
    caption: '慈大演藝廳舞台現場燈光實測，冷暖色調聚光燈交織出十九世紀法國動盪歷史風雲。',
    category: 'stage' as const,
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
];
