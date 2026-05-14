"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoModal from "@/components/dashboard/VideoModal";

type Lang = "en" | "ar" | "ur" | "tl";

interface Guide {
  id: string | number;
  title: Record<Lang, string>;
  level: string;
  duration: string;
  icon: string;
  tags: string[];
  youtube_id?: string | null;
}

const LANGUAGES: { id: Lang; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ar", label: "العربية", flag: "🇦🇪" },
  { id: "ur", label: "اردو", flag: "🇵🇰" },
  { id: "tl", label: "Filipino", flag: "🇵🇭" },
];

const STATIC_GUIDES: Guide[] = [
  {
    id: 1,
    title: { en: "Oil Change Complete Guide", ar: "دليل تغيير الزيت الكامل", ur: "آئل چینج مکمل گائیڈ", tl: "Kumpletong Gabay sa Pagpapalit ng Langis" },
    level: "Beginner", duration: "45 min", icon: "🛢️", tags: ["engine", "maintenance"],
  },
  {
    id: 2,
    title: { en: "Brake Pad Replacement", ar: "تبديل أكواب الفرامل", ur: "بریک پیڈ تبدیلی", tl: "Pagpapalit ng Brake Pad" },
    level: "Beginner", duration: "90 min", icon: "🛞", tags: ["brakes", "safety"],
  },
  {
    id: 3,
    title: { en: "OBD Diagnostics 101", ar: "تشخيص OBD للمبتدئين", ur: "OBD تشخیص بنیادی باتیں", tl: "OBD Diagnostics Para sa Mga Baguhan" },
    level: "Beginner", duration: "30 min", icon: "📱", tags: ["diagnostic", "electronics"],
  },
  {
    id: 4,
    title: { en: "Suspension Basics", ar: "أساسيات نظام التعليق", ur: "سسپنشن کی بنیادی باتیں", tl: "Mga Pangunahing Kaalaman sa Suspension" },
    level: "Intermediate", duration: "2 hr", icon: "🔩", tags: ["suspension", "handling"],
  },
  {
    id: 5,
    title: { en: "Turbo Install Guide", ar: "دليل تركيب التوربو", ur: "ٹربو انسٹال گائیڈ", tl: "Gabay sa Pag-install ng Turbo" },
    level: "Advanced", duration: "4 hr", icon: "💨", tags: ["performance", "engine"],
  },
  {
    id: 6,
    title: { en: "Wheel Alignment Check", ar: "فحص ميزان العجلات", ur: "وھیل الائنمنٹ چیک", tl: "Pagsusuri ng Wheel Alignment" },
    level: "Beginner", duration: "20 min", icon: "⚖️", tags: ["wheels", "handling"],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "text-emerald-400",
  Intermediate: "text-amber-400",
  Advanced: "text-race-red",
};

export default function AcademyScreen() {
  const [lang, setLang] = useState<Lang>("en");
  const [filter, setFilter] = useState("all");
  const [guides, setGuides] = useState<Guide[]>(STATIC_GUIDES);
  const [activeGuide, setActiveGuide] = useState<{ youtubeId: string | null; title: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("guides")
      .select("*")
      .eq("is_published", true)
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setGuides(
          data.map((row) => ({
            id: row.id,
            title: {
              en: row.title_en ?? "",
              ar: row.title_ar ?? row.title_en ?? "",
              ur: row.title_ur ?? row.title_en ?? "",
              tl: row.title_tl ?? row.title_en ?? "",
            },
            level: row.level,
            duration: row.duration_text,
            icon: row.icon ?? "🔧",
            tags: row.tags ?? [],
            youtube_id: row.youtube_id ?? null,
          }))
        );
      });
  }, []);

  const filtered =
    filter === "all" ? guides : guides.filter((g) => g.level.toLowerCase() === filter);

  return (
    <div className="p-5">
      <h2 className="font-display text-3xl text-chrome mb-4">DIY ACADEMY</h2>

      {/* Language selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
              lang === l.id ? "bg-ember text-white" : "bg-steel text-chrome/60"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Level filter */}
      <div className="flex gap-2 mb-5">
        {["all", "beginner", "intermediate", "advanced"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg font-label text-xs uppercase tracking-wider transition-colors ${
              filter === f ? "bg-steel text-chrome" : "text-chrome/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Guide cards */}
      <div className="space-y-3">
        {filtered.map((guide) => (
          <button
            key={guide.id}
            onClick={() =>
              setActiveGuide({
                youtubeId: guide.youtube_id ?? null,
                title: guide.title[lang],
              })
            }
            className="w-full bg-midnight border border-steel rounded-2xl p-4 flex items-start gap-4 text-left hover:border-ember/30 transition-colors"
          >
            <div className="text-3xl">{guide.icon}</div>
            <div className="flex-1">
              <p className="font-body text-sm text-chrome font-medium mb-1">
                {guide.title[lang]}
              </p>
              <div className="flex items-center gap-3">
                <span className={`font-label text-xs ${LEVEL_COLORS[guide.level]}`}>
                  {guide.level}
                </span>
                <span className="font-label text-xs text-chrome/30">·</span>
                <span className="font-label text-xs text-chrome/40">{guide.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {guide.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-label text-[10px] text-chrome/30 bg-steel px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="font-label text-[10px] text-ember/70 uppercase tracking-wider mt-1 flex-shrink-0">
              ▶ Watch
            </span>
          </button>
        ))}
      </div>

      <VideoModal
        isOpen={!!activeGuide}
        onClose={() => setActiveGuide(null)}
        youtubeId={activeGuide?.youtubeId ?? null}
        title={activeGuide?.title ?? ""}
      />
    </div>
  );
}
