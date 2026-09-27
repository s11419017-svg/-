# 慈大附中英文公演《悲慘世界》前端工程與排版設計 SOP (Standard Operating Procedure)

本文件制定本專案在排版佈局、圖層堆疊（Z-Index）、無障礙（WCAG 2.1 AA）、響應式斷點與行動載具設計上的核心準則與標準作業流程。

---

## 一、 圖層堆疊與懸浮元件規範 (Z-Index Hierarchy Standard)

為杜絕懸浮按鈕相互重疊遮蔽（Collision）與觸控失效問題，全站定義嚴格的 Z-Index 梯次分工：

| 層級區間 | 代表元件 | 定位座標 (Positioning) | 職責與互斥原則 |
| :--- | :--- | :--- | :--- |
| **z-50** | `AccessibleAudioTour` | `bottom-6 right-4 sm:right-6` | 全站最高優先級導覽控制台，右下角專屬區域，任何其他浮動按鈕嚴禁置於右下角。 |
| **z-40** | `DataManagerBar` | `bottom-6 left-5 sm:left-6` | 後台與演職人員管理工具條，專屬於左下角，與右下角保持完整安全間距。 |
| **z-40** | `ScrollToTopButton` | `bottom-20 left-5 sm:left-6` | 置頂按鈕，與 `DataManagerBar` 縱向對齊排列，間距維持 16px 以上，絕不水平交疊。 |
| **z-40** | `Navbar` | `fixed top-0 inset-x-0` | 頂部全寬度固定導航條，背景採半透明毛玻璃 (`backdrop-blur-xl`)。 |
| **z-30** | `TheatricalQuickDock` | `left-0 top-1/2 -translate-y-1/2` | 劇院搖桿調光板，預設採極簡收合模式，點擊時滑出。 |
| **z-30** | `StoryChronicleTrigger` | `right-0 top-1/3` | 故事編年史書籤標籤，小螢幕自適應收縮為微型圖示。 |
| **z-20** | Modal / Lightbox 彈窗 | 全螢幕覆蓋居中 | 背景鎖定 `overflow: hidden`，防止底層滾動穿透。 |
| **z-10** | 各 Section 內容主體 | 相對定位 (`relative z-10`) | 頁面主要內容與文字資訊。 |
| **z-0** | 氛圍光錐 / 幾何光束 | 絕對定位 (`absolute inset-0 pointer-events-none`) | 劇院氛圍燈效，必須設定 `pointer-events-none` 避免攔截訪客點擊。 |

---

## 二、 行動載具（Mobile & Tablet）目錄抽屜標準流程

### 1. 滾動防卡死與視窗高度規範
- **容器高度限制**：行動抽屜必須設定動態視窗高度 `max-h-[calc(100dvh-4rem)]`。
- **捲動策略**：嚴禁於長清單容器套用 `overflow-hidden`，必須宣告 `overflow-y-auto overscroll-contain`。
- **手勢防穿透（Body Scroll Lock）**：
  - 目錄開啟時：`document.body.style.overflow = 'hidden'`
  - 目錄關閉時：`document.body.style.overflow = ''`

### 2. 目錄資訊架構階梯 (Information Hierarchy)
1. **頂部第一區**：**劇目導覽章節（01 ~ 07 Program Sections）**，章節字級明確、帶有經典序號與當前選中標記。
2. **中段第二區**：**核心觀演行動（Key Actions）**，實體門票免費索取按鈕 + 劇院/手冊視角切換。
3. **底端第三區**：**偏好與無障礙微膠囊（Preferences Capsule）**，採用 2 欄微型按鈕收納長輩大字、語音導覽、光學校準，絕不喧賓奪主擠壓章節目錄。

---

## 三、 無障礙設計與老者友善標準 (Senior & WCAG Compliance)

1. **觸控熱區（Touch Targets）**：
   - 所有點擊目標在手機上必須達到 **44px × 44px** 以上最小有效面積。
2. **長輩尊榮大字模式（Senior Mode）**：
   - 全域內文字級自動放大至 `18px ~ 20px`。
   - 啟用抗眩光低頻率對比度，降低眼睛負擔。
   - 移除晃動、縮放等干擾性動畫。
3. **螢幕閱讀器與語音導覽（Screen Readers）**：
   - 所有 Icon-only 按鈕必須具備 `aria-label` 與 `title`。
   - 狀態切換按鈕必須提供 `aria-pressed` 或 `aria-expanded`。
4. **鍵盤跳轉無障礙**：
   - 保留全站首行 Skip Link (`#main-content`)，讓視障與鍵盤使用者免於重複跳過頂部選單。

---

## 四、 前端修改標準上線流程 (Frontend Engineering Workflow)

```
[需求釐清 / 問題回報]
         │
         ▼
[1. 影響面盤點 (Impact Analysis)]
   - 檢視全域定位 (fixed/absolute) 是否引發重疊
   - 檢視小螢幕寬度 (<375px) 是否發生破版或折行
         │
         ▼
[2. 依循 SOP 標準代碼修改]
   - Z-Index 是否在規定梯次內
   - 觸控熱區是否 ≥ 44px
   - 是否具備 ARIA 標籤與鍵盤聚焦態
         │
         ▼
[3. 本地雙重自動化驗證]
   - compile_applet: 確認 Vite/Webpack 建置無任何型別錯誤
   - lint_applet: 確認 ESLint/TypeScript 檢查 0 Error 0 Warning
         │
         ▼
[4. 多設備視角確認與驗收]
   - iPhone / Android 直式行動螢幕
   - iPad / 平板橫直螢幕
   - 筆記型電腦 (1366px) 與寬螢幕桌面
```
