import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

// ── Social icon: TikTok (no lucide equivalent) ────────────────────────────────
function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
    </svg>
  );
}

// ── Sahibinden icon (house shape) ─────────────────────────────────────────────
function SahibindenIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="2" fill="#FFF200" />

      <ellipse cx="24" cy="36.5" rx="10" ry="2.8" fill="#D8CC00" opacity="0.55" />

      <text
        x="24"
        y="30"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#000"
      >
        S
      </text>
    </svg>
  );
}

// ── Instagram icon (simple camera-style) ─────────────────────────────────────
function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Facebook icon ─────────────────────────────────────────────────────────────
function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FOOTER_LINKS = [
  { href: "/listings", label: "İlanlar" },
  { href: "/team", label: "Çalışanlarımız" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/services", label: "Hizmetler" },
  { href: "/vision", label: "Vizyon & Misyon" },
  { href: "/contact", label: "İletişim" },
];

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/tunax.gayrimenkul",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    href: "https://www.facebook.com/reality.tunax.gayrimenkul",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.tiktok.com/@realty.tunax.gayrimenkul",
    label: "TikTok",
    Icon: TikTokIcon,
  },
  {
    href: "https://realtyprimex.sahibinden.com/",
    label: "Sahibinden",
    Icon: SahibindenIcon,
  },
];

const LEGAL_LINKS = [
  { href: "/legal/kvkk", label: "KVKK Aydınlatma Metni" },
  { href: "/legal/gizlilik", label: "Gizlilik Politikası" },
  { href: "/legal/cerez", label: "Çerez Politikası" },
  { href: "/legal/acik-riza", label: "Açık Rıza Metni" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-900 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand + Social */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/logo.png"
                alt="Realty Tunax"
                width={0}
                height={0}
                sizes="100vw"
                style={{ height: "2rem", width: "auto", objectFit: "contain" }}
                className="brightness-0 invert"
              />
              <span className="text-sm font-bold text-white">Realty Tunax</span>
            </Link>
            <p className="text-xs leading-relaxed text-zinc-400">
              Antalya&apos;nın güvenilir gayrimenkul danışmanlık firması. Satış,
              kiralama ve yatırım süreçlerinde yanınızdayız.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Sayfalar
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              İletişim
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0" />
                <a href="tel:+905530842270" className="hover:text-white transition-colors">
                  +90 553 084 22 70
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0" />
                <a href="mailto:ismail.tuna@realtytunax.com" className="hover:text-white transition-colors">
                  ismail.tuna@realtytunax.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <a
                  href="https://www.google.com/maps/place/Realty+Tunax+%7C+Yeni+Nesil+Gayrimenkul/@36.9244543,30.692245,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors leading-relaxed"
                >
                  Kütükçü, Şelale Cd. No:123 D:117<br />
                  07080 Kepez, Antalya
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Hizmetlerimiz
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {[
                "Konut Satış & Kiralama",
                "Ticari Gayrimenkul",
                "Arsa & Tarla",
                "Yabancıya Satış",
                "Ekspertiz & Değerleme",
              ].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-800 pt-6 space-y-3">
          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-600">
            <span>© {new Date().getFullYear()} Realty Tunax Gayrimenkul. Tüm hakları saklıdır.</span>
            <span>Antalya, Türkiye</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
