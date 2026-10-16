import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl } from "@/lib/youtube";

const E = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0";

describe("youtubeEmbedUrl", () => {
  it("accepts watch links", () => expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5")).toBe(E));
  it("accepts youtu.be links", () => expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=x")).toBe(E));
  it("accepts shorts links", () => expect(youtubeEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(E));
  it("rejects other hosts", () => expect(youtubeEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull());
  it("rejects lookalike hosts", () => expect(youtubeEmbedUrl("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull());
  it("rejects bad ids", () => expect(youtubeEmbedUrl("https://youtu.be/abc\"><script>")).toBeNull());
  it("rejects javascript urls", () => expect(youtubeEmbedUrl("javascript:alert(1)")).toBeNull());
});
