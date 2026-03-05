"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const teamMembers = [
  {
    name: "İsmail Tuna",
    role: "Gayrimenkul Danışmanı",
    bio: "Müşteri ilişkileri ve pazarlama stratejileri konusundaki gücüyle Realty Tunax'ın vizyonunu sahaya yansıtmaktadır. Teknolojiyi kullanarak mülklerinizi en geniş kitlelere ulaştırma konusunda yenilikçi çözümler sunar.",
    image:
      "https://image5.sahibinden.com/users/26/40/67/p200_profile_96264067_3278857.jpg",
    social: {
      email: "mailto:ismail.tuna@realtytunax.com",
    },
  },
  {
    name: "Recep Tuna",
    role: "Ofis Sahibi (Broker)",
    bio: "Emlak ve Emlak Yönetimi alanındaki akademik bilgisi ve saha tecrübesiyle, müşterilerimize en doğru yatırım kararlarını almaları için rehberlik etmektedir. Kentsel dönüşüm ve piyasa analizi konularında uzmandır.",
    image:
      "https://image5.sahibinden.com/users/22/79/62/p200_profile_96227962_8723476.jpg",
    social: {
      email: "mailto:recep.tuna@realtytunax.com",
    },
  },
];

export function AboutContent() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-6 py-16"
    >
      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary">Hakkımızda</h1>
        <p className="text-gray-600 mt-2">Bizi daha yakından tanıyın.</p>
      </div>

      {/* Intro block */}
      <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 rounded-lg shadow-lg">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about-us.png"
            alt="Realty Tunax Ekibi"
            className="rounded-lg shadow-md w-full"
          />
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Realty Tunax&apos;a Hoş Geldiniz
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            2025 yılında, Akdeniz&apos;in incisi Antalya&apos;da gayrimenkul
            sektörüne yeni bir soluk ve dinamik bir bakış açısı getirme
            hedefiyle yola çıktık. Realty Tunax olarak, şehrin en merkezi ve
            değerli lokasyonlarından biri olan Meltem&apos;de, sektörün
            geleceğini şekillendiren yenilikçi hizmet anlayışımızla
            faaliyetlerimize başladık. Bizler, İsmail Tuna ve Recep Tuna, ortak
            bir vizyon ve gayrimenkule duyduğumuz tutkuyla, sizlere sadece bir
            mülk değil, doğru bir gelecek yatırımı sunmak için buradayız.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Temel prensibimiz, müşteri memnuniyetini en üst düzeyde tutarak,
            uzun soluklu ve güvene dayalı ilişkiler kurmaktır. Realty Tunax
            olarak, hayallerinizdeki eve veya doğru yatırım fırsatına ulaşmanız
            için buradayız.
          </p>
        </motion.div>
      </div>

      {/* Team heading */}
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Ekibimizle Tanışın
        </h2>
        <p className="text-gray-600 mt-2 mb-12">
          Başarımızın arkasındaki yüzler.
        </p>
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {teamMembers.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="bg-white rounded-lg shadow-lg text-center p-8 border border-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.image}
              alt={member.name}
              className="w-40 h-40 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
            />
            <h3 className="text-2xl font-semibold text-primary">
              {member.name}
            </h3>
            <p className="text-secondary font-medium mb-3">{member.role}</p>
            <p className="text-gray-600 mb-4">{member.bio}</p>
            <div className="flex justify-center space-x-4">
              <a
                href={member.social.email}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Mail size={24} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
