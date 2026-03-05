import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "Hakkımızda — AREP Gayrimenkul",
  description:
    "AREP olarak Antalya gayrimenkul pazarında güven, şeffaflık ve uzmanlıkla hizmet veriyoruz.",
};

export default function AboutPage() {
  return <AboutContent />;
}
