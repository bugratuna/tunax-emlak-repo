import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/listings", label: "İlanlar" },
  { href: "/team", label: "Çalışanlarımız" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/services", label: "Hizmetler" },
  { href: "/vision", label: "Vizyon & Misyon" },
  { href: "/contact", label: "İletişim" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-900 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              {/* brightness-0 invert renders the logo in white on dark background */}
              <img
                src="/brand/logo.png"
                alt="Realty Tunax"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <span className="text-sm font-bold text-white">Realty Tunax</span>
            </Link>
            <p className="text-xs leading-relaxed text-zinc-400">
              Antalya&apos;nın güvenilir gayrimenkul danışmanlık firması. Satış,
              kiralama ve yatırım süreçlerinde yanınızdayız.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
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
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              İletişim
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0" />
                <a href="tel:+902420000000" className="hover:text-white transition-colors">
                  0242 000 00 00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0" />
                <a href="mailto:info@realtytunax.com.tr" className="hover:text-white transition-colors">
                  info@realtytunax.com.tr
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>
                  Konyaaltı, Antalya<br />
                  Türkiye
                </span>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
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

        <div className="mt-10 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Realty Tunax Gayrimenkul. Tüm hakları saklıdır.</span>
          <span>Antalya, Türkiye</span>
        </div>
      </div>
    </footer>
  );
}
