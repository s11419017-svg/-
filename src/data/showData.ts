import { CastMember, RehearsalPhoto, PlayQuote } from '../types';

import lesMisPosterImg from '../assets/images/les_mis_poster_1785560972972.jpg';
import rehearsalBw1Img from '../assets/images/rehearsal_bw_1_1785560986462.jpg';
import manuscriptImg from '../assets/images/manuscript_page_1785561004666.jpg';

export const SHOW_DETAILS = {
  title: 'Les Misérables',
  titleZh: '悲慘世界',
  subhead: '2026 慈大附中高二知足班（雙語班）表演英文公演｜English Drama Production',
  schoolName: '慈濟大學實驗高級中學 (慈大附中)',
  gradeName: '高二知足班（雙語班）演職團隊',
  eventDate: '2026-12-19T19:00:00',
  eventDateFormatted: '2026 年 12 月 19 日 (星期五)',
  doorTime: '18:30 開放入場',
  showTime: '19:00 正式開演',
  venue: '慈濟大學中央校區 大愛樓3樓演藝廳',
  venueAddress: '花蓮縣花蓮市中央路三段701號 (大愛樓 3F)',
  admissionFee: '免費憑實體門票入場（門票可於合作地點索取或學生親送發放）',
};

export const FAMOUS_QUOTES: PlayQuote[] = [
  {
    quoteEn: "Even the darkest night will end and the sun will rise.",
    quoteZh: "即便是最黑暗的長夜終將結束，太陽必將升起。",
    character: "Victor Hugo / Finale Chorus",
    context: "高二知足雙語班公演主題典範，象徵青春與希望的堅持"
  },
  {
    quoteEn: "To love another person is to see the face of God.",
    quoteZh: "去愛一個人，就是看見上帝的容顏。",
    character: "Jean Valjean (尚萬強)",
    context: "劇末靈魂救贖與愛的終極宣示"
  },
  {
    quoteEn: "Do you hear the people sing? Singing a song of angry men?",
    quoteZh: "你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌。",
    character: "Enjolras & Students (安喬拉與革命青年)",
    context: "知足班排練過程中最具震撼力的合唱經典"
  },
  {
    quoteEn: "Who am I? Can I condemn these man to slavery? Pretend I do not feel his agony?",
    quoteZh: "我是誰？我怎能忍心看著無辜者代我受罪？",
    character: "Jean Valjean (尚萬強)",
    context: "尚萬強在法庭揭露身份前的內心道德掙扎"
  }
];

export const CAST_MEMBERS: CastMember[] = [
  {
    id: 'valjean',
    name: '游承翰',
    classYear: '高二知足班',
    roleName: '尚萬強',
    roleNameEn: 'Jean Valjean',
    category: 'principal',
    quote: '「為了這句《Who Am I》的獨白的發音與氣息，我們在語言教室練習了超過三十遍...」',
    reflection: '詮釋尚萬強從苦役犯到聖潔靈魂的十九年苦難，不僅是英語發音與音樂音域的挑戰，更是心靈的叩問。希望觀眾能透過我們的演繹，感受到對生命的寬恕與大愛。',
    characterBio: '編號 24601 的苦役犯，因偷麵包入獄十九年。在米里哀主教的感化下獲得靈魂新生，成為伸張正義的市長與養父。',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'To love another person is to see the face of God.',
    favoriteQuote: 'Bring Him Home'
  },
  {
    id: 'javert',
    name: '陳奕霖',
    classYear: '高二知足班',
    roleName: '賈維爾',
    roleNameEn: 'Inspector Javert',
    category: 'principal',
    quote: '「賈維爾不是壞人，他是法律與信念的囚徒。理解他的執念是我最深刻的英文演譯體驗。」',
    reflection: '為了展現警官冷酷而堅定不移的威嚴，我研究了十九世紀法國警政歷史與古英語文法。在塞納河畔崩潰的獨白《Stars》，是我高中階段最難忘的舞台 moment。',
    characterBio: '冷酷執著的督察，視法律為唯一真理。畢生追捕尚萬強，最終在法律與高尚道德的衝突中陷入信仰瓦解。',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'There is nothing on earth that we share. It is either the law or the flaw!',
    favoriteQuote: 'Stars'
  },
  {
    id: 'fantine',
    name: '林思涵',
    classYear: '高二知足班',
    roleName: '芳婷',
    roleNameEn: 'Fantine',
    category: 'principal',
    quote: '「《I Dreamed a Dream》唱出了所有悲慘命運中的溫柔與微光。」',
    reflection: '芳婷的故事極其悲壯，每一句台詞都浸透著母愛的堅韌。每次排練《I Dreamed a Dream》，我和導演老師都會反覆咀嚼英語歌詞背後的時代微塵。',
    characterBio: '純真不幸的單親母親，為了撫養女兒珂賽特付出了一切，最終在貧困中將女兒託付給尚萬強。',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'I dreamed that love would never die... I dreamed that God would be forgiving.',
    favoriteQuote: 'I Dreamed a Dream'
  },
  {
    id: 'cosette',
    name: '張雅筑',
    classYear: '高二知足班',
    roleName: '珂賽特',
    roleNameEn: 'Cosette',
    category: 'principal',
    quote: '「珂賽特象徵黑暗世界裡的晨光，她的歌聲需要無比透亮與真摯。」',
    reflection: '童年苦難沒有磨滅珂賽特的善良。從《Castle on a Cloud》到與馬禮斯的重逢，我希望用清亮而充滿希望的語調，為這齣悲劇帶來光明。',
    characterBio: '芳婷之女，尚萬強養女。在尚萬強保護下長大，與革命青年馬禮斯相愛，是整部劇集希望的化身。',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'A heart full of love, no fear, no regret...',
    favoriteQuote: 'A Heart Full of Love'
  },
  {
    id: 'marius',
    name: '許廷宇',
    classYear: '高二知足班',
    roleName: '馬禮斯',
    roleNameEn: 'Marius Pontmercy',
    category: 'principal',
    quote: '「在革命理想與兒女私情間掙扎，《Empty Chairs at Empty Tables》寫盡了創傷與悼念。」',
    reflection: '馬禮斯是起義後唯一的倖存者。當他站在空無一人的酒吧唱著對戰友的懷念，我和同學們都在台下濕了眼眶。這是一段關於成長與緬懷的深沉課題。',
    characterBio: '男爵之孫，熱血革命青年。在 1832 年巴黎起義中與戰友並肩作戰，同時深愛著珂賽特。',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    spokenLine: "There's a grief that cannot be spoken, there's a pain your heart can't hide.",
    favoriteQuote: 'Empty Chairs at Empty Tables'
  },
  {
    id: 'eponine',
    name: '黃詩婷',
    classYear: '高二知足班',
    roleName: '愛波妮',
    roleNameEn: 'Éponine',
    category: 'principal',
    quote: '「《On My Own》背後是單戀的微酸與赴死的勇敢，也是我最喜愛的台詞。」',
    reflection: '愛波妮雖然出身卑微，但她的愛純粹而無畏。在雨中獨唱的經典段落，我們花了無數個放學後的黃昏摸索台詞的情感脈動與肢體語言。',
    characterBio: '德納第夫婦長女，暗戀馬禮斯。最終在街壘起義中為替馬禮斯擋子彈而犧牲。',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'A little fall of rain can hardly hurt me now...',
    favoriteQuote: 'On My Own'
  },
  {
    id: 'enjolras',
    name: '廖偉哲',
    classYear: '高二知足班',
    roleName: '安喬拉',
    roleNameEn: 'Enjolras',
    category: 'principal',
    quote: '「高舉紅旗號召起義的那一刻，全班同學的能量匯聚成不可思議的共鳴。」',
    reflection: '安喬拉是革命學生的領袖，具有雄辯的英文宣導力與強烈的個人魅力。這齣公演讓我深刻體會到英語劇本的語感強度與團隊領袖的凝聚力。',
    characterBio: 'ABC 之友革命學生領袖，崇高理想主義者，帶領青年築起街壘對抗不公。',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'Do you hear the people sing? Singing the song of angry men!',
    favoriteQuote: 'Do You Hear the People Sing'
  },
  {
    id: 'thenardier',
    name: '林宗翰 & 蔡佩容',
    classYear: '高二知足班',
    roleName: '德納第夫婦',
    roleNameEn: 'Thénardiers',
    category: 'principal',
    quote: '「喜劇角色的節奏最難掌握，《Master of the House》是整齣戲高潮迭起的靈魂亮點！」',
    reflection: '德納第夫婦需要極具爆發力的喜劇肢體語言與俚語英文口音。我們互相丟接梗、設計搞笑道具，為嚴肅的史詩帶來歡笑與張力。',
    characterBio: '經營破舊酒館的夫妻，市儈狡詐，極具機巧生存本能，在歷史動盪中四處搜括利益。',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    spokenLine: 'Master of the house, keeper of the zoo!',
    favoriteQuote: 'Master of the House'
  },
  {
    id: 'director',
    name: '高二知足雙語班全體 & 指導老師',
    classYear: '高二知足班 / 英文科',
    roleName: '導演與幕後製作委員會',
    roleNameEn: 'Stage Directors & Crew',
    category: 'crew',
    quote: '「從劇本剪輯、服裝道具製作到舞台燈光 cue 點，這是一場跨學科的集體創作。」',
    reflection: '經歷數個月的籌備、過稿、朗讀、對詞與總體排演，高二知足雙語班同學展現了超乎想像的語言熱情與劇場敬業精神。邀請您一同走進這座屬於我們的十九世紀劇場。',
    characterBio: '包含執行導演、舞台總監、燈光音響組、道具服裝組、外語發音指導及文宣設計組。',
    image: manuscriptImg,
    favoriteQuote: 'One Day More'
  }
];

export const REHEARSAL_PHOTOS: RehearsalPhoto[] = [
  {
    id: 'r1',
    title: '街壘起義合唱排練',
    caption: '放學後的演藝廳，全體演員在紅旗前對位合唱《Do You Hear the People Sing》，每一句英文字詞都寄託著高二青春的血氣與堅定。',
    date: '2026.10.14',
    image: rehearsalBw1Img,
    category: 'rehearsal'
  },
  {
    id: 'r2',
    title: '劇本手稿與註解研讀',
    caption: '指導老師與演員們針對 Victor Hugo 原著修辭進行句讀標記，仔細標註重音、韻律與古典語法結構。',
    date: '2026.09.28',
    image: manuscriptImg,
    category: 'script'
  },
  {
    id: 'r3',
    title: '舞台海報視覺發想',
    caption: '結合法國大革命手稿與暗灰色調紙張質感，展現高質感復古電影風格的宣傳海報。',
    date: '2026.11.02',
    image: lesMisPosterImg,
    category: 'stage'
  },
  {
    id: 'r4',
    title: '獨唱走位與燈光試摸',
    caption: '飾演尚萬強與賈維爾的同學在獨木石階上進行對峙走位試演，透過頂光展現內心信仰的衝突。',
    date: '2026.11.18',
    image: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
    category: 'stage'
  },
  {
    id: 'r5',
    title: '服裝道具復刻細節',
    caption: '道具組同學參考 1830 年代法式軍裝與市民服飾，手作復刻革命徽章與手提油燈。',
    date: '2026.11.25',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    category: 'costume'
  },
  {
    id: 'r6',
    title: '總彩排全場連貫側錄',
    caption: '第一次無中斷連貫全劇彩排，從土倫苦役場到巴黎街壘，兩小時的英文口語流暢詮釋。',
    date: '2026.12.05',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    category: 'rehearsal'
  }
];

export const FAQS = [
  {
    q: '請問本場公演需要購票嗎？如何索取實體門票入場？',
    a: '本次公演為全場免費憑【實體紙本門票】入場。門票可於合作地點免費索取，或是由慈大附中高二參演學生親送發放，憑票自由入座。'
  },
  {
    q: '公演地點在哪裡？交通與停車方便嗎？',
    a: '演出地點位於「慈濟大學中央校區 大愛樓3樓演藝廳」（地址：花蓮縣花蓮市中央路三段701號）。校區內及周邊均有來賓停車區域，建議提早抵達開放入場。'
  },
  {
    q: '若沒有拿到實體門票，現場可以候補入場嗎？',
    a: '門票為免費限量發放。若開演前 10 分鐘 (18:50) 演藝廳內仍有剩餘空位，將開放無票民眾現場候補依序入場，建議提前向參演學生或合作點索取門票。'
  },
  {
    q: '公演語言是英文嗎？是否有中文字幕？',
    a: '全程由高二表演同學以精湛全英文演出，現場舞台兩側備有繁體中文字幕屏，方便所有觀眾深入理解劇情與英語對白。'
  },
  {
    q: '觀演時間長度約多久？',
    a: '全劇含中場休息約為 120 分鐘。18:30 開始驗票入場，19:00 正式開演。'
  }
];
