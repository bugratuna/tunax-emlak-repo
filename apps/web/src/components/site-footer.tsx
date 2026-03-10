import Image from "next/image";
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
                <a href="https://www.google.com/maps/place/Realty+Tunax+%7C+Yeni+Nesil+Gayrimenkul/@36.9244543,30.692245,17z/data=!3m1!4b1!4m6!3m5!1s0x14c38fac7ca31347:0x8949b9f942d8394!8m2!3d36.9244543!4d30.692245!16s%2Fg%2F11ygwxh6vw?entry=ttu&g_ep=EgoyMDI2MDMwNC4xIKXMDSoASAFQAw%3D%3D" target="_blank"  className="hover:text-white transition-colors">
                  Kütükçü, Şelale Cd. No:123 D:117, 07080, 07000 Kepez,Antalya<br />
                  Türkiye
                </a>
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
