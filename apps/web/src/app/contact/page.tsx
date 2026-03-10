import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "İletişim — AREP Gayrimenkul",
  description:
    "AREP Gayrimenkul ile iletişime geçin. Antalya'daki uzman danışmanlarımız size yardımcı olmaya hazır.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
