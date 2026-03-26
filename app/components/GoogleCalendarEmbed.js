"use client";

import { useMemo, useState } from 'react';

export default function GoogleCalendarEmbed({ selectedDate, visibleCalendars }) {
  const [mode, setMode] = useState("WEEK"); // WEEK, MONTH, AGENDA

  // 選択されたカレンダーのIDをエンコードしてクエリパラメータを生成
  const embedUrl = useMemo(() => {
    const baseUrl = "https://calendar.google.com/calendar/embed";
    const params = new URLSearchParams();
    
    // タイムゾーン設定
    params.append("ctz", "Asia/Tokyo");
    // 週の始まりを月曜に (1: 月曜, 0: 日曜)
    params.append("wkst", "1");
    // 背景色
    params.append("bgcolor", "#ffffff");
    // 表示モード (WEEK, MONTH, AGENDA)
    params.append("mode", mode);
    // UIオプション
    params.append("showTitle", "0");
    params.append("showNav", "1");
    params.append("showDate", "1");
    params.append("showTabs", "1"); // タブを表示しておけばユーザーが自分でも切り替えられる
    params.append("showPrint", "0");
    params.append("showCalendars", "0");
    params.append("showTz", "0");
    
    // 表示するカレンダーを追加
    let url = `${baseUrl}?${params.toString()}`;
    
    visibleCalendars.forEach(id => {
      if (id.includes('@')) {
        url += `&src=${encodeURIComponent(id)}`;
      }
    });

    // 選択された日付にジャンプするためのパラメータ (dates=YYYYMMDD/YYYYMMDD)
    // iframeの初期表示を合わせようとする試み
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      url += `&dates=${dateStr}%2F${dateStr}`;
    }
    
    return url;
  }, [visibleCalendars, mode, selectedDate]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[800px] relative z-0">
      {/* 簡易的なモード切り替えボタンをポータル側でも提供 */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        <ModeButton active={mode === 'WEEK'} onClick={() => setMode('WEEK')} label="週" />
        <ModeButton active={mode === 'MONTH'} onClick={() => setMode('MONTH')} label="月" />
        <ModeButton active={mode === 'AGENDA'} onClick={() => setMode('AGENDA')} label="予定リスト (日表示として)" />
      </div>

      <div className="flex-1 w-full bg-slate-100">
        <iframe 
          key={embedUrl} // URLが変わるたびに再読み込みさせて確実に反映させる
          src={embedUrl}
          style={{ border: 0 }} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no"
          title="Google Calendar"
        ></iframe>
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Google Standard Embed Mode
        </p>
        <div className="flex gap-4">
          <p className="text-[10px] font-black text-slate-400 italic">
            ※ 予定の追加などは「ブラウザで開く」からがお勧めだお
          </p>
          <a 
            href="https://calendar.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black text-[#d71d1d] hover:underline flex items-center gap-1"
          >
            ブラウザで開く ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, label }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border ${
        active 
        ? "bg-[#d71d1d] text-white border-transparent shadow-sm" 
        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
