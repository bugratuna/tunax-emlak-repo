import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "İletişim — Realty Tunax Gayrimenkul",
  description:
    "Realty Tunax Gayrimenkul ile iletişime geçin. Antalya'daki uzman danışmanlarımız size yardımcı olmaya hazır.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
