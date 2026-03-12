import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  Sparkles,
  MapPin,
  ArrowRight,
  Phone,
  Building2,
  TrendingUp,
  Shield,
  Users,
  CheckCircle2,
  Search,
  FileText,
  Key,
} from "lucide-react";
import { HeroSearchInput } from "@/components/hero-search-input";
import { listListings } from "@/lib/api/listings";
import { getPublicStats } from "@/lib/api/public";
import type { Listing, PublicStats } from "@/lib/types";

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Antalya Satılık Daire & Gayrimenkul | Kepez Emlak | Realty Tunax",
  description:
    "Antalya'da satılık daire, kiralık daire ve ticari gayrimenkul. Kepez, Konyaaltı, Muratpaşa ve Alanya'da uzman gayrimenkul danışmanı desteğiyle güvenilir, şeffaf emlak hizmeti.",
  keywords: [
    "Antalya satılık daire",
    "Antalya kiralık daire",
    "Kepez satılık daire",
    "Kepez emlak",
    "Kepez kiralık daire",
    "Antalya gayrimenkul",
    "Antalya emlak",
    "Kepez gayrimenkul danışmanı",
    "Antalya yatırım fırsatları",
    "Antalya konut projeleri",
    "Konyaaltı satılık daire",
    "Muratpaşa emlak",
    "Antalya gayrimenkul danışmanı",
  ],
  icons: { icon: "/brand/logo-icon.svg" },
  openGraph: {
    title: "Antalya Satılık Daire & Gayrimenkul | Realty Tunax",
    description:
      "Kepez, Konyaaltı, Muratpaşa ve tüm Antalya ilçelerinde satılık ve kiralık gayrimenkul. Uzman danışman desteğiyle güvenilir emlak hizmeti.",
    type: "website",
    locale: "tr_TR",
    siteName: "Realty Tunax",
  },
  twitter: {
    card: "summary_large_image",
    title: "Antalya Satılık Daire & Gayrimenkul | Realty Tunax",
    description:
      "Kepez, Konyaaltı, Muratpaşa ve tüm Antalya ilçelerinde satılık ve kiralık gayrimenkul. Uzman danışman desteğiyle güvenilir emlak hizmeti.",
  },
};

export const revalidate = 60;

// ── Structured data ───────────────────────────────────────────────────────────

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Realty Tunax",
  description:
    "Antalya ve Kepez'de satılık ve kiralık gayrimenkul danışmanlığı. Konut, ticari, yatırım.",
  url: "https://realtytunax.com",
  telephone: "+905530842270",
  email: "ismail.tuna@realtytunax.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kütükçü, Şelale Cd. No:123 D:117",
    addressLocality: "Kepez",
    addressRegion: "Antalya",
    postalCode: "07080",
    addressCountry: "TR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "36.9081",
    longitude: "30.6956",
  },
  areaServed: [
    { "@type": "City", name: "Antalya" },
    { "@type": "AdministrativeArea", name: "Kepez" },
    { "@type": "AdministrativeArea", name: "Konyaaltı" },
    { "@type": "AdministrativeArea", name: "Muratpaşa" },
    { "@type": "AdministrativeArea", name: "Alanya" },
    { "@type": "AdministrativeArea", name: "Kemer" },
  ],
  knowsLanguage: ["tr", "en", "ru", "ar"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(listing: Listing) {
  if (!listing.price?.amount) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: listing.price.currency ?? "TRY",
    maximumFractionDigits: 0,
  }).format(listing.price.amount);
}

// ── Listing Card ──────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.media?.find((m) => m.isCover) ?? listing.media?.[0];
  const price = formatPrice(listing);
  const location = listing.location;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow rt-listing-card"
    >
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
        {cover ? (
          <Image
            src={cover.publicUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 size={40} className="text-zinc-300" />
          </div>
        )}
        {listing.isFeatured && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
            <Star size={10} fill="white" />
            Öne Çıkan
          </span>
        )}
        {listing.category && (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900/70 px-2 py-0.5 text-xs font-medium text-white">
            {listing.category === "SALE" ? "Satılık" : "Kiralık"}
          </span>
        )}
        {listing.listingNumber && (
          <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-white/90 backdrop-blur-sm">
            {listing.listingNumber}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 group-hover:text-amber-600 transition-colors">
          {listing.title}
        </h3>
        {listing.listingNumber && (
          <p className="mt-0.5 font-mono text-[10px] tracking-wider text-zinc-400">
            İlan No: {listing.listingNumber}
          </p>
        )}
        {location?.district && (
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin size={11} />
            {location.district}, Antalya
          </p>
        )}
        {price && (
          <p className="mt-2 text-base font-bold text-zinc-900">{price}</p>
        )}
        <div className="mt-2 flex gap-2 text-xs text-zinc-500">
          {listing.specifications?.roomCount !== undefined && (
            <span>{listing.specifications.roomCount} oda</span>
          )}
          {listing.specifications?.grossArea !== undefined && (
            <span>· {listing.specifications.grossArea} m²</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

const DISTRICTS = [
  {
    name: "Kepez",
    emoji: "🏘️",
    desc: "Yatırım Değeri Yüksek Konutlar",
    tag: "Satılık & Kiralık",
  },
  {
    name: "Konyaaltı",
    emoji: "🏖️",
    desc: "Sahil & Lüks Rezidanslar",
    tag: "Satılık",
  },
  {
    name: "Muratpaşa",
    emoji: "🏙️",
    desc: "Şehir Merkezi & Ticari",
    tag: "Satılık & Kiralık",
  },
  {
    name: "Lara",
    emoji: "🌊",
    desc: "Denize Yakın Siteler",
    tag: "Satılık",
  },
  {
    name: "Alanya",
    emoji: "🏰",
    desc: "Tatil & Yatırım Fırsatları",
    tag: "Yatırım",
  },
  {
    name: "Kemer",
    emoji: "⛵",
    desc: "Marina & Doğa İçinde Yaşam",
    tag: "Satılık",
  },
];

// STATS is now fetched from the backend (GET /api/public/stats).
// "Yıl Deneyim" remains static as it is not a DB-derived value.

const SERVICES = [
  {
    icon: Building2,
    title: "Konut Satış & Kiralama",
    desc: "Daire, villa, müstakil ev — her bütçeye uygun Antalya konut seçenekleri.",
  },
  {
    icon: TrendingUp,
    title: "Yatırım Danışmanlığı",
    desc: "Kepez ve Antalya genelinde en verimli yatırım bölgelerini birlikte keşfedelim.",
  },
  {
    icon: Shield,
    title: "Güvenli İşlem",
    desc: "Hukuki süreçler ve tapu işlemleri uzman kadromuzca eksiksiz yönetilir.",
  },
  {
    icon: Users,
    title: "Yabancıya Satış",
    desc: "İngilizce, Rusça ve Arapça desteğiyle uluslararası alıcılara tam hizmet.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Keşfedin",
    desc: "Bölge, fiyat ve özelliklerinize göre ilan arayın. Uzmanlarımız ihtiyacınıza özel seçenekler sunar.",
  },
  {
    step: "02",
    icon: FileText,
    title: "Görüşün",
    desc: "Danışmanınızla yerinde inceleme, fiyat değerlendirmesi ve hukuki süreç bilgilendirmesi yapın.",
  },
  {
    step: "03",
    icon: Key,
    title: "Tamamlayın",
    desc: "Tapu işlemlerinden anahtara kadar tüm süreç profesyonel olarak yönetilir.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  let showcaseListings: Listing[] = [];
  let featuredListings: Listing[] = [];
  let recentListings: Listing[] = [];
  let stats: PublicStats | null = null;

  try {
    const [showcaseRes, featuredRes, recentRes, statsRes] = await Promise.all([
      listListings({ status: "PUBLISHED", isShowcase: true, sortBy: "newest" }),
      listListings({ status: "PUBLISHED", isFeatured: true, sortBy: "newest" }),
      listListings({ status: "PUBLISHED", sortBy: "newest" }),
      getPublicStats(),
    ]);
    showcaseListings = showcaseRes.data.slice(0, 6);
    featuredListings = featuredRes.data.slice(0, 6);
    recentListings = recentRes.data.slice(0, 6);
    stats = statsRes;
  } catch {
    // Non-critical — page renders without listings or with fallback stats
  }

  return (
    <div className="-mx-4 -mt-8">
      {/* ── JSON-LD structured data ─────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Cinematic video hero ─────────────────────────────────────────────── */}
      <section
        aria-label="Antalya gayrimenkul — ana bölüm"
        className="relative overflow-hidden min-h-[92vh] flex items-center justify-center bg-linear-to-br from-slate-900 via-stone-900 to-zinc-900 text-white"
      >
        {/* Background video — hidden when prefers-reduced-motion */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-full object-cover z-0 rt-hero-video"
        >
          <source
            src="/Antalya_Cityscape_Video_Generation.mp4"
            type="video/mp4"
          />
        </video>

        {/* Cinematic overlay — ensures text legibility */}
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/60 via-black/40 to-black/72" />

        {/* Bottom fade — transitions into page background */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-28 z-10"
          style={{
            background: "linear-gradient(to top, #f9f8f6 0%, transparent 100%)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-20 mx-auto max-w-4xl px-4 py-32 text-center">
          {/* Brand logo */}
          <div className="mb-10 flex justify-center">
            <Image
              src="/brand/logo.png"
              alt="Realty Tunax — Antalya Gayrimenkul"
              width={0}
              height={0}
              sizes="100vw"
              priority
              style={{ height: "10rem", width: "auto", objectFit: "contain" }}
              className="drop-shadow-2xl"
            />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <MapPin size={12} className="text-amber-400" />
            Kepez, Antalya &bull; Güvenilir Gayrimenkul Danışmanlığı
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Antalya&apos;da <span className="text-amber-400">Yeni Nesil</span>
            <br />
            Gayrimenkul
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Kepez&apos;den Konyaaltı&apos;na, Muratpaşa&apos;dan Alanya&apos;ya
            — Antalya genelinde satılık daire, kiralık konut ve yatırım
            fırsatları. Uzman danışman ekibimizle her adımda yanınızdayız.
          </p>

          {/* Search */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <HeroSearchInput />
            <Link
              href="/listings"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-amber-400 transition-colors"
            >
              Tüm İlanları Gör
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Intent-based quick links — SEO-meaningful anchors */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/listings?category=SALE&district=Kepez"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Kepez Satılık Daire
            </Link>
            <Link
              href="/listings?category=RENT&district=Kepez"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Kepez Kiralık Daire
            </Link>
            <Link
              href="/listings?category=SALE&district=Konyaalt%C4%B1"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Konyaaltı Satılık
            </Link>
            <Link
              href="/listings?category=SALE&district=Muratpa%C5%9Fa"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Muratpaşa Satılık
            </Link>
            <Link
              href="/listings?category=SALE&district=Alanya"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Alanya Yatırım
            </Link>
            <Link
              href="/listings"
              className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 hover:bg-amber-400/20 transition-colors backdrop-blur-sm"
            >
              Tümünü Keşfet →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-5xl grid grid-cols-2 divide-x divide-zinc-100 sm:grid-cols-4">
          <div className="px-6 py-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">
              {stats ? `${stats.activeListings}+` : "—"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Aktif İlan</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">
              {stats ? `${stats.completedSales}+` : "—"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Tamamlanan Satış</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">
              {stats ? stats.expertConsultants : "—"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Uzman Danışman</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">5+</p>
            <p className="mt-0.5 text-xs text-zinc-500">Yıl Deneyim</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* ── Vitrin İlanları ──────────────────────────────────────────────────── */}
        {showcaseListings.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={16}
                    className="text-purple-500"
                    fill="currentColor"
                  />
                  <h2 className="text-xl font-bold text-zinc-900">
                    Vitrin İlanları
                  </h2>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Özenle seçilmiş, özel portföy ilanları
                </p>
              </div>
              <Link
                href="/listings"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Tümünü gör <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcaseListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Listings ────────────────────────────────────────────────── */}
        {featuredListings.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star
                    size={16}
                    className="text-amber-500"
                    fill="currentColor"
                  />
                  <h2 className="text-xl font-bold text-zinc-900">
                    Öne Çıkan İlanlar
                  </h2>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Editörlerimiz tarafından seçilmiş premium ilanlar
                </p>
              </div>
              <Link
                href="/listings"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Tümünü gör <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ── Kepez Spotlight ──────────────────────────────────────────────────── */}
        <section className="mt-20" aria-labelledby="kepez-heading">
          <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-stone-50 px-8 py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
              <div className="flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  <MapPin size={12} />
                  Uzmanlaştığımız Bölge
                </div>
                <h2
                  id="kepez-heading"
                  className="text-2xl font-bold text-zinc-900 sm:text-3xl"
                >
                  Kepez&apos;de Yatırım Fırsatları
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Antalya&apos;nın en hızlı büyüyen ilçesi Kepez, uygun fiyatlı
                  konut seçenekleri ve yüksek kira getirisiyle yatırımcılar için
                  cazip olmaya devam ediyor. Ofisimiz Şelale Caddesi&apos;nde
                  yer alıyor; bölgeyi en iyi biz tanıyoruz.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    "Antalya ortalamasının altında metrekare fiyatları",
                    "Gelişen altyapı ve güçlü toplu taşıma ağı",
                    "Yüksek kira getirisi ve hızlı kiracı bulma potansiyeli",
                    "Okul, hastane ve alışveriş merkezlerine yakınlık",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-zinc-600"
                    >
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/listings?category=SALE&district=Kepez"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
                  >
                    Kepez Satılık İlanlar
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/listings?category=RENT&district=Kepez"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    Kepez Kiralık İlanlar
                  </Link>
                </div>
              </div>
              <div className="shrink-0 lg:w-72">
                <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Kepez Bölge Verileri
                  </h3>
                  {[
                    {
                      label: "Ort. Satış Fiyatı (2+1)",
                      value: "₺ 2.8M – 4.5M",
                    },
                    { label: "Ort. Kira (2+1)", value: "₺ 15.000 – 22.000" },
                    { label: "Portföyümüzdeki İlan", value: "150+" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0"
                    >
                      <span className="text-xs text-zinc-500">{row.label}</span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <p className="mt-3 text-[10px] text-zinc-400">
                    * Tahmini değerler, güncel piyasa verilerine dayanmaktadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Antalya İlçeleri ─────────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">
              Antalya&apos;nın Gözde Emlak Bölgeleri
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              İlçe seçerek satılık ve kiralık ilanları filtreleyin
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {DISTRICTS.map((d) => (
              <Link
                key={d.name}
                href={`/listings?district=${encodeURIComponent(d.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 text-center hover:border-amber-300 hover:shadow-md transition-all"
              >
                <span className="mb-2 text-3xl">{d.emoji}</span>
                <h3 className="font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors">
                  {d.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">{d.desc}</p>
                <span className="mt-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                  {d.tag}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Neden Antalya'da Yatırım? ────────────────────────────────────────── */}
        <section className="mt-20" aria-labelledby="investment-heading">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <TrendingUp size={12} />
              Yatırım Fırsatları
            </div>
            <h2
              id="investment-heading"
              className="text-2xl font-bold text-zinc-900 sm:text-3xl"
            >
              Neden Antalya&apos;da Gayrimenkul Yatırımı?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500">
              Türkiye&apos;nin gözde tatil ve yaşam merkezi Antalya, istikrarlı
              değer artışı ve yüksek kira getirisiyle yatırımcıların ilk tercihi
              olmaya devam ediyor.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                color: "bg-emerald-50 text-emerald-600",
                title: "Değer Artışı",
                desc: "Antalya genelinde son 5 yılda konut değerleri yüzde 300'ün üzerinde artış gösterdi.",
              },
              {
                icon: Users,
                color: "bg-blue-50 text-blue-600",
                title: "Güçlü Yabancı Talep",
                desc: "Rusya, Ukrayna, Almanya ve İngiltere'den güçlü alıcı talebi değerleri destekliyor.",
              },
              {
                icon: Building2,
                color: "bg-amber-50 text-amber-600",
                title: "Turizm Ekonomisi",
                desc: "Yıllık 15 milyon turistin ziyaret ettiği şehir, kısa dönem kiracılık için ideal.",
              },
              {
                icon: Shield,
                color: "bg-purple-50 text-purple-600",
                title: "Güvenli Mülkiyet",
                desc: "Türk tapu sistemi ve yasal altyapı yabancı yatırımcılar için güvence sağlar.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow"
              >
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                >
                  <item.icon size={20} />
                </div>
                <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link
              href="/listings?category=SALE"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Yatırımlık İlanları Keşfet <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">Hizmetlerimiz</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Satıştan kiralamaya, yatırım danışmanlığından hukuki desteğe
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <s.icon size={20} />
                </div>
                <h3 className="font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Satın Alma Süreci ────────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">
              Gayrimenkul Alım &amp; Satım Süreci
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              İlan bulmaktan tapuya — her adımda yanınızdayız
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-zinc-200 bg-white p-6 hover:shadow-sm transition-shadow"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl font-bold text-amber-300">
                    {item.step}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <item.icon size={18} />
                  </div>
                </div>
                <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Listings ──────────────────────────────────────────────────── */}
        {recentListings.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Son İlanlar</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Antalya genelinde en yeni emlak ilanları
                </p>
              </div>
              <Link
                href="/listings"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Tümünü gör <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ── Neden Realty Tunax? ──────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="rounded-2xl bg-zinc-50 px-8 py-12">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Neden Realty Tunax?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
              10 yılı aşkın deneyim ve Antalya&apos;ya olan derin bağlılığımızla
              güvenilir, şeffaf ve sonuç odaklı gayrimenkul hizmeti sunuyoruz.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: "🏙️",
                  title: "Antalya & Kepez Uzmanı",
                  desc: "Kepez başta olmak üzere tüm Antalya ilçelerinde mahalle bazlı emlak bilgisi ve derin piyasa deneyimi.",
                },
                {
                  icon: "🤝",
                  title: "Güvenilir Danışmanlar",
                  desc: "Her danışman onay sürecinden geçer. Müşteri memnuniyeti ve uzun vadeli ilişki önceliğimizdir.",
                },
                {
                  icon: "📋",
                  title: "Şeffaf Süreç",
                  desc: "Her adımda bilgilendirilirsiniz. Sürpriz ücret veya gizli koşul yoktur.",
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="text-3xl">{item.icon}</div>
                  <h3 className="mt-3 font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact CTA ──────────────────────────────────────────────────────── */}
        <section className="mt-16 mb-16">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-zinc-900 px-8 py-10 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold text-white">
                Antalya&apos;da Gayrimenkul mi Arıyorsunuz?
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Kepez ve tüm Antalya ilçelerinde alım, satım ve kiralama için
                uzman danışmanlarımızla görüşün.
              </p>
              <a
                href="tel:+905530842270"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                <Phone size={14} />
                +90 553 084 22 70
              </a>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
              >
                İletişime Geç
              </Link>
              <Link
                href="/team"
                className="rounded-xl border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-400 hover:text-white transition-colors"
              >
                Ekibimiz
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
