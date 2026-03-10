import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "Hakkımızda — AREP Gayrimenkul",
  description:
    "AREP olarak Antalya gayrimenkul pazarında güven, şeffaflık ve uzmanlıkla hizmet veriyoruz.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
