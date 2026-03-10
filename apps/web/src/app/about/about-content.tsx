"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Star, Users, ArrowRight, MapPin, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

// ── Fade-in-up when element enters viewport ───────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stat counter card ─────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 px-8 py-6 shadow-sm ring-1 ring-amber-100 backdrop-blur-sm">
      <span className="text-4xl font-extrabold text-amber-600">{value}</span>
      <span className="text-sm font-medium text-zinc-500">{label}</span>
    </div>
  );
}

// ── Value pillar card ─────────────────────────────────────────────────────────
function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-base font-bold text-zinc-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

// ── Team member mini-card ─────────────────────────────────────────────────────
function TeamMini({
  name,
  role,
  imageSrc,
  href,
}: {
  name: string;
  role: string;
  imageSrc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={name}
        className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-100"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 group-hover:text-amber-700 transition-colors">
          {name}
        </p>
        <p className="text-sm text-amber-600">{role}</p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-zinc-300 transition-colors group-hover:text-amber-500"
      />
    </Link>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────
export function AboutContent() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-0">
      {/* ── 1. HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-20 text-center text-white sm:py-28">
        {/* Decorative amber glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        </div>
        <div className="relative">
          <FadeUp>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <MapPin size={12} />
              Antalya, Türkiye
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="mx-auto mt-2 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
              Gayrimenkulde{" "}
              <span className="text-amber-400">Güven</span>{" "}
              ve Uzmanlık
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-300">
              2025 yılında Antalya Kepez&apos;de kurulan Realty Tunax, her müşterisine
              sadece bir mülk değil, geleceğe dair doğru bir yatırım sunmayı hedeflemektedir.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── 2. STATS ──────────────────────────────────────────────────────────── */}
      <section className="py-14">
        <FadeUp>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat value="2025" label="Kuruluş Yılı" />
            <Stat value="Antalya" label="Merkez Ofis — Meltem" />
            <Stat value="%100" label="Müşteri Odaklı Hizmet" />
          </div>
        </FadeUp>
      </section>

      {/* ── 3. STORY — alternating text / image ──────────────────────────────── */}
      <section className="py-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Image */}
          <FadeUp delay={0.05}>
            <div className="overflow-hidden rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-us.png"
                alt="Realty Tunax Ofisi"
                className="w-full object-cover"
              />
            </div>
          </FadeUp>

          {/* Text */}
          <FadeUp delay={0.15}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700">
                <TrendingUp size={12} />
                Hikayemiz
              </div>
              <h2 className="text-2xl font-bold leading-snug text-zinc-900 sm:text-3xl">
                Realty Tunax&apos;a Hoş Geldiniz
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                Akdeniz&apos;in incisi Antalya&apos;da, gayrimenkul sektörüne yeni bir soluk
                getirme hedefiyle yola çıktık. Şehrin en değerli lokasyonlarından biri olan
                Kepez&apos;de, yenilikçi hizmet anlayışımızla faaliyetlerimize başladık.
              </p>
              <p className="text-sm leading-relaxed text-zinc-600">
                Kurucu ortaklarımız İsmail Tuna ve Ertuğrul Uygun, ortak bir vizyon ve
                gayrimenkule duydukları tutkuyla her müşterilerine sadece bir mülk değil,
                doğru bir gelecek yatırımı sunmak için buradalar.
              </p>
              <p className="text-sm leading-relaxed text-zinc-600">
                Temel prensibimiz, müşteri memnuniyetini en üst düzeyde tutarak uzun
                soluklu ve güvene dayalı ilişkiler kurmaktır.
              </p>
              <Link
                href="/team"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
              >
                Ekibimizle Tanışın <ArrowRight size={14} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 4. VALUES ─────────────────────────────────────────────────────────── */}
      <section className="py-14">
        <FadeUp>
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700">
              <Award size={12} />
              Değerlerimiz
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">
              Neden Realty Tunax?
            </h2>
          </div>
        </FadeUp>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <FadeUp delay={0.05}>
            <ValueCard
              icon={Shield}
              title="Güven ve Şeffaflık"
              description="Her işlemde tam şeffaflık. Müşterilerimize doğru ve eksiksiz bilgi sunmak önceliğimizdir."
            />
          </FadeUp>
          <FadeUp delay={0.1}>
            <ValueCard
              icon={Star}
              title="Sektör Uzmanlığı"
              description="Antalya gayrimenkul piyasasının derinlemesine bilgisiyle en doğru yatırım kararlarını almanıza yardımcı oluyoruz."
            />
          </FadeUp>
          <FadeUp delay={0.15}>
            <ValueCard
              icon={Users}
              title="Müşteri Odaklılık"
              description="Satın alma, satma veya kiralama süreçlerinde her adımda yanınızdayız. Süreç bitene kadar destek sunuyoruz."
            />
          </FadeUp>
        </div>
      </section>

      {/* ── 5. TEAM TEASER ────────────────────────────────────────────────────── */}
      <section className="py-6">
        <FadeUp>
          <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-8 sm:p-10">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-zinc-900">
                Sizinle Çalışacak Ekip
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Deneyimli danışmanlarımız her adımda yanınızda.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TeamMini
                name="İsmail Tuna"
                role="Ofis Sahibi (Broker)"
                imageSrc="https://image5.sahibinden.com/users/26/40/67/p200_profile_96264067_3278857.jpg"
                href="/team"
              />
              <TeamMini
                name="Ertuğrul Uygun"
                role="Kurucu Ortak"
                imageSrc="/ertugrul-uygun.png" // Sadece dosya adını ve başındaki eğik çizgiyi yazman yeterli
                href="/team"
              />
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/team"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Tüm Ekibi Görüntüle <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── 6. CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-10">
        <FadeUp>
          <div className="rounded-3xl bg-zinc-900 px-8 py-12 text-center text-white">
            <h2 className="text-2xl font-bold">Hayalinizdeki Mülk İçin Hazır mısınız?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-300">
              Antalya&apos;da satılık veya kiralık mülk arıyorsanız, uzman ekibimiz en
              doğru seçeneği bulmanız için burada.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Link
                href="/listings"
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
              >
                İlanları Gör
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-zinc-600 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:border-zinc-400 transition-colors"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
