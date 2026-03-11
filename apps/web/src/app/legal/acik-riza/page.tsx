import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Açık Rıza Metni",
  description: "Realty Tunax Açık Rıza Metni — kişisel verilerin işlenmesine ilişkin açık rıza bildirimi.",
};

export default function AcikRizaPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-8">
        <p className="text-xs text-zinc-400 mb-2">
          <Link href="/" className="hover:text-zinc-600">Ana Sayfa</Link>
          {" / "}
          <span>Açık Rıza Metni</span>
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Açık Rıza Metni</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Son güncelleme: Mart 2026 — Bu metin yakında final hukuki versiyonuyla güncellenecektir.
        </p>
      </div>

      <div className="prose prose-sm prose-zinc max-w-none space-y-6 text-zinc-700">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm leading-relaxed">
            Ben, aşağıdaki koşullar dahilinde kişisel verilerimin <strong>Realty Tunax Gayrimenkul</strong>
            tarafından işlenmesine özgür iradem ile onay veriyorum.
          </p>
        </div>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">1. Rızam Kapsamındaki Veri İşleme Faaliyetleri</h2>
          <p>Aşağıdaki amaçlarla kişisel verilerimin işlenmesine <strong>açık rıza</strong> veriyorum:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Analitik amaçlı çerezler:</strong> Web sitesi kullanım alışkanlıklarımın
              anonim istatistiksel analiz için işlenmesi
            </li>
            <li>
              <strong>Pazarlama iletişimleri:</strong> Realty Tunax hizmetlerine ilişkin e-posta
              bildirimleri alınması (iletişim formu doldururken ayrıca tercih belirtilmesi gerekir)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">2. Zorunlu İşlemeler</h2>
          <p>
            Aşağıdaki veri işleme faaliyetleri, KVKK kapsamında <em>meşru menfaat</em> veya
            <em> sözleşmenin ifası</em> hukuki sebebine dayandığından açık rızanıza gerek duyulmadan
            gerçekleştirilmektedir:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>İletişim taleplerinizin yanıtlanması</li>
            <li>Web sitesi güvenliğinin sağlanması</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">3. Rızanızı Geri Alma Hakkı</h2>
          <p>
            Vermiş olduğunuz açık rızayı istediğiniz zaman geri alabilirsiniz. Rızanızı geri almanız,
            geri almadan önceki veri işleme faaliyetlerinin hukuka aykırı olduğu anlamına gelmez.
          </p>
          <p className="mt-2">
            Rıza geri alma talebinizi{" "}
            <a href="mailto:ismail.tuna@realtytunax.com" className="text-amber-700 hover:underline">
              ismail.tuna@realtytunax.com
            </a>{" "}
            adresine iletebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">4. Detaylı Bilgi</h2>
          <p>
            Kişisel verilerinizin nasıl işlendiğine dair detaylı bilgi için lütfen inceleyin:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <Link href="/legal/kvkk" className="text-amber-700 hover:underline">
                KVKK Aydınlatma Metni
              </Link>
            </li>
            <li>
              <Link href="/legal/gizlilik" className="text-amber-700 hover:underline">
                Gizlilik Politikası
              </Link>
            </li>
            <li>
              <Link href="/legal/cerez" className="text-amber-700 hover:underline">
                Çerez Politikası
              </Link>
            </li>
          </ul>
        </section>

        <div className="mt-8 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Bu metin bir taslaktır. Hukuki geçerliliği olan final metin yakında yayımlanacaktır.
          Dijital açık rıza mekanizması (onay kutusu ile rıza kaydı) ileride hayata geçirilecektir.
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400 pt-4 border-t border-zinc-100">
          <Link href="/legal/kvkk" className="hover:text-zinc-600">KVKK Aydınlatma Metni</Link>
          <Link href="/legal/gizlilik" className="hover:text-zinc-600">Gizlilik Politikası</Link>
          <Link href="/legal/cerez" className="hover:text-zinc-600">Çerez Politikası</Link>
        </div>
      </div>
    </div>
  );
}
