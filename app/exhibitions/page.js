import Link from "next/link";
import { LayoutDashboard, Calendar, MapPin, Download, Star, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "ターゲット展示会スケジュール | SignStar",
};

const exhibitions = [
  { name: "SPORTEC 2026", date: "2026年7月8日〜10日", location: "東京ビッグサイト", category: "スポーツ・フィットネス", point: "大型のフィットネスマシンや特設ステージが多く、堅牢なトラスと空間演出が求められます。", recommendation: "〇" },
  { name: "国際物流総合展 2026", date: "2026年9月8日〜11日", location: "東京ビッグサイト", category: "物流・マテハン", point: "巨大な物流システムやマテハン機器を展示するため、天井ギリギリまでの巨大ブースやトラスが乱立します。", recommendation: "〇" },
  { name: "東京ゲームショウ 2026 (TGS)", date: "2026年9月17日〜21日", location: "幕張メッセ", category: "ゲーム・エンタメ", point: "トラスとLEDビジョンの大本命！各社が巨大モニターや派手な照明を吊るすため、まさに御社の強みが活きる戦場です。", recommendation: "◎" },
  { name: "ツーリズムEXPOジャパン 2026", date: "2026年9月24日〜27日", location: "東京ビッグサイト", category: "観光・旅行", point: "各国・各地域の巨大パビリオンが建ち並び、大規模な空間装飾が行われます。", recommendation: "〇" },
  { name: "CEATEC 2026", date: "2026年10月13日〜16日", location: "幕張メッセ", category: "IT・エレクトロニクス", point: "B2Bの巨大ブース多数。最新技術をアピールするための超大型LEDビジョンや洗練されたトラス構造が必須です。", recommendation: "〇" },
  { name: "JIMTOF 2026", date: "2026年10月26日〜31日", location: "東京ビッグサイト", category: "工作機械", point: "超重量級の機械が並ぶため、それに負けない巨大なサインやトラスでの頭上装飾がメインになります。", recommendation: "〇" },
  { name: "Inter BEE 2026", date: "2026年11月18日〜20日", location: "幕張メッセ", category: "音響・映像・通信", point: "映像・照明のプロが集まる展示会。ここで使われるブース施工自体が「作品」として見られます。LEDビジョンのアピールには最高の舞台です。", recommendation: "◎" },
  { name: "JAPAN BUILD 東京 2026", date: "2026年12月2日〜4日", location: "東京ビッグサイト", category: "建築・建設", point: "建築の先端技術展。大型構造物の展示も多いです。", recommendation: "〇" },
  { name: "東京オートサロン 2027", date: "2027年1月15日〜17日", location: "幕張メッセ", category: "車・カスタムカー", point: "オートメッセと同様、カスタムカーと派手な演出の祭典。トラスと照明、LEDビジョンの需要は国内トップクラスです。", recommendation: "◎" },
  { name: "第14回 イベント総合EXPO 2027", date: "2027年1月27日〜29日", location: "幕張メッセ", category: "イベントインフラ", point: "展示会業界関係者が集まるイベント。ここでサインスターさん自身が出展し、圧倒的なトラス組やLEDビジョンを見せつけるのもアリかもしれません！", recommendation: "◎" },
  { name: "大阪オートメッセ 2027", date: "2027年2月上旬〜中旬", location: "インテックス大阪", category: "車・カスタムカー", point: "ホームグラウンドですね！", recommendation: "◎" },
  { name: "AnimeJapan 2027", date: "2027年3月27日〜28日", location: "インテックス大阪", category: "アニメ・エンタメ", point: "アニメの特設ステージで巨大トラスとLEDビジョンが必須です。今回は大阪開催なので、関西圏の施工業者には大チャンスです。", recommendation: "◎" }
];

export default function ExhibitionsPage() {
  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-700 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
                <ChevronLeft size={20} />
              </Link>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Calendar className="text-[#d71d1d]" size={28} />
                ターゲット展示会スケジュール
              </h1>
            </div>
            <p className="text-sm font-bold text-slate-500 ml-12">
              トラス施工・LEDビジョンレンタル向け 大型展示会リスト (2026年〜2027年)
            </p>
          </div>
          <a
            href="/exhibitions.csv"
            download
            className="flex items-center gap-2 bg-[#d71d1d] text-white px-5 py-2.5 rounded-full text-sm font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Download size={18} />
            Excel用CSVをダウンロード
          </a>
        </div>

        {/* Content */}
        <div className="grid gap-4">
          {exhibitions.map((ex, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-2xl p-6 border transition-all ${ex.recommendation === '◎' ? 'border-[#d71d1d]/30 shadow-md relative overflow-hidden' : 'border-slate-200 shadow-sm'}`}
            >
              {ex.recommendation === '◎' && (
                <div className="absolute top-0 right-0 bg-[#d71d1d] text-white text-[10px] font-black px-4 py-1 tracking-widest rounded-bl-xl">
                  超おすすめ
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black tracking-wider">
                      {ex.category}
                    </span>
                    <h2 className="text-xl font-black text-slate-800">{ex.name}</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm font-bold text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-slate-400" />
                      {ex.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {ex.location}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <strong className="text-[#d71d1d]">営業ポイント：</strong> {ex.point}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
