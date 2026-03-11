import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Realty Tunax KVKK Aydınlatma Metni — 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında.",
};

export default function KvkkPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-8">
        <p className="text-xs text-zinc-400 mb-2">
          <Link href="/" className="hover:text-zinc-600">Ana Sayfa</Link>
          {" / "}
          <span>KVKK Aydınlatma Metni</span>
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">
          KVKK Aydınlatma Metni
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Son güncelleme: Mart 2026 — Bu metin yakında final hukuki versiyonuyla güncellenecektir.
        </p>
      </div>

      <div className="prose prose-sm prose-zinc max-w-none space-y-6 text-zinc-700">
        <section>
          <h2 className="text-base font-semibold text-zinc-900">1. Veri Sorumlusu</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu
            sıfatıyla <strong>Realty Tunax Gayrimenkul</strong> (bundan böyle &quot;Şirket&quot; olarak
            anılacaktır) kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda işlemektedir.
          </p>
          <p>
            <strong>Adres:</strong> Kütükçü, Şelale Cd. No:123 D:117, 07080 Kepez, Antalya<br />
            <strong>E-posta:</strong> ismail.tuna@realtytunax.com<br />
            <strong>Telefon:</strong> +90 553 084 22 70
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">2. İşlenen Kişisel Veriler</h2>
          <p>Şirketimiz tarafından aşağıdaki kişisel veriler işlenebilmektedir:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ad, soyad, e-posta adresi, telefon numarası</li>
            <li>İletişim formu aracılığıyla iletilen mesaj içerikleri</li>
            <li>Web sitesi kullanım verileri (çerezler aracılığıyla — bakınız: Çerez Politikası)</li>
            <li>İlan sorgulama ve danışman iletişim talepleri</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">3. Kişisel Verilerin İşlenme Amacı</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Gayrimenkul danışmanlık hizmetlerinin sunulması</li>
            <li>İletişim taleplerinizin yanıtlanması</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Web sitesi güvenliğinin sağlanması</li>
            <li>Hizmet kalitesinin iyileştirilmesi (analitik, yalnızca açık rıza ile)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">4. Kişisel Verilerin Aktarılması</h2>
          <p>
            Kişisel verileriniz; yasal yükümlülükler kapsamında yetkili kamu kurum ve kuruluşlarına,
            iş süreçlerinin yürütülmesi amacıyla sözleşmeli hizmet sağlayıcılarımıza (bulut altyapısı,
            iletişim hizmetleri) aktarılabilir. Üçüncü taraflarla yapılan paylaşım KVKK&apos;nın
            8. ve 9. maddeleri çerçevesinde gerçekleştirilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">5. Kişisel Veri Saklama Süreleri</h2>
          <p>
            Kişisel verileriniz, işlenme amacının ortadan kalkmasıyla birlikte veya yasal
            saklama süresinin dolmasıyla silinmekte, yok edilmekte veya anonim hale getirilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">6. Veri Sahibi Hakları</h2>
          <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmesi hâlinde düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>İşlemenin otomatik sistemler aracılığıyla gerçekleşmesi durumunda aleyhine doğan sonuca itiraz etme</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde tazminat talep etme</li>
          </ul>
          <p className="mt-3">
            Başvurularınızı <strong>ismail.tuna@realtytunax.com</strong> adresine iletebilirsiniz.
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Bu metin bir taslaktır. Hukuki geçerliliği olan final metin yakında yayımlanacaktır.
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400 pt-4 border-t border-zinc-100">
          <Link href="/legal/gizlilik" className="hover:text-zinc-600">Gizlilik Politikası</Link>
          <Link href="/legal/cerez" className="hover:text-zinc-600">Çerez Politikası</Link>
          <Link href="/legal/acik-riza" className="hover:text-zinc-600">Açık Rıza Metni</Link>
        </div>
      </div>
    </div>
  );
}
