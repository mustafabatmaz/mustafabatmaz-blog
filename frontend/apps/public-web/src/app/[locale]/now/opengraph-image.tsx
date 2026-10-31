import { ogSize } from "@/lib/og";
import { messagePageCard, ogContentType } from "@/lib/ogPages";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Mustafa Batmaz";

export default function Image({ params }: { params: Promise<{ locale: string }> }) {
  return messagePageCard(params, "/now", "nav.now", "now.subtitle");
}
