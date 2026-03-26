"use client";

import { useState, useEffect } from 'react';

export default function CurrentDate() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('ja-JP', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  if (!dateStr) return <div className="h-5"></div>;

  return (
    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
      {dateStr}
    </p>
  );
}
