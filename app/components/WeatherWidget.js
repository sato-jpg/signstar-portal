"use client";

import { useState, useEffect } from 'react';
import { getAichiWeather } from '@/lib/weather';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets } from 'lucide-react';

const WeatherIcon = ({ code }) => {
  if (code <= 1) return <Sun className="w-5 h-5 text-orange-400" fill="currentColor" />;
  if (code <= 3) return <Cloud className="w-5 h-5 text-slate-400" />;
  if (code <= 65) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code <= 77) return <CloudSnow className="w-5 h-5 text-slate-200" />;
  return <CloudLightning className="w-5 h-5 text-yellow-400" />;
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      const data = await getAichiWeather();
      if (data) {
        setWeather(data);
      }
    }
    fetchWeather();
  }, []);

  if (!weather) return null;

  return (
    <a 
      href="https://www.google.com/search?q=%E5%90%8D%E5%8F%A4%E5%B1%8B+%E5%A4%A9%E6%B0%97" 
      target="_blank" 
      rel="noopener noreferrer"
      className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[13px] animate-fade-in shadow-sm hover:bg-slate-100/80 hover:border-slate-200 transition-all cursor-pointer group"
      title="名古屋市の週間予報を見る"
    >
      <div className="flex items-center gap-2 text-slate-600">
        <WeatherIcon code={weather.current.code} />
        <span className="font-bold group-hover:text-[#D13818] transition-colors">{weather.current.condition}</span>
      </div>
      <div className="h-3 w-[1px] bg-slate-200"></div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-800">{weather.current.temp}<span className="text-[10px] ml-0.5 font-normal">°C</span></span>
        <div className="flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/50">
          <Droplets className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-blue-600 text-[11px]">{weather.today.rainProb}<span className="text-[9px] ml-0.5 font-normal">%</span></span>
        </div>
      </div>
    </a>
  );
}
