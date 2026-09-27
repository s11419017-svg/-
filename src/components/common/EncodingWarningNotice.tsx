import React from 'react';
import { AlertTriangle, Sparkles, Info } from 'lucide-react';
import { EncodingCheckResult } from '../../utils/textEncoding';

interface EncodingWarningNoticeProps {
  result: EncodingCheckResult;
  onAutoFix: (fixedText: string) => void;
  fieldName?: string;
}

export const EncodingWarningNotice: React.FC<EncodingWarningNoticeProps> = ({
  result,
  onAutoFix,
  fieldName,
}) => {
  if (!result.hasIssue) return null;

  return (
    <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-sm text-xs font-sans space-y-2 animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{fieldName ? `「${fieldName}」` : ''}檢測到潛在字元編碼異常</span>
        </div>

        {result.suggestedFix !== undefined && (
          <button
            type="button"
            onClick={() => onAutoFix(result.suggestedFix || '')}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0"
            title="自動轉為標準 UTF-8 並去除亂碼/控制字元"
          >
            <Sparkles className="w-3 h-3 text-amber-100" />
            <span>一鍵標準 UTF-8 修正</span>
          </button>
        )}
      </div>

      <ul className="space-y-1 text-[11px] text-stone-300 pl-5 list-disc">
        {result.warnings.map((warn, idx) => (
          <li key={idx} className="leading-tight text-amber-200/90">
            {warn}
          </li>
        ))}
      </ul>

      <div className="text-[10px] text-stone-400 flex items-center gap-1">
        <Info className="w-3 h-3 text-stone-500" />
        <span>系統已啟用強制 UTF-8 NFC 格式化防護，送出儲存時將自動濾除惡意或異常編碼。</span>
      </div>
    </div>
  );
};
