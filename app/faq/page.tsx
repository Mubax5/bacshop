import type { Metadata } from "next";
import { FaqSurface } from "@/ui/commerce/public-pages";

export const metadata: Metadata = { title: "Pertanyaan umum" };
export default function FaqPage() { return <FaqSurface />; }
