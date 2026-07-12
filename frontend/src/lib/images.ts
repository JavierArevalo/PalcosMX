/**
 * Seeded stadiums don't carry photos, so listings resolve an image from the
 * stadium name. Unknown venues fall back to the Monterrey photo.
 */
const IMAGE_BY_KEYWORD: Array<[RegExp, string]> = [
  [/azteca/i, "/images/venue-1.webp"],
  [/monterrey/i, "/images/monterrey-stadium.webp"],
  [/jalisco|guadalajara/i, "/images/venue-2.webp"],
];

export function stadiumImage(stadiumName: string): string {
  for (const [pattern, src] of IMAGE_BY_KEYWORD) {
    if (pattern.test(stadiumName)) return src;
  }
  return "/images/venue-3.webp";
}
