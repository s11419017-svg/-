import React from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface FieldEditTipProps {
  label: string;
  sublabel?: string;
  tip: string;
  isCustomized?: boolean;
  isPlaceholder?: boolean;
  required?: boolean;
}

export const FieldEditTip: React.FC<FieldEditTipProps> = ({
  label,
  sublabel,
  tip,
  isCustomized,
  isPlaceholder,
  required,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-stone-200 font-bold text-xs">{label}</span>
        {required && <span className="text-[#8c2d2d] font-bold text-xs">*</span>}
        {sublabel && <span className="text-[11px] text-stone-500 font-mono">({sublabel})</span>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-stone-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-amber-400/80 shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-none">{tip}</span>
        </span>

        {isPlaceholder ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0">
            <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
            <span>範例佔位</span>
          </span>
        ) : isCustomized ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>已自訂</span>
          </span>
        ) : null}
      </div>
    </div>
  );
};

interface PlaceholderNoticeCardProps {
  unmodifiedCount: number;
  totalCheckable: number;
  fieldNames: string[];
}

export const PlaceholderNoticeCard: React.FC<PlaceholderNoticeCardProps> = ({
  unmodifiedCount,
  totalCheckable,
  fieldNames,
}) => {
  if (unmodifiedCount === 0) {
    return (
      <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded text-[11px] text-emerald-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>自定義完成度 100%</strong>：所有欄位皆已替換為專屬班級內容，資料準備妥當！
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded text-[11px] text-amber-200 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>💡 內容編輯溫馨提示（自訂進度 {totalCheckable - unmodifiedCount}/{totalCheckable}）</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono">
          尚有 {unmodifiedCount} 個範例預設項目
        </span>
      </div>
      <p className="text-stone-300 leading-relaxed text-[11px]">
        偵測到以下欄位目前仍為<strong>示範原型樣板文字或預設圖檔</strong>：
        <span className="text-amber-200 font-bold ml-1">{fieldNames.join('、')}</span>。
        建議替換為本班同學的真實資料；若預設內容符合需求亦可直接保存。
      </p>
    </div>
  );
};
