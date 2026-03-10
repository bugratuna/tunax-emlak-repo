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
} from "lucide-react";
import { HeroSearchInput } from "@/components/hero-search-input";
import { listListings } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = {
  title: "Realty Tunax — Antalya Gayrimenkul Platformu",
  description:
    "Antalya'da satılık ve kiralık konut, ticari gayrimenkul. Uzman danışman ekibimizle güvenilir, şeffaf ve hızlı hizmet.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export const revalidate = 60;

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
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow"
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
  { name: "Konyaaltı", emoji: "🏖️", desc: "Sahil & Lüks Rezidanslar" },
  { name: "Muratpaşa", emoji: "🏙️", desc: "Şehir Merkezi & Ticari" },
  { name: "Kepez", emoji: "🏘️", desc: "Uygun Fiyatlı Konutlar" },
  { name: "Lara", emoji: "🌊", desc: "Denize Yakın Siteler" },
  { name: "Alanya", emoji: "🏰", desc: "Tatil & Yatırım" },
  { name: "Kemer", emoji: "⛵", desc: "Marina & Doğa" },
];

const STATS = [
  { value: "500+", label: "Aktif İlan" },
  { value: "200+", label: "Tamamlanan Satış" },
  { value: "12", label: "Uzman Danışman" },
  { value: "10+", label: "Yıl Deneyim" },
];

const SERVICES = [
  {
    icon: Building2,
    title: "Konut Satış & Kiralama",
    desc: "Daire, villa, müstakil ev — her bütçeye uygun seçenekler.",
  },
  {
    icon: TrendingUp,
    title: "Yatırım Danışmanlığı",
    desc: "Antalya'da en verimli yatırım bölgelerini birlikte keşfedelim.",
  },
  {
    icon: Shield,
    title: "Güvenli İşlem",
    desc: "Hukuki süreçler ve tapu işlemleri eksiksiz yönetilir.",
  },
  {
    icon: Users,
    title: "Yabancıya Satış",
    desc: "İngilizce, Rusça ve Arapça desteğiyle uluslararası alıcılara hizmet.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  let showcaseListings: Listing[] = [];
  let featuredListings: Listing[] = [];
  let recentListings: Listing[] = [];

  try {
    const [showcaseRes, featuredRes, recentRes] = await Promise.all([
      listListings({ status: "PUBLISHED", isShowcase: true, sortBy: "newest" }),
      listListings({ status: "PUBLISHED", isFeatured: true, sortBy: "newest" }),
      listListings({ status: "PUBLISHED", sortBy: "newest" }),
    ]);
    showcaseListings = showcaseRes.data.slice(0, 6);
    featuredListings = featuredRes.data.slice(0, 6);
    recentListings = recentRes.data.slice(0, 6);
  } catch {
    // Non-critical — page renders without listings
  }

  return (
    <div className="-mx-4 -mt-8">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 px-4 py-28 text-white">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/brand/logo.png"
              alt="Realty Tunax"
              width={0}
              height={0}
              sizes="100vw"
              style={{ height: "12rem", width: "auto", objectFit: "contain" }}
              className="drop-shadow-lg"
            />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Star size={12} className="text-amber-400" fill="currentColor" />
            Antalya&apos;nın Güvenilir Emlak Platformu
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Antalya&apos;da{" "}
            <span className="text-amber-400">Hayalinizdeki</span>
            <br />
            Mülkü Bulun
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
            Konyaaltı&apos;ndan Alanya&apos;ya, sahil vilalarından şehir
            merkezine — Antalya genelinde binlerce ilan tek platformda.
          </p>

          {/* Search bar */}
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

          {/* Quick district links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {DISTRICTS.map((d) => (
              <Link
                key={d.name}
                href={`/listings?district=${encodeURIComponent(d.name)}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors backdrop-blur"
              >
                {d.emoji} {d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-5xl grid grid-cols-2 divide-x divide-zinc-100 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">

        {/* ── Vitrin İlanları ──────────────────────────────────────────────── */}
        {showcaseListings.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" fill="currentColor" />
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
        {/* ── Featured Listings ──────────────────────────────────────────────── */}
        {featuredListings.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
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

        {/* ── Neighborhoods ──────────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">
              Antalya&apos;nın Gözde Bölgeleri
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Bölge seçerek ilanları filtreleyin
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
              </Link>
            ))}
          </div>
        </section>

        {/* ── Services ───────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">
              Hizmetlerimiz
            </h2>
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

        {/* ── Recent Listings ────────────────────────────────────────────────── */}
        {recentListings.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Son İlanlar</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  En yeni emlak ilanları
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

        {/* ── Why Realty Tunax ───────────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="rounded-2xl bg-zinc-50 px-8 py-12">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Neden Realty Tunax?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
              Yıllar içinde edindiğimiz deneyim ve güvenle Antalya&apos;nın en
              kapsamlı gayrimenkul platformunu oluşturduk.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: "🏙️",
                  title: "Antalya Uzmanı",
                  desc: "Tüm ilçeler, mahalleler ve emlak trendleri hakkında derin bilgi birikimi.",
                },
                {
                  icon: "🤝",
                  title: "Güvenilir Danışmanlar",
                  desc: "Her danışman onay sürecinden geçer. Müşteri memnuniyeti önceliğimizdir.",
                },
                {
                  icon: "📋",
                  title: "Şeffaf Süreç",
                  desc: "Her adımda bilgilendirilirsiniz. Sürpriz ücret veya gizli şart yoktur.",
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

        {/* ── Contact CTA ───────────────────────────────────────────────────── */}
        <section className="mt-16 mb-16">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-zinc-900 px-8 py-10 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold text-white">
                Uzmanlarımızla Görüşün
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Sorularınız için bizi arayın veya form doldurun — en kısa
                sürede dönüş yaparız.
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
