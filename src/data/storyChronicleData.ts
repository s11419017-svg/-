export interface BookPage {
  pageNumber: number;
  chapterTitleEn: string;
  chapterTitleZh: string;
  subTitle: string;
  yearSetting: string;
  quoteEn: string;
  quoteZh: string;
  dropCap: string;
  contentZh: string[];
  historicalContext: string;
  keyThemes: string[];
  illustrationUrl?: string;
  illustrationCaption?: string;
}

export const BOOK_PAGES: BookPage[] = [
  {
    pageNumber: 1,
    chapterTitleEn: "PROLOGUE",
    chapterTitleZh: "序幕：時代巨浪與救贖之光",
    subTitle: "十九世紀法國社會的黑暗與人道曙光",
    yearSetting: "1815 年，法國狄涅 (Digne)",
    quoteEn: "So long as there arises from the laws, a social condemnation, creating artificial hells... books like this cannot be useless.",
    quoteZh: "只要法律和習俗造成的社會壓迫，人為地把地獄降臨人間... 這類書就絕不會是無用的。",
    dropCap: "一",
    contentZh: [
      "八一五年的法國，滑鐵盧戰役落幕，王朝復辟的陰影籠罩著社會底層。飢餓、貧困與嚴苛的法律將無數窮苦平民逼入絕境。",
      "故事始於苦役犯尚萬強（Jean Valjean）在服刑十九年後重獲自由。只因偷了一塊麵包救活飢餓的姪兒，他被烙上「24601」的囚犯印記，黃色通行證讓他舉步維艱，遭世人摒棄。",
      "然而，狄涅城米里哀主教（Bishop Myriel）以寬恕的聖潔大愛拯救了他。當尚萬強偷走銀器被捕時，主教卻謊稱那是贈予他的禮物，並將一對銀燭臺相送，叮囑他用這筆錢「做一個誠實的人」。這份超越法律的寬容，點燃了尚萬強心靈深處的救贖火種。"
    ],
    historicalContext: "十九世紀初期的法國歷經拿破崙戰爭與波旁復辟，貧富差距懸殊，底層階級面臨極端飢餓與不公的法制打壓。",
    keyThemes: ["苦難與原罪", "神聖寬恕", "靈魂重生"],
    illustrationUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    illustrationCaption: "手稿古籍上的《悲慘世界》原著經典題詞"
  },
  {
    pageNumber: 2,
    chapterTitleEn: "ACT I - SCENE I",
    chapterTitleZh: "第一幕：市井悲歌與死別誓言",
    subTitle: "芳婷的犧牲與珂賽特的童年",
    yearSetting: "1823 年，濱海蒙特勒伊 (Montreuil-sur-Mer)",
    quoteEn: "There is a castle on a cloud, I like to go there in my sleep... Nobody fights, nobody cries.",
    quoteZh: "雲端之上有一座城堡，我喜歡在睡夢中前往... 那裡沒有爭吵，沒有哭泣。",
    dropCap: "化",
    contentZh: [
      "化名馬德蘭先生的尚萬強成為振興小鎮經濟的仁慈市長，然而命運並未放過他。冷酷執法者賈維爾警官（Javert）始終懷疑他的身分，堅信「一日為賊，終生為賊」。",
      "與此同時，女工芳婷（Fantine）因私生女身份遭工廠解僱。為了支付酒館德納第夫婦（Thénardiers）苛扣的女兒養育費，芳婷被迫賣掉長髮、牙齒，甚至淪落風塵，在絕望中唱出《I Dreamed a Dream》。",
      "芳婷重病臨終前，尚萬強趕至病榻。他在芳婷身旁立下神聖誓言，承諾終身撫養小珂賽特（Cosette），將她從惡劣的酒館虐待中贖出，開始了長達數年的逃亡與相依為命。"
    ],
    historicalContext: "童工與底層女工在工業革命初期的極端處境，社會福利缺失導致無數母親為撫養子女付出生命代價。",
    keyThemes: ["母愛的極致犧牲", "法理與人情的矛盾", "承諾的重量"],
    illustrationUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    illustrationCaption: "十九世紀手抄劇本頁面與羽毛筆墨跡"
  },
  {
    pageNumber: 3,
    chapterTitleEn: "ACT II - SCENE I",
    chapterTitleZh: "第二幕：熱血巴黎與街壘怒吼",
    subTitle: "ABC 之友與六月起義爆發",
    yearSetting: "1832 年，巴黎 (Paris, June Rebellion)",
    quoteEn: "Do you hear the people sing? Singing a song of angry men? It is the music of a people who will not be slaves again!",
    quoteZh: "你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌！那是絕不甘再為奴隸的心聲！",
    dropCap: "一",
    contentZh: [
      "一八三二年六月，深受人民愛戴的拉馬克將軍病逝，巴黎街頭瀰漫著革命的火藥味。由安喬拉（Enjolras）領導的「ABC 之友」學生革命團體在柯林斯酒館號召民眾起義。",
      "貴族出身的青年馬禮斯（Marius）在革命理想與對珂賽特的真摯愛情中抉擇。而德納第之女愛波妮（Éponine）則默默忍受著單戀的心碎，在暗夜中吟唱《On My Own》，並為保護馬禮斯而前往街壘。",
      "當夜幕降臨巴黎街頭，青年們築起巨型街壘。這不僅是一場反抗專制的起義，更是一群理想主義青年用青春與熱血譜寫的自由壯歌。"
    ],
    historicalContext: "1832 年巴黎六月起義（June Rebellion），青年學生與底層工人因霍亂疫情與經濟蕭條發起武裝抗爭。",
    keyThemes: ["革命理想與青春熱血", "單戀與無私代價", "自由的呼喚"],
    illustrationUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    illustrationCaption: "象徵自由革命的自由女神與街壘旗幟繪圖"
  },
  {
    pageNumber: 4,
    chapterTitleEn: "ACT II - SCENE II",
    chapterTitleZh: "第二幕：下水道的救贖與信念瓦解",
    subTitle: "尚萬強的背負與賈維爾的投河",
    yearSetting: "1832 年深夜，巴黎下水道與塞納河畔",
    quoteEn: "Bring him home, bring him home... He's like the son I might have known.",
    quoteZh: "帶他回家吧，帶他回家... 他就像我未曾擁有的親生兒子。",
    dropCap: "街",
    contentZh: [
      "街壘戰況慘烈，學生軍陷入包圍。尚萬強為了保護養女珂賽特的愛人，深夜悄然潛入街壘，在神聖祈禱《Bring Him Home》中請求上帝保佑馬禮斯的生命。",
      "在街壘陷落的最後時刻，尚萬強背起重傷昏迷的馬禮斯，艱難地穿過惡臭黑暗的巴黎下水道泥濘。途中他放走了被俘的賈維爾，以德報怨。",
      "面對尚萬強一次又一次的神聖寬恕，賈維爾一生堅守的冷酷法理世界徹底崩塌。他無法接受一個罪犯竟然比自己更具聖潔人格，在極度的精神痛苦中跳入塞納河滾滾波濤。"
    ],
    historicalContext: "巴黎地下複雜的排水系統是雨果原著中極具象徵意味的隱喻，代表著文明城市背後的陰暗與人性救贖之路。",
    keyThemes: ["父愛的至高昇華", "法理信仰的破滅", "人性光輝的勝出"],
    illustrationUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80",
    illustrationCaption: "手繪塞納河夜景與歷史法典羊皮紙"
  },
  {
    pageNumber: 5,
    chapterTitleEn: "EPILOGUE",
    chapterTitleZh: "終章：長夜將盡與太陽升起",
    subTitle: "慈大附中高二知足班（雙語班）的世代精神傳承",
    yearSetting: "2026 年，慈大附中演藝廳",
    quoteEn: "To love another person is to see the face of God. Even the darkest night will end and the sun will rise!",
    quoteZh: "去愛一個人，就是看見上帝的容顏。即便最黑暗的長夜終將結束，太陽必將升起！",
    dropCap: "歷",
    contentZh: [
      "馬禮斯與珂賽特舉辦了盛大婚禮，尚萬強在完成了人生所有使命後，在蠟燭微光中平靜走向生命的終點。芳婷與愛波妮的英靈前來接引，全體角色唱響終曲《Epilogue》。",
      "二〇二六年慈大附中高二知足班（雙語班）同學選擇《悲慘世界》作為年度英文公演劇本，不僅是語言能力與舞台藝術的展現，更是十七歲青年對社會關懷與人性尊嚴的深刻體悟。",
      "從一八一五年的狄涅到二〇二六年的花蓮演藝廳，這部經典史詩將繼續感動每一位走進劇場的靈魂。邀請您一同翻開這本歲月手稿，見證長夜盡頭的燦爛曙光！"
    ],
    historicalContext: "慈大附中 115 級高二知足雙語班英文公演，全體師生歷經半年跨領域排練，打造花蓮在地最具震撼力的青少年劇院盛事。",
    keyThemes: ["世代傳承", "永恆的愛與希望", "雙語公演精神"],
    illustrationUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    illustrationCaption: "古典羽毛筆與手稿詩集紀念印記"
  }
];
