import { describe, expect, it } from "vitest";
import { responsiveImage } from "./images";

const cover = "/api/public/media/128a8c87-8c36-4433-a5ae-6f945e919a55.png";
const encoded = "%2Fapi%2Fpublic%2Fmedia%2F128a8c87-8c36-4433-a5ae-6f945e919a55.png";

describe("responsiveImage", () => {
  it("shouldOfferEveryConfiguredWidth_throughTheOptimizer", () => {
    expect(responsiveImage(cover)?.srcSet).toBe(
      [480, 720, 1080, 1440]
        .map((w) => `/_next/image?url=${encoded}&w=${String(w)}&q=75 ${String(w)}w`)
        .join(", "),
    );
  });

  it("shouldSizeToTheArticleColumn", () => {
    expect(responsiveImage(cover)?.sizes).toBe("(min-width: 748px) 700px, calc(100vw - 48px)");
  });

  it("shouldLeaveOtherImagesAlone", () => {
    // The optimizer would answer 400 for these (localPatterns), so they keep their plain src
    expect(responsiveImage("https://example.com/photo.png")).toBeNull();
    expect(responsiveImage(`${cover}?v=2`)).toBeNull();
    expect(responsiveImage("/icon")).toBeNull();
    expect(responsiveImage(undefined)).toBeNull();
  });
});
