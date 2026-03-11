/**
 * Static Antalya province administrative data.
 * Source: Turkish postal / administrative boundaries (TÜİK, PTT).
 * Update manually if new districts or neighbourhoods are added.
 *
 * Corrections applied (2026):
 * - "Archaeologia" removed from Konyaaltı (not a Turkish mahalle name)
 * - "Tekirova" removed from Konyaaltı (belongs to Kemer district)
 * - "Gazipaşa" removed from Alanya (it is a separate district)
 * - "Camyuva" removed from Kemer (duplicate of "Çamyuva")
 * - "Finike" removed from Kumluca (it is a separate district)
 * - "Karaöz" removed from Finike (belongs to Kumluca district)
 * - "Boğazkent" removed from Aksu (belongs to Serik district)
 * - "Kadriye" removed from Aksu (belongs to Serik district)
 * - "Çolaklı" removed from Aksu (belongs to Serik/Manavgat area)
 * - "Kadriye" removed from Manavgat (belongs to Serik district)
 * - "İn Yavuz Selim" removed from Kepez (duplicate of "Yavuz Selim")
 * - "Korkuteli" removed from Kepez (it is a separate district)
 * - "İbradı yolu" replaced in Akseki (not a registered mahalle name)
 */

export const DISTRICTS: string[] = [
  "Muratpaşa",
  "Kepez",
  "Konyaaltı",
  "Döşemealtı",
  "Aksu",
  "Alanya",
  "Manavgat",
  "Serik",
  "Kemer",
  "Kumluca",
  "Finike",
  "Kaş",
  "Demre",
  "Elmalı",
  "Korkuteli",
  "Akseki",
  "Gündoğmuş",
  "İbradı",
  "Gazipaşa",
];

/**
 * District → neighbourhood names (mahalles).
 * Covers the most populated districts with full lists;
 * smaller districts have representative entries.
 */
export const NEIGHBORHOODS: Record<string, string[]> = {
  Muratpaşa: [
    "Altındağ", "Bahçelievler", "Balbey", "Barbaros", "Bayındır",
    "Cumhuriyet", "Çağlayan", "Çaybaşı", "Demircikara", "Deniz",
    "Doğuyaka", "Dutlubahçe", "Elmalı", "Ermenek", "Etiler",
    "Fener", "Gebizli", "Gençlik", "Güvenlik", "Güzelbağ",
    "Güzeloba", "Güzeloluk", "Haşimişcan", "Kılınçarslan", "Kırcami",
    "Kışla", "Kızılarık", "Kızılsaray", "Kızıltoprak", "Konuksever",
    "Mehmetçik", "Meltem", "Memurevleri", "Meydankavağı", "Muratpaşa",
    "Sedir", "Selçuk", "Sinan", "Soğuksu", "Şirinyalı",
    "Tahılpazarı", "Tarım", "Topçular", "Tuzcular", "Üçgen",
    "Varlık", "Yenigöl", "Yenigün", "Yeşilbahçe", "Yeşildere",
    "Yeşilova", "Yıldız", "Yüksekalan", "Zerdalilik", "Zümrütova",
  ],
  Kepez: [
    "Ahatlı", "Akpınar", "Altıayak", "Altınova Düden", "Altınova Orta",
    "Altınova Sinan", "Atatürk", "Avni Tolunay", "Ayanoğlu", "Aydoğmuş",
    "Baraj", "Barış", "Başköy", "Beşyol", "Çamlıbel", "Çamlıca",
    "Çankaya", "Demirel", "Duacı", "Duraliler", "Düden", "Emek",
    "Erenköy", "Esentepe", "Fabrikalar", "Fatih", "Fevzi Çakmak",
    "Gazi", "Göçerler", "Gökpınar", "Gülveren", "Gündoğdu", "Güneş",
    "Habibler", "Hüsnü Karakaş", "Kanal", "Karşıyaka",
    "Kazım Karabekir", "Kepez", "Kirişçiler", "Kültür",
    "Kütükçü", "Menderes", "Merkez Köy", "Metin Çakas", "Metin Kasapoğlu",
    "Mehmet Akif Ersoy", "Odabaşı", "Özgürlük", "Santral", "Sütçüler",
    "Şafak", "Şelale", "Teomanpaşa", "Toki", "Ulus", "Ünsal",
    "Varak", "Yavuz Selim", "Yeni", "Yeni Doğan", "Yeni Emek",
    "Yeni Mahalle", "Yeşiltepe", "Yeşilyurt", "Yükseliş", "Zeytinlik",
  ],
  Konyaaltı: [
    "Arapsuyu",
    "Askeriye",
    "Atatürk",
    "Bahçeyaka",
    "Çakırlar",
    "Çıplaklı",
    "Doyran",
    "Gürsu",
    "Hacıveyiszade",
    "Hurma",
    "Konyaaltı",
    "Kuzdere",
    "Liman",
    "Sarısu",
    "Siteler",
    "Solak",
    "Uncalı",
    "Yeşilbayır",
  ],
  Döşemealtı: [
    "Altınkaya",
    "Aşağıkaraman",
    "Bağlıca",
    "Doğanköy",
    "Düzlerçamı",
    "Gebiz",
    "Göçerler",
    "Kepezaltı",
    "Kırkgöz",
    "Pınarkent",
    "Sarısu",
    "Yazırkent",
    "Yeşilköy",
  ],
  Aksu: [
    "Atatürk",
    "Düden",
    "Gökçeler",
    "Güzelyurt",
    "Kavacık",
    "Kundu",
    "Kurşunlu",
    "Taşağıl",
    "Yeşilköy",
  ],
  Alanya: [
    "Alanya Merkez",
    "Avsallar",
    "Bektaş",
    "Cikcilli",
    "Demirtaş",
    "Dim",
    "Elikesik",
    "Güllerpınarı",
    "Hacet",
    "İncekum",
    "Kargıcak",
    "Kestel",
    "Konaklar",
    "Mahmutlar",
    "Obagöl",
    "Oba",
    "Payallar",
    "Sapadere",
    "Tosmur",
    "Türkler",
  ],
  Manavgat: [
    "Bucakdere",
    "Çenger",
    "Çolaklı",
    "Evrenseki",
    "Gündoğdu",
    "Kumköy",
    "Manavgat Merkez",
    "Sarılar",
    "Side",
    "Sorgun",
    "Titreyengöl",
  ],
  Serik: [
    "Acısu",
    "Belek",
    "Boğazkent",
    "Gebiz",
    "Kadriye",
    "Serik Merkez",
    "Taşağıl",
    "Üçkuyular",
  ],
  Kemer: [
    "Beldibi",
    "Çamyuva",
    "Göynük",
    "Kemer Merkez",
    "Kiriş",
    "Tekirova",
  ],
  Kumluca: [
    "Adrasan",
    "Karaöz",
    "Kumluca Merkez",
    "Mavikent",
    "Sahilkent",
  ],
  Finike: [
    "Finike Merkez",
    "Limyra",
    "Turunçova",
    "Çayköy",
  ],
  Kaş: [
    "Bayındır",
    "Kalkan",
    "Kaş Merkez",
    "Kınık",
    "Patara",
  ],
  Demre: [
    "Demre Merkez",
    "Kale",
    "Myra",
    "Sülüklü",
    "Üçağız",
  ],
  Elmalı: [
    "Elmalı Merkez",
    "Gödene",
    "Kızılcadağ",
    "Ovacık",
    "Yeşilgöl",
  ],
  Korkuteli: [
    "Çığlık",
    "Korkuteli Merkez",
    "Sarıkavak",
    "Yazır",
  ],
  Akseki: [
    "Akseki Merkez",
    "Çimi",
    "Gedikbaşı",
    "Naldöken",
  ],
  Gündoğmuş: [
    "Gündoğmuş Merkez",
    "Kızılcadağ",
    "Ortaköy",
    "Sarıot",
  ],
  İbradı: [
    "İbradı Merkez",
    "Gidengelmez",
    "Kırkpınar",
  ],
  Gazipaşa: [
    "Gazipaşa Merkez",
    "Kaledran",
    "Konakpınar",
    "Bıçkıcı",
  ],
};
