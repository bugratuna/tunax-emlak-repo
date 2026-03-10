"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const FORM_ENDPOINT = "https://formspree.io/f/xnnbljkb";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormStatus = "" | "sending" | "success" | "error";

export function ContactContent() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<FormStatus>("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white text-gray-800 py-16"
    >
      <div className="container mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-primary tracking-wide"
          >
            Bize Ulaşın
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 mt-4 text-lg"
          >
            Gayrimenkul hedeflerinizi birlikte gerçekleştirelim.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="bg-gray-50 p-8 rounded-xl shadow-lg border border-gray-200"
          >
            <h2 className="text-2xl font-semibold mb-6 text-primary">
              Mesaj Gönderin
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="font-medium text-gray-700">
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Adınız Soyadınız"
                  className="mt-2 block w-full bg-white border-2 border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                />
              </div>
              <div>
                <label htmlFor="email" className="font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="eposta@adresiniz.com"
                  className="mt-2 block w-full bg-white border-2 border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Konu
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Konu"
                  className="mt-2 block w-full bg-white border-2 border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                />
              </div>
              <div>
                <label htmlFor="message" className="font-medium text-gray-700">
                  Mesajınız
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="mt-2 block w-full bg-white border-2 border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={formStatus === "sending"}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send className="w-5 h-5 mr-3" />
                {formStatus === "sending" ? "Gönderiliyor..." : "Gönder"}
              </button>
              {formStatus === "success" && (
                <p className="text-green-600 text-sm font-semibold">
                  Mesajınız başarıyla gönderildi!
                </p>
              )}
              {formStatus === "error" && (
                <p className="text-red-600 text-sm font-semibold">
                  Mesaj gönderilirken bir hata oluştu. Lütfen tüm alanları
                  doldurun.
                </p>
              )}
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="space-y-8"
          >
            {/* Address */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-200 flex items-start space-x-4">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Realty+Tunax+G%C3%BCvenlik,+Derya+Cd.+Lidya+park+apt+No:20/b,+07230+Muratpa%C5%9Fa/Antalya"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-100 p-3 rounded-full flex-shrink-0"
              >
                <MapPin className="w-6 h-6 text-primary" />
              </a>
              <div>
                <h3 className="font-semibold text-lg text-primary">Adres</h3>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Realty+Tunax+G%C3%BCvenlik,+Derya+Cd.+Lidya+park+apt+No:20/b,+07230+Muratpa%C5%9Fa/Antalya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary transition-colors duration-300"
                >
                  Kütükçü, Şelale Cd. No:123 D:117, 07080, 07000
                  Kepez/Antalya
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-200 flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary">Telefon</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-sm">İsmail Tuna</p>
                  <a
                    href="tel:+905530842270"
                    className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    +90 553 084 22 70
                  </a>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-sm">Ertuğrul Uygun</p>
                  <a
                    href="tel:+905367259510"
                    className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    +90 553 336 23 74
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-200 flex items-start space-x-4">
              <a
                href="mailto:ismail.tuna@realtytunax.com"
                className="bg-blue-100 p-3 rounded-full flex-shrink-0"
              >
                <Mail className="w-6 h-6 text-primary" />
              </a>
              <div>
                <h3 className="font-semibold text-lg text-primary">E-posta</h3>
                <a
                  href="mailto:ismail.tuna@realtytunax.com"
                  className="text-gray-600 hover:text-primary transition-colors duration-300"
                >
                  ismail.tuna@realtytunax.com
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="w-full h-80 rounded-xl overflow-hidden shadow-lg border-4 border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d547.9825604473741!2d30.688246430127247!3d36.89775863776394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c38fac7ca31347%3A0x8949b9f942d8394!2sRealty%20Tunax%20%7C%20Yeni%20Nesil%20Gayrimenkul!5e0!3m2!1str!2str!4v1757186353728!5m2!1str!2str"
                title="Ofis Konumu"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
