import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Realty Tunax Gizlilik Politikası — kişisel verilerinizin nasıl korunduğunu öğrenin.",
};

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-8">
        <p className="text-xs text-zinc-400 mb-2">
          <Link href="/" className="hover:text-zinc-600">Ana Sayfa</Link>
          {" / "}
          <span>Gizlilik Politikası</span>
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Gizlilik Politikası</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Son güncelleme: Mart 2026 — Bu metin yakında final hukuki versiyonuyla güncellenecektir.
        </p>
      </div>

      <div className="prose prose-sm prose-zinc max-w-none space-y-6 text-zinc-700">
        <section>
          <h2 className="text-base font-semibold text-zinc-900">1. Genel Bilgi</h2>
          <p>
            Realty Tunax Gayrimenkul olarak ziyaretçilerimizin gizliliğine saygı duyuyor ve
            kişisel verilerinin korunması için gerekli teknik ve idari tedbirleri alıyoruz.
            Bu politika, web sitemizi (realtytunax.com) kullanırken toplanan veriler hakkında
            sizi bilgilendirmeyi amaçlamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">2. Hangi Verileri Topluyoruz?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>İletişim formu:</strong> Ad, e-posta, telefon numarası ve mesaj içeriği
            </li>
            <li>
              <strong>İlan sorgu formları:</strong> İlan numarası, iletişim tercihleriniz
            </li>
            <li>
              <strong>Çerezler:</strong> Oturum ve tercih verileri (bakınız: Çerez Politikası)
            </li>
            <li>
              <strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, ziyaret süresi (yalnızca güvenlik amacıyla)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">3. Verileri Nasıl Kullanıyoruz?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Danışmanlık taleplerinizi yanıtlamak</li>
            <li>İlan bilgileri konusunda bilgilendirme yapmak</li>
            <li>Web sitesi güvenliğini sağlamak</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">4. Üçüncü Taraflarla Paylaşım</h2>
          <p>
            Kişisel verileriniz; açık rızanız olmaksızın üçüncü taraflarla ticari amaçla paylaşılmaz.
            Aşağıdaki durumlarda sınırlı paylaşım yapılabilir:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Yasal zorunluluk (mahkeme kararı, resmi kurum talebi)</li>
            <li>İş sürekliliği için sözleşmeli altyapı sağlayıcıları (bulut, e-posta)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">5. Güvenlik</h2>
          <p>
            Web sitemiz HTTPS ile şifreli bağlantı kullanmaktadır. Verilerinizi yetkisiz erişime,
            kayba veya imhaya karşı korumak için endüstri standardı güvenlik önlemleri uygulanmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">6. Haklarınız</h2>
          <p>
            KVKK kapsamındaki haklarınız için lütfen{" "}
            <Link href="/legal/kvkk" className="text-amber-700 hover:underline">
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni inceleyin veya{" "}
            <a href="mailto:ismail.tuna@realtytunax.com" className="text-amber-700 hover:underline">
              ismail.tuna@realtytunax.com
            </a>{" "}
            adresine yazın.
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Bu metin bir taslaktır. Hukuki geçerliliği olan final metin yakında yayımlanacaktır.
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400 pt-4 border-t border-zinc-100">
          <Link href="/legal/kvkk" className="hover:text-zinc-600">KVKK Aydınlatma Metni</Link>
          <Link href="/legal/cerez" className="hover:text-zinc-600">Çerez Politikası</Link>
          <Link href="/legal/acik-riza" className="hover:text-zinc-600">Açık Rıza Metni</Link>
        </div>
      </div>
    </div>
  );
}
