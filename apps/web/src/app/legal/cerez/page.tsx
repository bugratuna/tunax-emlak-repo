import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Realty Tunax Çerez Politikası — web sitemizde kullandığımız çerezler hakkında bilgi.",
};

export default function CerezPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-8">
        <p className="text-xs text-zinc-400 mb-2">
          <Link href="/" className="hover:text-zinc-600">Ana Sayfa</Link>
          {" / "}
          <span>Çerez Politikası</span>
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Çerez Politikası</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Son güncelleme: Mart 2026 — Bu metin yakında final hukuki versiyonuyla güncellenecektir.
        </p>
      </div>

      <div className="prose prose-sm prose-zinc max-w-none space-y-6 text-zinc-700">
        <section>
          <h2 className="text-base font-semibold text-zinc-900">1. Çerez Nedir?</h2>
          <p>
            Çerezler, web sitelerinin kullanıcı deneyimini iyileştirmek amacıyla tarayıcınıza
            yerleştirdiği küçük metin dosyalarıdır. Bu dosyalar, tercihlerinizi hatırlamak ve
            site kullanımını analiz etmek için kullanılır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">2. Kullandığımız Çerez Kategorileri</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-800">Zorunlu Çerezler</h3>
              <p className="mt-1 text-sm">
                Web sitesinin temel işlevleri için gereklidir. Oturum yönetimi ve güvenlik
                doğrulaması bu kapsamdadır. Bu çerezler devre dışı bırakılamaz.
              </p>
              <p className="mt-1 text-xs text-zinc-400">Yasal dayanak: Meşru menfaat</p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-800">Analitik Çerezler</h3>
              <p className="mt-1 text-sm">
                Ziyaretçi sayısı, popüler sayfalar gibi istatistiksel verileri toplar.
                Bu veriler web sitemizi geliştirmemize yardımcı olur. Yalnızca açık rızanızla
                kullanılır.
              </p>
              <p className="mt-1 text-xs text-zinc-400">Yasal dayanak: Açık rıza</p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-800">Tercih Çerezleri</h3>
              <p className="mt-1 text-sm">
                Dil, tema ve görüntüleme tercihleri gibi ayarlarınızı hatırlar.
              </p>
              <p className="mt-1 text-xs text-zinc-400">Yasal dayanak: Açık rıza</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">3. Çerez Tercihlerinizi Yönetmek</h2>
          <p>
            Sitemizi ilk ziyaretinizde çerez kullanımına dair tercihlerinizi belirleyebilirsiniz.
            Tercihlerinizi tarayıcınızın ayarlarından veya aşağıdaki yöntemlerle yönetebilirsiniz:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz</li>
            <li>Sitemizi yeniden ziyaret ederek tercihlerinizi güncelleyebilirsiniz</li>
          </ul>
          <p className="mt-2 text-sm text-zinc-500">
            Not: Zorunlu çerezlerin engellenmesi web sitesinin işlevselliğini etkileyebilir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">4. Üçüncü Taraf Çerezleri</h2>
          <p>
            Web sitemizde şu an itibariyle üçüncü taraf izleme çerezleri kullanılmamaktadır.
            İleride analitik araçlar entegre edilmesi durumunda bu politika güncellenecektir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">5. İletişim</h2>
          <p>
            Çerez politikamıza ilişkin sorularınız için{" "}
            <a href="mailto:ismail.tuna@realtytunax.com" className="text-amber-700 hover:underline">
              ismail.tuna@realtytunax.com
            </a>{" "}
            adresine yazabilirsiniz.
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Bu metin bir taslaktır. Hukuki geçerliliği olan final metin yakında yayımlanacaktır.
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400 pt-4 border-t border-zinc-100">
          <Link href="/legal/kvkk" className="hover:text-zinc-600">KVKK Aydınlatma Metni</Link>
          <Link href="/legal/gizlilik" className="hover:text-zinc-600">Gizlilik Politikası</Link>
          <Link href="/legal/acik-riza" className="hover:text-zinc-600">Açık Rıza Metni</Link>
        </div>
      </div>
    </div>
  );
}
