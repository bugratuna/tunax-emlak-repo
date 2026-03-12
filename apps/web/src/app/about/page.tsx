import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "Hakkımızda — Realty Tunax Gayrimenkul",
  description:
    "Realty Tunax olarak Antalya gayrimenkul pazarında güven, şeffaflık ve uzmanlıkla hizmet veriyoruz.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
