"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { signIn, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Truck, Mail, ExternalLink, Bell, User, 
  ChevronRight, Car, Calendar, LogOut, LogIn, Clock, MapPin, 
  CheckCircle2, Info, ChevronDown, Filter, Settings
} from "lucide-react";
import WeatherWidget from "./WeatherWidget";
import CurrentDate from "./CurrentDate";
import { 
  completeConstructionAction, 
  updateNotionStatusAction,
  createGoogleEventAction,
  updateGoogleEventAction,
  createNotionProjectAction
} from "@/app/actions/cockpit-actions";

const USER_MAPPING = {
  "sato@signstar.network": "佐藤",
  "fujimoto@signstar.network": "藤本",
  "kato@signstar.network": "加藤",
  "yanohara@signstar.network": "社長",
  "hironao.yano@signstar.network": "お兄さん",
  "現場": "現場"
};

export default function SignStarCockpit({ initialData, session }) {
  const dynamicUserMapping = useMemo(() => {
    const mapping = { ...USER_MAPPING };
    if (session?.user?.email && !mapping[session.user.email]) {
      mapping[session.user.email] = session.user.name || "自分";
    }
    return mapping;
  }, [session]);

  const [viewMode, setViewMode] = useState("director"); // director or production
  const [activeCategory, setActiveCategory] = useState("all"); // all, general, parking
  const [visibleCalendars, setVisibleCalendars] = useState(() => {
    const keys = new Set(Object.keys(USER_MAPPING));
    if (session?.user?.email) keys.add(session.user.email);
    return keys;
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({
    type: 'calendar',
    title: '',
    date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date()),
    startTime: '10:00',
    endTime: '11:00',
    calendarId: 'primary'
  });

  const handleStatusUpdate = async (status) => {
    if (!selectedEvent) return;
    setIsProcessing(true);
    try {
      const res = await updateNotionStatusAction(selectedEvent.id, status);
      if (res.success) {
        alert(`${status} に更新しましたお！`);
        window.location.reload();
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      alert("エラーが発生しましたお: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(selectedDate);
  }, [selectedDate]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      if (selectedEvent.type === 'calendar' || (selectedEvent.type === 'field' && selectedEvent.raw?.kind === 'calendar#event')) {
        const startDateTime = `${formattedSelectedDate}T${editForm.startTime}:00+09:00`;
        const endDateTime = `${formattedSelectedDate}T${editForm.endTime}:00+09:00`;
        const res = await updateGoogleEventAction(selectedEvent.raw.calendarId || 'primary', selectedEvent.id, {
          title: editForm.title,
          start: startDateTime,
          end: endDateTime
        });
        if (res.success) {
          alert("変更を保存したお！");
          window.location.reload();
        } else {
          alert("保存失敗だお: " + res.error);
        }
      }
      // TODO: Notion Edit logic if needed
    } catch (e) {
      alert("エラーだお: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSchedule = async () => {
    setIsProcessing(true);
    try {
      if (addForm.type === 'calendar') {
        const startDateTime = `${addForm.date}T${addForm.startTime}:00+09:00`;
        const endDateTime = `${addForm.date}T${addForm.endTime}:00+09:00`;
        const res = await createGoogleEventAction(addForm.calendarId, {
          title: addForm.title,
          start: startDateTime,
          end: endDateTime
        });
        if (res.success) {
          alert("新しい予定を追加したお！");
          window.location.reload();
        } else {
          alert("追加失敗だお: " + res.error);
        }
      } else {
        const res = await createNotionProjectAction(addForm.type === 'parking' ? 'parking' : 'general', {
          title: addForm.title,
          date: addForm.date,
          status: '未着手'
        });
        if (res.success) {
          alert("Notionに新しい案件を追加したお！");
          window.location.reload();
        } else {
          alert("追加失敗だお: " + res.error);
        }
      }
    } catch (e) {
      alert("失敗したお: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const { emails, projects, vehicles, calendarEvents, generalProjects } = initialData;

  // 1. 全ソースのデータを一つのタイムラインに統合・ソート・優先順位付け
  const timeline = useMemo(() => {
    let items = [];
    const targetDateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(selectedDate);

    // 一般案件 (最優先: トップ & 太字)
    // 一般案件は「今日」に限らず進行中のものを常に出す方針（監督の要望）
    if (activeCategory === "all" || activeCategory === "general") {
      generalProjects.forEach(p => {
        items.push({
          id: `general-${p.id}`,
          type: "general",
          time: new Date(0), // 最優先のため時間を0にしてソートで前に持ってくる
          title: p.name,
          subtitle: p.client,
          status: p.progress,
          action: p.action || "施工",
          isPriority: true,
          raw: p
        });
      });
    }

    // 1. カレンダー (選択された日付のみ)
    if (activeCategory === "all" || activeCategory === "general") {
      const groupedEvents = {}; // key: time-title, value: item

      calendarEvents.forEach(e => {
        const eventDate = e.start.split('T')[0];
        if (eventDate === targetDateStr) {
          // カレンダー名や説明からユーザーを特定（簡易的）
          let userLabel = dynamicUserMapping[e.calendarId] || dynamicUserMapping[e.calendarSummary] || e.calendarSummary;
          
          // 表示非表示フィルタ
          if (!visibleCalendars.has(e.calendarId) && !visibleCalendars.has(e.calendarSummary)) return;

          const timeKey = new Date(e.start).getTime();
          const titleKey = e.summary.replace(/[ \u3000]/g, ""); // スペースを消して比較
          const key = `${timeKey}-${titleKey}`;

          if (groupedEvents[key]) {
            // 重複（同じ時間の同じタイトル）
            if (!groupedEvents[key].users.includes(userLabel)) {
              groupedEvents[key].users.push(userLabel);
            }
          } else {
            groupedEvents[key] = {
              id: `cal-${e.id}`,
              type: "calendar",
              time: new Date(e.start),
              title: e.summary,
              description: e.description || "",
              status: "予定",
              users: [userLabel],
              calendarColor: e.calendarColor,
              raw: e
            };
          }
        }
      });

      Object.values(groupedEvents).forEach(item => {
        if (item.users.length > 1) {
          item.subtitle = item.users.join(", ");
        } else {
          item.subtitle = item.users[0];
        }
        items.push(item);
      });
    }

    // ... (projects and vehicles remain similar but check visibility if user-associated)
    // 既存の projects, vehicles も必要に応じて USER_MAPPING を見るように調整可能だが一旦そのままでも可
    
    // パーキング案件
    if (activeCategory === "all" || activeCategory === "parking") {
      projects.forEach(p => {
        if (activeCategory === "parking" || p.fullDate === targetDateStr) {
          items.push({
            id: `park-${p.id}`,
            type: "project",
            time: new Date(),
            title: `[パーキング] ${p.name}`,
            subtitle: p.client,
            status: p.progress,
            action: p.action || "-",
            isLowPriority: activeCategory === "all",
            raw: p
          });
        }
      });
    }

    // 車両
    if (activeCategory === "all") {
      vehicles.forEach(v => {
        if (v.fullDate === targetDateStr) {
          const [h, m] = (v.time || "00:00").split(":");
          const date = new Date(selectedDate);
          date.setHours(parseInt(h), parseInt(m), 0);
          items.push({
            id: `vehicle-${v.id}`,
            type: "vehicle",
            time: date,
            title: `${v.vehicle} (${v.user})`,
            subtitle: v.project,
            status: v.purpose,
            raw: v
          });
        }
      });
    }

    // 優先順位: 1. 一般案件(isPriority) 2. その他(時間順) 3. パーキング(isLowPriority)
    return items.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      if (a.isLowPriority && !b.isLowPriority) return 1;
      if (!a.isLowPriority && b.isLowPriority) return -1;
      return a.time - b.time;
    });
  }, [calendarEvents, projects, vehicles, generalProjects, selectedDate, activeCategory, visibleCalendars, dynamicUserMapping]);

  const toggleCalendarVisibility = (id) => {
    setVisibleCalendars(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 関連メールのフィルタリング (選択された一般案件の顧客名を優先)
  const filteredEmails = useMemo(() => {
    if (!selectedEvent || selectedEvent.type !== 'general' || !selectedEvent.subtitle) {
      return emails;
    }
    const clientName = selectedEvent.subtitle;
    return [...emails].sort((a, b) => {
      const aMatches = a.subject.includes(clientName) || a.from.emailAddress.name.includes(clientName);
      const bMatches = b.subject.includes(clientName) || b.from.emailAddress.name.includes(clientName);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [emails, selectedEvent]);

  const toggleMode = () => {
    setViewMode(prev => prev === "director" ? "production" : "director");
  };

  return (
    <div className={`flex h-screen bg-[#F4F7F9] text-slate-700 font-sans transition-all duration-500 ${viewMode === 'director' ? 'director-theme' : 'production-theme'}`}>
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex justify-center lg:justify-start">
          <Image src="/logo.png" alt="Logo" width={160} height={40} className="object-contain" />
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="スケジュール" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          <NavItem icon={<Truck size={20} />} label="現場" active={activeCategory === 'general'} onClick={() => setActiveCategory('general')} />
          <NavItem icon={<MapPin size={20} />} label="パーキング" active={activeCategory === 'parking'} onClick={() => setActiveCategory('parking')} />
          <NavItem icon={<Car size={20} />} label="車両状況" active={activeCategory === 'vehicles'} onClick={() => setActiveCategory('vehicles')} />
          <NavItem icon={<Mail size={20} />} label="メッセージ" badge={emails.length} active={activeCategory === 'messages'} onClick={() => setActiveCategory('messages')} />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hidden lg:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operation Mode</p>
            <button 
              onClick={toggleMode}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewMode === "director" 
                ? "bg-[#d71d1d] text-white shadow-lg shadow-[#d71d1d]/20" 
                : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              }`}
            >
              <Settings size={14} className={viewMode === "director" ? "animate-spin-slow" : "animate-pulse"} />
              {viewMode === "director" ? "監督・デザイン" : "現場・制作"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              SignStar <span className="text-[#d71d1d]">Cockpit</span>
            </h1>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <CurrentDate />
          </div>

          <div className="flex items-center gap-8">
            {session && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#d71d1d] text-white rounded-full text-xs font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Calendar size={16} /> 予定を追加
              </button>
            )}
            <WeatherWidget />
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell size={20} className="text-slate-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </div>

              {session ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 relative">
                    {session?.user?.image ? (
                      <Image src={session.user.image} alt="User" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                        {session?.user?.name?.charAt(0) || "S"}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-[#d71d1d] transition-all group"
                    title="ログアウト"
                  >
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Logout</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => signIn()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d71d1d] text-[#d71d1d] rounded-full text-xs font-black shadow-lg hover:bg-[#d71d1d] hover:text-white transition-all group"
                >
                  <LogIn size={16} />
                  <span>Login / ログイン</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Cockpit Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Timeline Center */}
          <section className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    タイムライン
                  </h2>
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition-colors">
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <div className="px-4 text-sm font-black text-slate-700 min-w-[140px] text-center">
                      {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </div>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-black text-[#d71d1d] uppercase tracking-widest hover:underline"
                  >
                    今日に戻る
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
                  >
                    <Clock size={12} className="text-[#d71d1d]" /> 更新
                  </button>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-2 text-slate-500">
                    <Filter size={14} /> フィルタ
                  </div>
                </div>
              </div>

              {/* Member Visibility Toggles */}
              {activeCategory === 'all' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(dynamicUserMapping).map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => toggleCalendarVisibility(id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black transition-all border ${
                        visibleCalendars.has(id)
                        ? "bg-[#d71d1d] text-white border-transparent shadow-sm"
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Enhanced Grid Timeline / Dedicated Views */}
              {activeCategory === 'parking' ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
                  {(() => {
                    const targetDateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(selectedDate);
                    const filteredParking = projects.filter(p => p.fullDate === targetDateStr);
                    return (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <MapPin className="text-[#d71d1d]" /> パーキング案件一覧
                          </h3>
                          <span className="text-xs font-bold text-slate-400">本日 {filteredParking.length} 件</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredParking.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => setSelectedEvent({
                                id: `park-${p.id}`,
                                type: "project",
                                title: p.name,
                                subtitle: p.client,
                                status: p.progress,
                                action: p.action || "-",
                                raw: p
                              })}
                              className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#d71d1d] hover:bg-white hover:shadow-lg transition-all cursor-pointer group flex justify-between items-center"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#d71d1d]"></div>
                                <p className="font-black text-slate-800 tracking-tight">
                                  {p.name} 
                                  <span className="ml-2 text-slate-400 font-bold">
                                    ({p.action || "未設定"}) ({p.progress || "未設定"})
                                  </span>
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-[#d71d1d] transition-colors" />
                            </div>
                          ))}
                          {filteredParking.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                              <MapPin size={48} className="mx-auto text-slate-200" />
                              <p className="font-bold text-slate-400">本日のパーキング予定はありません</p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : activeCategory === 'vehicles' ? (
                // ... (Existing vehicles view code)
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Car className="text-[#d71d1d]" /> 車両稼働リスト
                  </h3>
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">車両</th>
                          <th className="px-6 py-4">利用者</th>
                          <th className="px-6 py-4">案件 / 目的</th>
                          <th className="px-6 py-4">時間</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {vehicles.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4 font-black text-slate-800">{v.vehicle}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-600">{v.user}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{v.project}</p>
                              <p className="text-[10px] font-bold text-slate-400">{v.purpose}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black">{v.time}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeCategory === 'messages' ? (
                // ... (Existing messages view code)
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Mail className="text-[#d71d1d]" /> 全メッセージ一覧
                  </h3>
                  <div className="space-y-4">
                    {emails.map(mail => (
                      <div key={mail.id} className="p-6 border border-slate-100 rounded-2xl hover:border-[#d71d1d] hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-red-50 text-[#d71d1d] text-[10px] font-black rounded-lg uppercase tracking-widest">Incoming</span>
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{mail.from.emailAddress.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(mail.receivedDateTime).toLocaleString('ja-JP')}</span>
                        </div>
                        <h4 className="font-black text-slate-800 mb-1 group-hover:text-[#d71d1d] transition-colors">{mail.subject}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{mail.bodyPreview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[800px]">
                  {/* Grid Header */}
                  <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-30 shadow-sm">
                    <div className="w-16 border-r border-slate-200 shrink-0 flex items-center justify-center bg-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Day View</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto no-scrollbar scroll-smooth">
                      {Object.entries(dynamicUserMapping).filter(([id]) => {
                        if (activeCategory === 'general') {
                          return id === "hironao.yano@signstar.network" || id === "現場";
                        }
                        return visibleCalendars.has(id);
                      }).map(([id, name]) => (
                        <div key={id} className="min-w-[150px] flex-1 border-r border-slate-100 py-4 text-center">
                          <p className="text-sm font-black text-slate-800 tracking-tight">{name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase truncate px-2">{id.split('@')[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Row */}
                  <div className="flex border-b border-slate-200 bg-white min-h-[60px] shrink-0 overflow-hidden">
                    <div className="w-16 border-r border-slate-200 shrink-0 flex items-center justify-center bg-slate-50/30">
                      <span className="text-[10px] font-black text-[#d71d1d] uppercase tracking-tighter">優先</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto no-scrollbar">
                      {Object.entries(dynamicUserMapping).filter(([id]) => {
                        if (activeCategory === 'general') {
                          return id === "hironao.yano@signstar.network" || id === "現場";
                        }
                        return visibleCalendars.has(id);
                      }).map(([userId, userName]) => (
                        <div key={userId} className="min-w-[150px] flex-1 border-r border-slate-100 p-2 space-y-1">
                          {timeline.filter(item => 
                            Math.abs(item.time.getTime()) === 0 &&
                            (item.type === 'general' || item.users?.includes(userName))
                          ).map(item => (
                            <div 
                              key={item.id}
                              onClick={() => setSelectedEvent(item)}
                              className="px-2 py-1 bg-[#d71d1d] text-white rounded-lg text-[10px] font-black shadow-sm cursor-pointer hover:scale-[1.02] transition-transform truncate"
                            >
                              {item.title}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid Body */}
                  <div className="flex flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="border-b border-slate-100/50 w-full" style={{ height: '60px' }}></div>
                      ))}
                    </div>

                    <div className="w-16 border-r border-slate-100 shrink-0 bg-white/95 backdrop-blur-md sticky left-0 z-20">
                      {Array.from({ length: 18 }).map((_, i) => {
                        const hour = i + 5;
                        return (
                          <div key={i} className="h-[60px] flex items-start justify-center pt-1 pr-2">
                            <span className="text-[10px] font-black text-slate-300">{hour}:00</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Member Schedule Columns */}
                    <div className="flex-1 flex overflow-x-auto no-scrollbar relative min-h-[1080px]">
                      {Object.entries(dynamicUserMapping).filter(([id]) => {
                        if (activeCategory === 'general') {
                          return id === "hironao.yano@signstar.network" || id === "現場";
                        }
                        return visibleCalendars.has(id);
                      }).map(([userId, userName]) => (
                        <div key={userId} className="min-w-[150px] flex-1 border-r border-slate-100 relative" style={{ height: '1080px' }}>
                          {timeline.filter(item => 
                            Math.abs(item.time.getTime()) > 0 &&
                            (item.users?.includes(userName) || item.users?.includes(userId) || (item.type === 'calendar' && (item.raw.calendarId === userId || item.raw.calendarSummary === userId)))
                          ).map(item => {
                            const startHour = item.time.getHours();
                            const startMin = item.time.getMinutes();
                            const top = (startHour - 5) * 60 + startMin;
                            
                            let duration = 60;
                            if (item.type === 'calendar' && item.raw.end) {
                              const end = new Date(item.raw.end);
                              duration = (end.getTime() - item.time.getTime()) / (1000 * 60);
                              if (duration < 30) duration = 30;
                            }

                            const bgColor = item.isPriority ? 'bg-red-50' : 'bg-white';
                            const borderColor = item.isPriority ? 'border-[#d71d1d]' : (item.calendarColor || '#cbd5e1');

                            return (
                              <div
                                key={item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(item);
                                }}
                                className={`absolute left-1.5 right-1.5 p-2 rounded-xl border-l-[6px] shadow-sm transition-all cursor-pointer hover:shadow-xl hover:z-30 overflow-hidden group ${bgColor} ${selectedEvent?.id === item.id ? 'ring-2 ring-slate-800 z-40' : 'border-slate-100'}`}
                                style={{ top: `${top}px`, height: `${duration}px`, borderLeftColor: borderColor }}
                              >
                                <div className="flex flex-col h-full">
                                  <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 transition-colors">
                                    {item.time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <h4 className="text-[11px] font-black leading-tight text-slate-800 mt-0.5 line-clamp-3">
                                    {item.title}
                                  </h4>
                                  {duration > 40 && (
                                    <p className="mt-auto text-[9px] font-bold text-slate-400 truncate">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Contextual Sidebar (Right) */}
          <aside className={`w-96 bg-white border-l border-slate-200 overflow-y-auto p-8 transition-all duration-300 ${showSidebar ? '' : 'w-0 p-0 hidden'}`}>
            {selectedEvent ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">詳細インフォ</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Details & Context</p>
                  </div>
                  <div className="flex gap-2">
                    {session && (
                      <button 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveEdit();
                          } else {
                            setIsEditing(true);
                            const startStr = selectedEvent.time.getHours().toString().padStart(2, '0') + ':' + selectedEvent.time.getMinutes().toString().padStart(2, '0');
                            const endStr = new Date(selectedEvent.time.getTime() + 3600000).getHours().toString().padStart(2, '0') + ':' + new Date(selectedEvent.time.getTime() + 3600000).getMinutes().toString().padStart(2, '0');
                            setEditForm({ title: selectedEvent.title, startTime: startStr, endTime: endStr });
                          }
                        }}
                        className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                      >
                        {isEditing ? <CheckCircle2 size={18} /> : <Settings size={18} />}
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedEvent(null);
                        setIsEditing(false);
                      }} 
                      className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                    >
                      <LogOut size={18} className="rotate-180" />
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d71d1d] opacity-[0.03] rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                  
                  {isEditing ? (
                    <div className="space-y-4 relative z-10">
                      <div>
                        <label className="text-[10px] font-black text-[#d71d1d] uppercase mb-1 block">Title</label>
                        <input 
                          type="text" 
                          value={editForm.title} 
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start</label>
                          <input 
                            type="time" 
                            value={editForm.startTime} 
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setEditForm(prev => ({
                                ...prev, 
                                startTime: newStart,
                                endTime: prev.endTime < newStart ? newStart : prev.endTime
                              }));
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">End</label>
                          <input 
                            type="time" 
                            value={editForm.endTime} 
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              setEditForm(prev => ({
                                ...prev, 
                                endTime: newEnd,
                                startTime: prev.startTime > newEnd ? newEnd : prev.startTime
                              }));
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#d71d1d]">
                          {selectedEvent.type === 'general' ? <Truck size={20} /> : <Calendar size={20} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                          <p className="text-sm font-black text-slate-800">
                            {selectedEvent.status} 
                            {selectedEvent.calendarSummary && ` (${selectedEvent.calendarSummary})`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-[1px] bg-slate-200"></div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> Client / Project</p>
                        <p className="text-sm font-bold text-slate-800">{selectedEvent.title || "本社"}</p>
                        <p className="text-[10px] font-bold text-slate-400">{selectedEvent.subtitle}</p>
                        <button className="text-[10px] text-blue-500 font-bold hover:underline">Google Mapで開く ↗</button>
                      </div>
                    </div>
                  )}
                </div>

                {session ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" /> 次のアクション
                    </h4>
                    <div className="space-y-2">
                      <ActionButton icon={<Truck size={16} />} label={isProcessing ? "処理中..." : "施工完了 (Notion更新/HP投稿)"} primary onClick={handleCompleteConstruction} disabled={isProcessing} />
                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton icon={<Clock size={16} />} label="発送" onClick={() => handleStatusUpdate("発送")} disabled={isProcessing} />
                        <ActionButton icon={<Car size={16} />} label="配達" onClick={() => handleStatusUpdate("配達")} disabled={isProcessing} />
                      </div>
                      <ActionButton icon={<Mail size={16} />} label="関連メールを確認" />
                      <ActionButton icon={<Info size={16} />} label="現場写真をアップロード" />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-3xl text-center space-y-3">
                    <Info size={24} className="mx-auto text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      詳細操作・更新を行うには<br />ログインが必要です
                    </p>
                    <button 
                      onClick={() => signIn()}
                      className="px-4 py-2 bg-[#d71d1d] text-white rounded-full text-[10px] font-black shadow-lg hover:shadow-xl transition-all"
                    >
                      ログインするお！
                    </button>
                  </div>
                )}
                
                {/* Related Emails Context */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-[#d71d1d]" /> 関連メッセージ (優先表示)
                  </h4>
                  <div className="space-y-3">
                    {filteredEmails.slice(0, 5).map(mail => (
                      <div key={mail.id} className={`p-4 bg-white border rounded-2xl shadow-sm transition-colors cursor-pointer ${
                        selectedEvent.type === 'general' && selectedEvent.subtitle && (mail.subject.includes(selectedEvent.subtitle) || mail.from.emailAddress.name.includes(selectedEvent.subtitle))
                        ? 'border-[#d71d1d] ring-1 ring-[#d71d1d]/20 bg-red-50/10' 
                        : 'border-slate-100 hover:border-slate-300'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400">{mail.from.emailAddress.name}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{mail.subject}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
                <div className="mt-auto pt-8 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <LayoutDashboard size={40} strokeWidth={1} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    スケジュールを選択すると<br />詳細操作が表示されます
                  </p>
                </div>
            )}
          </aside>
        </div>
      </div>
      
      {/* Add Schedule Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">予定を新規追加</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">Google/Notionへの連携追加だお！</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setAddForm({...addForm, type: 'calendar'})}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all ${addForm.type === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                >
                  <Calendar size={14} className="inline mr-1" /> Googleカレンダー
                </button>
                <button 
                  onClick={() => setAddForm({...addForm, type: 'general'})}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all ${addForm.type === 'general' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                >
                  <Truck size={14} className="inline mr-1" /> 現場案件 (Notion)
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Title / 案件名</label>
                  <input 
                    type="text" 
                    value={addForm.title}
                    onChange={(e) => setAddForm({...addForm, title: e.target.value})}
                    placeholder="案件名を入力..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:border-[#d71d1d] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Date / 日付</label>
                    <input 
                      type="date" 
                      value={addForm.date}
                      onChange={(e) => setAddForm({...addForm, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                    />
                  </div>
                  {addForm.type === 'calendar' ? (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Calendar / 誰の予定？</label>
                      <select 
                        value={addForm.calendarId}
                        onChange={(e) => setAddForm({...addForm, calendarId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                      >
                        <option value="primary">自分のカレンダー (Primary)</option>
                        {Object.entries(dynamicUserMapping).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Category / 分類</label>
                      <select 
                        value={addForm.type}
                        onChange={(e) => setAddForm({...addForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                      >
                        <option value="general">現場案件 (一般)</option>
                        <option value="parking">パーキング案件</option>
                      </select>
                    </div>
                  )}
                </div>

                {addForm.type === 'calendar' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start / 開始</label>
                      <input 
                        type="time" 
                        value={addForm.startTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setAddForm(prev => ({
                            ...prev, 
                            startTime: newStart, 
                            endTime: prev.endTime < newStart ? newStart : prev.endTime 
                          }));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">End / 終了</label>
                      <input 
                        type="time" 
                        value={addForm.endTime}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          setAddForm(prev => ({
                            ...prev, 
                            endTime: newEnd, 
                            startTime: prev.startTime > newEnd ? newEnd : prev.startTime 
                          }));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-4 bg-slate-50 text-slate-400 rounded-3xl text-xs font-black hover:bg-slate-100 transition-all"
              >
                キャンセル
              </button>
              <button 
                onClick={handleAddSchedule}
                disabled={isProcessing || !addForm.title}
                className="flex-1 px-4 py-4 bg-[#d71d1d] text-white rounded-3xl text-xs font-black shadow-lg shadow-red-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isProcessing ? "追加中..." : "予定を追加するお！"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .director-theme {
          --accent: #d71d1d;
        }
        .production-theme {
          --accent: #059669;
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge = 0, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
      active 
      ? 'bg-slate-900 text-white shadow-lg' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      <div className="flex items-center gap-4">
        <span className={active ? "text-white" : "text-slate-400 transition-colors"}>{icon}</span>
        <span className="font-bold text-sm hidden lg:block">{label}</span>
      </div>
      {badge > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${active ? 'bg-[#d71d1d] text-white' : 'bg-slate-100 text-slate-500'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function ActionButton({ icon, label, primary = false, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all font-bold text-sm ${
        primary 
        ? "bg-[#d71d1d] text-white border-transparent hover:bg-[#b01717] shadow-lg shadow-[#d71d1d]/20" 
        : "bg-white border-slate-200 text-slate-700 hover:border-slate-800"
      }`}
    >
      <span className={primary ? "text-white/80" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}
