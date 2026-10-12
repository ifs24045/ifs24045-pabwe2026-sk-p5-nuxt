/**
 * Membuat stylesheet bawaan build Nuxt (/_nuxt/*.css) tidak memblokir render.
 * Aplikasi ini SPA (ssr: false): body baru berisi konten setelah JS berjalan,
 * jadi menunda CSS tidak menyebabkan flash konten tanpa gaya, tetapi
 * menghilangkan peringatan Lighthouse "Render blocking requests".
 */
const CSS_LINK = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\/_nuxt\/[^"]+\.css)"[^>]*>/g;

export function deferNuxtCss(html: string): string {
  return html.replace(CSS_LINK, (tag, href: string) => {
    if (tag.includes("media=")) return tag;
    const crossorigin = tag.includes("crossorigin") ? " crossorigin" : "";
    return (
      `<link rel="stylesheet" href="${href}"${crossorigin} media="print" onload="this.media='all'">` +
      `<noscript><link rel="stylesheet" href="${href}"${crossorigin}></noscript>`
    );
  });
}