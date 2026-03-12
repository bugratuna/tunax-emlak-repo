import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vizyon & Misyon — Realty Tunax Gayrimenkul",
  description:
    "Realty Tunax'ın Antalya gayrimenkul sektöründeki vizyonu ve misyonu.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <p className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Ana Sayfa
        </Link>
        {" / "}
        <span>Vizyon &amp; Misyon</span>
      </p>

      <h1 className="text-3xl font-bold text-zinc-900">Vizyon &amp; Misyon</h1>
      <p className="mt-2 text-zinc-500">
        Realty Tunax olarak Antalya gayrimenkul ekosistemini dönüştürme
        yolculuğumuz
      </p>

      {/* Vision */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-900 p-8 text-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Vizyonumuz
        </span>
        <h2 className="mt-3 text-2xl font-bold">
          Antalya&apos;nın En Güvenilir
          <br />
          Gayrimenkul Ekosistemi
        </h2>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          2030 yılına kadar Antalya ve Ege kıyı şeridinde teknoloji destekli,
          şeffaf ve erişilebilir bir gayrimenkul platformu oluşturmak; yerli ve
          yabancı yatırımcılar için Türkiye&apos;nin referans gayrimenkul
          markası olmak.
        </p>
      </div>

      {/* Mission */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          Misyonumuz
        </span>
        <h2 className="mt-3 text-2xl font-bold text-zinc-900">
          Her Müşteriye Doğru Çözüm
        </h2>
        <p className="mt-4 text-zinc-700 leading-relaxed">
          Müşterilerimizin yaşam kalitesini artıracak gayrimenkul kararlarını,
          veri odaklı analiz ve kişiselleştirilmiş danışmanlık hizmetiyle
          desteklemek; satın alma, kiralama veya yatırım süreçlerinde güvenilir
          bir rehber olmak.
        </p>
      </div>

      {/* Strategic goals */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900">
          Stratejik Hedeflerimiz
        </h2>
        <div className="mt-5 space-y-4">
          {[
            {
              year: "2025",
              goal: "Antalya genelinde 1.000+ aktif ilan portföyüne ulaşmak",
            },
            {
              year: "2026",
              goal: "Yabancı yatırımcılara özel rehberlik programını başlatmak",
            },
            {
              year: "2027",
              goal: "Ege ve Akdeniz kıyı şeridinde 5 yeni ofis açmak",
            },
            {
              year: "2030",
              goal: "Bölgenin dijital gayrimenkul platformunda pazar lideri olmak",
            },
          ].map((item) => (
            <div
              key={item.year}
              className="flex items-start gap-4 rounded-xl border border-zinc-200 p-4"
            >
              <span className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white">
                {item.year}
              </span>
              <p className="text-sm text-zinc-700">{item.goal}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-8">
        <Link
          href="/services"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Hizmetlerimizi İncele →
        </Link>
      </div>
    </div>
  );
}
