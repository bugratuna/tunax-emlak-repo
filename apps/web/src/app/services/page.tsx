import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hizmetler — AREP Gayrimenkul",
  description:
    "AREP'in satış, kiralama, yatırım danışmanlığı ve değerleme hizmetleri.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

const SERVICES = [
  {
    icon: "🏠",
    title: "Konut Satış & Kiralama",
    desc: "Daireden villaya, stüdyodan rezidansa — Antalya genelinde konut portföyümüzle doğru evi buluyoruz. Her bütçeye uygun seçenekler.",
    highlights: ["Satılık daire", "Kiralık konut", "Rezidans & Villa", "Müstakil ev"],
  },
  {
    icon: "🏢",
    title: "Ticari Gayrimenkul",
    desc: "Dükkan, ofis, işyeri ve ticari arsa konularında uzman danışmanlık. Yatırım analizleri ve kira getiri hesaplamaları.",
    highlights: ["Ofis & plaza", "Dükkan & mağaza", "Depo & fabrika", "Yatırım amaçlı"],
  },
  {
    icon: "🌿",
    title: "Arsa & Tarla",
    desc: "Antalya'nın değer kazanan bölgelerinde arsa, tarla ve turizm yatırım arazileri hakkında kapsamlı rehberlik.",
    highlights: ["İmarlı arsa", "Tarım arazisi", "Turizm arsası", "Deniz manzaralı arsa"],
  },
  {
    icon: "🌍",
    title: "Yabancıya Satış",
    desc: "Avrupa, Orta Doğu ve Orta Asya'dan yatırımcılara özel hizmet. Türkçe-İngilizce-Rusça danışmanlık desteği.",
    highlights: ["Çok dilli destek", "Tapu & hukuk desteği", "Uzaktan alım", "Oturma izni rehberliği"],
  },
  {
    icon: "📊",
    title: "Ekspertiz & Değerleme",
    desc: "Antalya piyasasına hakim uzman ekibimizle mülk değerleme raporları. Banka kredisi süreçlerinde destek.",
    highlights: ["Piyasa analizi", "Banka değerleme", "Kira değer raporu", "Yatırım simülasyonu"],
  },
  {
    icon: "🔑",
    title: "Kiracı Bulma & Yönetim",
    desc: "Mülkünüz için güvenilir kiracı bulma, sözleşme hazırlama ve dönemsel takip hizmetleri.",
    highlights: ["Kiracı temini", "Sözleşme hazırlama", "Tahsilat takibi", "Bakım koordinasyonu"],
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <p className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Ana Sayfa</Link>
        {" / "}
        <span>Hizmetler</span>
      </p>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Hizmetlerimiz</h1>
        <p className="mt-3 max-w-xl text-zinc-500">
          Antalya gayrimenkul pazarında her ihtiyaca yönelik kapsamlı çözümler
          sunuyoruz. Alım, satım ve kiralamadan yatırım danışmanlığına kadar
          yanınızdayız.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div
            key={s.title}
            className="group rounded-xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-sm transition-all"
          >
            <div className="text-3xl">{s.icon}</div>
            <h2 className="mt-3 text-base font-semibold text-zinc-900">
              {s.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
            <ul className="mt-4 space-y-1">
              {s.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="h-1 w-1 rounded-full bg-zinc-400" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-zinc-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">Hizmetlerimiz Hakkında Daha Fazla Bilgi Alın</h2>
        <p className="mt-3 text-zinc-300">
          Uzman danışmanlarımız size özel çözümler için hazır.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Ücretsiz Danışma
          </Link>
          <Link
            href="/listings"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            İlanları İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
