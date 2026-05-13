import {
  Rocket,
  MonitorPlay,
  Hammer,
  Target,
  ArrowRight,
  Package,
  Crown,
  Sparkles,
  Mail,
  Camera,
  Users,
  ChevronLeft,
  Swords,
  TrendingUp,
  CalendarClock,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "SignStar 営業戦略 2026-2027",
};

export default function StrategyInfographic() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Header / Hero */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Rocket size={400} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={20} /> ポータルに戻る
            </Link>
          </div>
          <span className="inline-block px-4 py-1.5 bg-[#d71d1d]/20 text-[#ff4d4d] font-black rounded-full text-sm uppercase tracking-widest mb-6 border border-[#d71d1d]/30">
            Internal Strategy
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            展示会ブース施工<br />
            <span className="text-[#d71d1d]">圧倒的シェア獲得</span> 大作戦
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-bold max-w-2xl leading-relaxed">
            「システムブースの予算感で、木工ブース以上のインパクトを。」<br/>
            オートサロン18小間の実績を武器に、2〜6小間の中規模出展者を根こそぎ獲得する戦略です。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20 space-y-24">
        
        {/* 1. The Dilemma & Our Solution (Positioning) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#d71d1d]">
              <Swords size={24} />
            </div>
            <h2 className="text-3xl font-black">なぜ今、ウチが勝てるのか？</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* System Panel */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm opacity-60">
              <div className="text-slate-400 font-black text-sm uppercase tracking-widest mb-2">競合 1</div>
              <h3 className="text-xl font-black mb-4">システムパネル</h3>
              <div className="text-3xl font-black mb-6">15<span className="text-base text-slate-400">万円〜/小間</span></div>
              <ul className="space-y-3 text-sm font-bold text-slate-500">
                <li className="flex items-center gap-2">👎 安いがダサい</li>
                <li className="flex items-center gap-2">👎 重いモノ(LED)は吊れない</li>
                <li className="flex items-center gap-2">👎 会場で埋もれる</li>
              </ul>
            </div>

            {/* Custom Wood */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm opacity-60">
              <div className="text-slate-400 font-black text-sm uppercase tracking-widest mb-2">競合 2</div>
              <h3 className="text-xl font-black mb-4">木工・造作ブース</h3>
              <div className="text-3xl font-black mb-6">100<span className="text-base text-slate-400">万円〜/小間</span></div>
              <ul className="space-y-3 text-sm font-bold text-slate-500">
                <li className="flex items-center gap-2">👎 カッコいいが、高すぎる</li>
                <li className="flex items-center gap-2">👎 施工・撤去に時間がかかる</li>
                <li className="flex items-center gap-2">👎 ゴミが大量に出る</li>
              </ul>
            </div>

            {/* SignStar */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#d71d1d] shadow-xl relative transform md:-translate-y-4">
              <div className="absolute -top-4 -right-4 bg-[#d71d1d] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles size={24} />
              </div>
              <div className="text-[#d71d1d] font-black text-sm uppercase tracking-widest mb-2">私たちの提案</div>
              <h3 className="text-2xl font-black mb-4">SignStar パッケージ</h3>
              <div className="text-3xl font-black mb-6 text-[#d71d1d]">圧倒的コスパ</div>
              <ul className="space-y-4 text-sm font-black text-slate-700">
                <li className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-lg text-[#d71d1d]"><MonitorPlay size={18} /></div>
                  自社直輸入LEDでインパクト大
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-lg text-[#d71d1d]"><Hammer size={18} /></div>
                  トラス活用で爆速・堅牢施工
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-lg text-[#d71d1d]"><Sparkles size={18} /></div>
                  看板屋の技術で全面美麗グラフィック
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Packages */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#d71d1d]">
              <Package size={24} />
            </div>
            <h2 className="text-3xl font-black">売るもの（ラインナップ）</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
                <Target size={200} />
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-black mb-4">2〜3小間向け</div>
                <h3 className="text-2xl font-black mb-2">Standard Vision</h3>
                <p className="text-slate-400 font-bold mb-6 text-sm">「展示会の『質』を変える予算最適化パッケージ」</p>
                <ul className="space-y-2 font-bold">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#d71d1d]" /> ブラックトラス骨組み</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#d71d1d]" /> 100インチ級LEDビジョン</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#d71d1d]" /> 壁面ファブリック全面装飾</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#d71d1d] to-[#990000] text-white rounded-3xl p-8 relative overflow-hidden group shadow-lg shadow-red-900/20">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
                <Crown size={200} />
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-black mb-4">4〜6小間向け</div>
                <h3 className="text-2xl font-black mb-2">Premium Island</h3>
                <p className="text-red-100 font-bold mb-6 text-sm">「オートサロン級のクオリティを木工の半額以下で」</p>
                <ul className="space-y-2 font-bold">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> 超大型トラスアーチ</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> 200インチ級 巨大LED</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> 吊り下げサイン（天井装飾）</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Timeline (Big & Readable) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#d71d1d]">
              <CalendarClock size={24} />
            </div>
            <h2 className="text-3xl font-black">いつ誰に送る？（DMスケジュール）</h2>
          </div>
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-bold mb-8">
              出展者の準備が本格化する<strong className="text-[#d71d1d]">「開催の3〜4ヶ月前」</strong>に、超目立つDMを狙い撃ちします。
            </p>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              
              {/* Timeline Items */}
              {[
                { targetMonth: "7月", event: "SPORTEC", dmMonth: "4月", desc: "夏・秋の大型イベントへの先手打ち！" },
                { targetMonth: "9月", event: "TGS / 物流展", dmMonth: "5月", desc: "決裁権限者への直接アプローチ" },
                { targetMonth: "10月", event: "CEATEC / JIMTOF", dmMonth: "6月", desc: "年末商戦前の駆け込み需要獲得" },
                { targetMonth: "11月", event: "InterBEE", dmMonth: "7月", desc: "来期予算に向けた種まき" },
                { targetMonth: "1月", event: "オートサロン 2027", dmMonth: "9月", desc: "前年実績（18小間）を武器にした確実な受注" },
              ].map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#d71d1d] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Mail size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#d71d1d] font-black text-lg">DM送付: {item.dmMonth}</span>
                      <span className="text-slate-400 font-black text-sm bg-white px-3 py-1 rounded-full border border-slate-200">開催: {item.targetMonth}</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 mb-2">{item.event}</h4>
                    <p className="text-slate-500 font-bold text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Action Plan */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#d71d1d] shadow-md shadow-red-900/20 flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-3xl font-black">直近のアクション</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm hover:border-[#d71d1d] transition-colors">
              <div className="bg-red-50 p-3 rounded-xl text-[#d71d1d] shrink-0">
                <Camera size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2">1. 「動く実績」の確保 (5/16-17)</h4>
                <p className="text-slate-500 font-bold text-sm">オートメッセの現場で、トラス・LED・看板の仕上がりをプロ品質で撮影する。</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm hover:border-[#d71d1d] transition-colors">
              <div className="bg-red-50 p-3 rounded-xl text-[#d71d1d] shrink-0">
                <MonitorPlay size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2">2. 特設LPの構築</h4>
                <p className="text-slate-500 font-bold text-sm">撮影した動画素材をメインビジュアルにした、スマホファーストな特設サイト作成。</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm hover:border-[#d71d1d] transition-colors">
              <div className="bg-red-50 p-3 rounded-xl text-[#d71d1d] shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2">3. ターゲット企業リストアップ</h4>
                <p className="text-slate-500 font-bold text-sm">過去の主要展示会出展企業（4小間以上）をリスト化し、DM送付先を確定。</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm hover:border-[#d71d1d] transition-colors">
              <div className="bg-red-50 p-3 rounded-xl text-[#d71d1d] shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2">4. 超・目立つDMの郵送</h4>
                <p className="text-slate-500 font-bold text-sm">「黒基調×高品質」のハガキを作成。決裁者のデスクに残り続けるデザインで訴求。</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
