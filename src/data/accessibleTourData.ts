/**
 * Accessible Audio Tour Dataset for Les Misérables (慈大附中高二英文音樂劇公演)
 * 
 * Specifically structured for audio descriptive narration, WCAG 2.1 AA digital accessibility,
 * and seamless synchronization with section scrolling.
 */

export interface TourStop {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  targetSectionId: string;
  durationApprox: string;
  shortSummary: string;
  audioNarration: string;
  suggestedVoice: string;
  keyHighlights: string[];
}

export const ACCESSIBLE_TOUR_STOPS: TourStop[] = [
  {
    id: 'intro',
    stepNumber: 1,
    title: '序曲：革命風雲與數位劇院',
    subtitle: '慈大附中 2026 年高二英文音樂劇公演',
    targetSectionId: 'hero',
    durationApprox: '38 秒',
    shortSummary: '歡迎蒞臨《悲慘世界》公演官方網站，認識本劇精神與數位導覽機制。',
    audioNarration: '歡迎蒞臨慈濟大學實驗高級中學高二英文音樂劇《悲慘世界》公演官方網站。本展覽平台結合古典文學考究、高音質聲學重現與數位平權無障礙技術。您隨時可以使用鍵盤空白鍵暫停或播放，或按左右中括號切換章節。願這場走入十九世紀巴黎的風雨革命，帶給您愛與希望的感動。',
    suggestedVoice: 'zh-TW-HsiaoChenNeural',
    keyHighlights: ['公演序曲', '雨果名著精神', '雙語劇作呈現'],
  },
  {
    id: 'history',
    stepNumber: 2,
    title: '時代回眸：1832 年六月起義',
    subtitle: '從滑鐵盧陰霾到巴黎街壘的自由之聲',
    targetSectionId: 'history',
    durationApprox: '45 秒',
    shortSummary: '深入探討十九世紀法國社會底層的苦難、霍亂流行與學生革命浪潮。',
    audioNarration: '現在為您導讀的是歷史背景展區。十九世紀初的法國經歷滑鐵盧戰役與波旁王朝復辟，底層勞工面對貧困、嚴苛刑法與霍亂疫情。1832年，深具民望的拉馬克將軍病逝，點燃了巴黎青年學生與勞工的怒火。雨果透過這部經典，深刻揭示了法律與道德、殘酷現實與神聖仁慈之間的永恆辯證。',
    suggestedVoice: 'zh-TW-YunJheNeural',
    keyHighlights: ['1832 六月起義', '拉馬克將軍', '法制與人性的辯證'],
  },
  {
    id: 'cast',
    stepNumber: 3,
    title: '靈魂群像：角色深度與演員告白',
    subtitle: '尚萬強的救贖、沙威的正義與芳婷的母愛',
    targetSectionId: 'cast',
    durationApprox: '42 秒',
    shortSummary: '探索劇中主要角色的道德困境，並聆聽高中演員的真摯獨白。',
    audioNarration: '此區為演員與角色群像。由慈大附中學生親自詮釋核心靈魂：歷經十九年苦役依然選擇擁抱良善的尚萬強、視法條為唯一真理卻陷入精神風暴的警官沙威、在黑暗街頭守護女兒希望的芳婷。點選每位演員的卡片，您都能聆聽到以純粹英式口音發音的原劇經典對白。',
    suggestedVoice: 'zh-TW-HsiaoChenNeural',
    keyHighlights: ['編號 24601 救贖', '執法與慈悲', '英式發音原劇對白'],
  },
  {
    id: 'music',
    stepNumber: 4,
    title: '經典樂章：交響動機與抗爭之歌',
    subtitle: '《我曾有夢》、《形單影隻》與《你可聽見人民在吶喊》',
    targetSectionId: 'songs',
    durationApprox: '40 秒',
    shortSummary: '解析勛伯格與鮑伯利的傳奇音樂動機，品味樂曲背後的戲劇張力。',
    audioNarration: '在音樂展示區中，我們收錄了本劇多首不朽曲目。從芳婷絕望中的泣訴《我曾有夢》、艾波妮細雨街角的獨白《形單影隻》，到震撼全球的群唱《你可聽見人民在吶喊》。樂章以主導動機貫穿全劇，將個人的悲歡離合凝聚為群體爭取尊嚴的宏偉交響。',
    suggestedVoice: 'zh-TW-HsiaoChenNeural',
    keyHighlights: ['音樂主導動機', '革命戰歌旋律', '即時聲學分析'],
  },
  {
    id: 'schedule',
    stepNumber: 5,
    title: '演出指南：場次、地點與預約索票',
    subtitle: '慈大附中演藝廳現場演出與實名入場須知',
    targetSectionId: 'schedule',
    durationApprox: '35 秒',
    shortSummary: '提供公演確切時間、實名登記入場、電子票券驗證與無障礙動線。',
    audioNarration: '在演出與票務專區，您可以查看慈大附中演藝廳的各場次時間表。現場提供無障礙輪椅席次與優先引導服務。點擊線上登記即可取得包含防偽 QR 碼的個人數位入場券，系統亦支援離線保存與即時座位查詢。',
    suggestedVoice: 'zh-TW-YunJheNeural',
    keyHighlights: ['演藝廳場次時間', '無障礙動線與專席', '數位防偽票券'],
  },
  {
    id: 'accessibility',
    stepNumber: 6,
    title: '數位平權：全站無障礙環境落實',
    subtitle: '符合 WCAG 2.1 AA 等級之高對比、鍵盤導覽與讀報相容',
    targetSectionId: 'accessibility-section',
    durationApprox: '36 秒',
    shortSummary: '說明網站的高對比模式、鍵盤快速跳轉、文字縮放與讀報相容規範。',
    audioNarration: '本網站恪遵國際 WCAG 2.1 AA 無障礙規範。除了正在為您服務的微軟類神經語音導覽外，全站支援全鍵盤巡航、獨立焦點提示、高對比切換與四段字級縮放。若您使用 NVDA 或 VoiceOver 等螢幕報讀軟體，所有視覺元素皆已具備標準替代文字與結構標籤。',
    suggestedVoice: 'zh-TW-HsiaoChenNeural',
    keyHighlights: ['WCAG 2.1 AA 規範', '高對比與字級縮放', '全鍵盤無障礙操作'],
  },
];
