export interface NetworkNode {
  id: string;
  name: string;
  nameEn: string;
  roleName: string;
  roleNameEn: string;
  category: 'principal' | 'supporting';
  image: string;
  color: string;
  bio: string;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  relationZh: string;
  relationEn: string;
  type: 'rivalry' | 'love' | 'family' | 'comrades' | 'promise';
  title: string;
  dialogueEn: string;
  dialogueZh: string;
  context: string;
  songName?: string;
}

export const NETWORK_NODES: NetworkNode[] = [
  {
    id: 'valjean',
    name: '尚萬強',
    nameEn: 'Jean Valjean',
    roleName: '苦役犯 24601 / 市長',
    roleNameEn: 'Convict 24601 / Mayor',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    color: '#8c2d2d',
    bio: '悲慘世界的核心主角，從苦役犯救贖為仁慈長者。'
  },
  {
    id: 'javert',
    name: '賈維爾',
    nameEn: 'Inspector Javert',
    roleName: '警官督察',
    roleNameEn: 'Police Inspector',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    color: '#3b82f6',
    bio: '冷酷執著的執法者，將法律視為唯一真理。'
  },
  {
    id: 'fantine',
    name: '芳婷',
    nameEn: 'Fantine',
    roleName: '悲慘母親',
    roleNameEn: 'Tragic Mother',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    color: '#ec4899',
    bio: '純真不幸的女工，為撫養女兒付出一切。'
  },
  {
    id: 'cosette',
    name: '珂賽特',
    nameEn: 'Cosette',
    roleName: '芳婷之女 / 養女',
    roleNameEn: 'Fantine\'s Daughter',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    color: '#f59e0b',
    bio: '象徵光明與希望的女孩，與馬禮斯真摯相愛。'
  },
  {
    id: 'marius',
    name: '馬禮斯',
    nameEn: 'Marius Pontmercy',
    roleName: '熱血革命青年',
    roleNameEn: 'Revolutionary Student',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    color: '#10b981',
    bio: '貴族出身的革命青年，在理想與愛情中抉擇。'
  },
  {
    id: 'eponine',
    name: '愛波妮',
    nameEn: 'Éponine',
    roleName: '德納第長女',
    roleNameEn: 'Thénardier\'s Daughter',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    color: '#a855f7',
    bio: '默默暗戀馬禮斯的深情少女，最終在街壘獻出生命。'
  },
  {
    id: 'enjolras',
    name: '安喬拉',
    nameEn: 'Enjolras',
    roleName: 'ABC之友革命領袖',
    roleNameEn: 'Leader of Les Amis de l\'ABC',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    color: '#ef4444',
    bio: '信念純潔如火的學生領袖，號召巴黎人民起義。'
  },
  {
    id: 'thenardiers',
    name: '德納第夫婦',
    nameEn: 'Thénardiers',
    roleName: '市儈酒館夫婦',
    roleNameEn: 'Innkeepers',
    category: 'principal',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    color: '#84cc16',
    bio: '狡詐貪婪的酒館夫妻，市井機巧的生存者。'
  }
];

export const NETWORK_LINKS: NetworkLink[] = [
  {
    id: 'link-valjean-javert',
    source: 'valjean',
    target: 'javert',
    relationZh: '宿命追捕與信念對抗',
    relationEn: 'Lifelong Pursuit & Ideological Clash',
    type: 'rivalry',
    title: '【宿命對峙與信仰瓦解】',
    dialogueEn: `Javert: "Valjean, at last! We meet again. You're wearing a fine coat now, Monsieur le Maire, but inside you're still 24601!"\nValjean: "Before you chain me up again, Javert, there is a girl I must save... I give you my word, I will return!"\nJavert: "You know me too well to think I'd fall for that! Once a thief, always a thief!"`,
    dialogueZh: `賈維爾：「尚萬強，終於又遇見你了！市長先生，你穿得衣冠楚楚，但本質依然是罪犯 24601！」\n尚萬強：「在我被你重新鎖上之前，賈維爾，我必須先救那個女孩... 我向你發誓，我一定會回來！」\n賈維爾：「你太了解我了，別想騙我！一日為賊，終生為賊！」`,
    context: '1823 年蒙特勒伊醫院，經典獨唱與對唱《The Confrontation》，展現冰冷法理與神聖大愛的終極撞擊。',
    songName: 'The Confrontation / Stars'
  },
  {
    id: 'link-valjean-fantine',
    source: 'valjean',
    target: 'fantine',
    relationZh: '臨終託孤與神聖承諾',
    relationEn: 'Deathbed Vow & Guardianship',
    type: 'promise',
    title: '【病榻前的救贖承諾】',
    dialogueEn: `Fantine: "My Cosette... she's cold, she's dark... Please, Monsieur, keep her safe..."\nValjean: "I swear by all that's holy, she shall know a father's care. I will raise her as my own!"`,
    dialogueZh: `芳婷：「我的珂賽特... 她很冷，那裡很黑... 求求您，先生，一定要保護她...」\n尚萬強：「我以神聖的名義發誓，她將享有父親般的關愛，我會視她如己出！」`,
    context: '芳婷重病臨終前，尚萬強接下撫養珂賽特的誓言，這份承諾徹底重塑了尚萬強後半生的精神靈魂。',
    songName: 'Fantine\'s Death / Come to Me'
  },
  {
    id: 'link-valjean-cosette',
    source: 'valjean',
    target: 'cosette',
    relationZh: '深情養父與希望化身',
    relationEn: 'Devoted Father & Light of Hope',
    type: 'family',
    title: '【逃亡歲月中的慈愛保護】',
    dialogueEn: `Cosette: "Papa, you look so tired. Why do we always run in the dark?"\nValjean: "Because the world is full of shadows, my dear, but as long as I have you, I have seen the face of God."`,
    dialogueZh: `珂賽特：「爸爸，你你看起來好累。為什麼我們總是在黑暗中奔逃呢？」\n尚萬強：「因為這世界充滿陰影，親愛的，但只要有你在身邊，我就看見了上帝的容顏。」`,
    context: '尚萬強將珂賽特帶離惡劣的酒館，兩人在巴黎修道院相依為命，珂賽特是尚萬強生命的至高寄託。',
    songName: 'Dear Cosette / Epilogue'
  },
  {
    id: 'link-cosette-marius',
    source: 'cosette',
    target: 'marius',
    relationZh: '真摯相愛與光芒交會',
    relationEn: 'Pure Devotion & First Sight',
    type: 'love',
    title: '【花園裡的真愛告白】',
    dialogueEn: `Marius: "A heart full of love, no room for any other! No words for my delight!"\nCosette: "I never saw you until now, and yet I knew your face..."`,
    dialogueZh: `馬禮斯：「心中充滿了愛，再也容不下其他！這份喜悅無法用言語形容！」\n珂賽特：「我直到此刻才看見你，但我彷彿早已熟悉你的面容...」`,
    context: '盧森堡公園外的初次凝望與普魯梅路花園的深情對唱《A Heart Full of Love》，為嚴肅史詩注入溫柔曙光。',
    songName: 'A Heart Full of Love'
  },
  {
    id: 'link-marius-eponine',
    source: 'marius',
    target: 'eponine',
    relationZh: '單戀微光與街壘赴死',
    relationEn: 'Unrequited Love & Ultimate Sacrifice',
    type: 'love',
    title: '【雨夜獨唱與雨中殞落】',
    dialogueEn: `Éponine: "Look, I brought you Cosette's address... I would do anything for you, Marius."\nMarius: "Éponine, you're the best friend a man could ever have!"\nÉponine: "A little fall of rain can hardly hurt me now..."`,
    dialogueZh: `愛波妮：「看，我幫你找到了珂賽特的地址... 為了你，馬禮斯，我願意做任何事。」\n馬禮斯：「愛波妮，你是我這輩子最好的朋友！」\n愛波妮：「這一點綿綿細雨，再也傷害不了我了...」`,
    context: '愛波妮隱瞞心碎為馬禮斯傳遞情書，並在 1832 年街壘起義中替馬禮斯擋下致命子彈，死於馬禮斯懷中。',
    songName: 'On My Own / A Little Fall of Rain'
  },
  {
    id: 'link-marius-enjolras',
    source: 'marius',
    target: 'enjolras',
    relationZh: 'ABC之友革命同志',
    relationEn: 'Revolutionary Comrades',
    type: 'comrades',
    title: '【革命理想與青年號召】',
    dialogueEn: `Enjolras: "Marius, the time is near! Will you stand with us at the barricades for France?"\nMarius: "My heart is torn between a woman's eyes and the call of liberty!"\nEnjolras: "Red - the blood of angry men! Black - the dark of ages past!"`,
    dialogueZh: `安喬拉：「馬禮斯，時刻到了！你願意和我們一起站在街壘上，為法蘭西而戰嗎？」\n馬禮斯：「我的心在女孩的雙眸與自由的呼喚之間掙扎！」\n安喬拉：「紅色是激昂熱血！黑色是過去的暗夜！」`,
    context: 'ABC之友學生團體在柯林斯酒館發表激昂演說，馬禮斯在愛情與革命理想間熱血交織。',
    songName: 'Red and Black / Do You Hear the People Sing'
  },
  {
    id: 'link-thenardiers-cosette',
    source: 'thenardiers',
    target: 'cosette',
    relationZh: '童年虐待與苛扣剝削',
    relationEn: 'Childhood Exploitation',
    type: 'rivalry',
    title: '【雲端城堡與酒館童年】',
    dialogueEn: `Madame Thénardier: "Fetch the bucket, Cosette! Stop dreaming, you lazy little brat!"\nCosette: "There is a castle on a cloud... I like to go there in my sleep..."`,
    dialogueZh: `德納第夫人：「去提水，珂賽特！別做白日夢了，你這個懶惰的小鬼！」\n珂賽特：「雲端上有一座城堡... 我喜歡在睡夢中去那裡...」`,
    context: '幼年珂賽特在蒙費梅伊酒館過著如奴隸般的悲慘生活，直到尚萬強帶著金幣將她贖出。',
    songName: 'Castle on a Cloud / Master of the House'
  },
  {
    id: 'link-valjean-marius',
    source: 'valjean',
    target: 'marius',
    relationZh: '街壘救命與聖潔祝福',
    relationEn: 'Sewer Rescue & Paternal Blessing',
    type: 'promise',
    title: '【下水道背負與《Bring Him Home》】',
    dialogueEn: `Valjean: "God on high, hear my prayer... Bring him home, he's like the son I might have known."\nMarius: "Who was the stranger who carried me through the sewers of Paris?"`,
    dialogueZh: `尚萬強：「至高的上帝，請聽我的祈禱... 帶他回家吧，他就像我未曾擁有的親生兒子。」\n馬禮斯：「到底是哪一位陌生人，背著我穿過了巴黎惡臭的下水道？」`,
    context: '街壘淪陷之夜，尚萬強默默背著重傷昏迷的馬禮斯穿過巴黎下水道泥濘，拯救了女兒的摯愛。',
    songName: 'Bring Him Home / Empty Chairs at Empty Tables'
  },
  {
    id: 'link-thenardiers-eponine',
    source: 'thenardiers',
    target: 'eponine',
    relationZh: '市儈家庭與價值裂痕',
    relationEn: 'Familial Strain & Criminal Pressure',
    type: 'family',
    title: '【搶劫衝突與劃清界線】',
    dialogueEn: `Thénardier: "Join the gang, Éponine! Help us rob the old fool Valjean!"\nÉponine: "I won't! I'm done with your filthy tricks!"`,
    dialogueZh: `德納第：「加入幫派，愛波妮！幫我們搶劫尚萬強那個老傻瓜！」\n愛波妮：「我不幹！我再也不想參與你們下流的勾當了！」`,
    context: '德納第企圖幫派攔路搶劫尚萬強，愛波妮大聲呼喊示警保護馬禮斯與尚萬強，徹底與家族犯罪割裂。',
    songName: 'The Robbery / Attack on Rue Plumet'
  },
  {
    id: 'link-[#fantine-cosette]',
    source: 'fantine',
    target: 'cosette',
    relationZh: '母女深情與遙遠夢想',
    relationEn: 'Motherly Love & Tragic Separation',
    type: 'family',
    title: '【《I Dreamed a Dream》母愛絕唱】',
    dialogueEn: `Fantine: "Cosette, it's turned so cold... I dreamed that love would never die, and God would be forgiving..."`,
    dialogueZh: `芳婷：「珂賽特，天氣變得好冷... 我曾夢想愛永不磨滅，上帝終將寬恕一切...」`,
    context: '芳婷為了籌集珂賽特的養育費而賣髮賣牙，這份犧牲貫穿了《悲慘世界》前半場最催淚的母愛軸線。',
    songName: 'I Dreamed a Dream'
  }
];
