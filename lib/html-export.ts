import type { PitchKit } from "./contracts";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]!));

const safeHref = (url: string) => {
  try { const parsed = new URL(url); return parsed.protocol === "https:" ? escapeHtml(parsed.href) : "#"; }
  catch { return "#"; }
};

export function renderPitchHtml(kit: PitchKit) {
  const sections = kit.presentation.map((section, index) => `<section><span>${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></section>`).join("");
  const sources = kit.alternatives.map((item) => `<li><a href="${safeHref(item.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)} — ${escapeHtml(item.source.title)}</a></li>`).join("");
  const fallback = kit.fallback ? `<aside>Demo example — not live research</aside>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(kit.title)}</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#07110e;color:#f6f4e8;font:20px/1.55 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:8vw 6vw}header{min-height:70vh;display:grid;align-content:center;border-bottom:1px solid #365148}h1{font-size:clamp(3rem,9vw,7rem);line-height:.92;margin:.2em 0;color:#f4d35e}h2{font-size:clamp(2rem,5vw,4.5rem);line-height:1;margin:.3em 0}header p{font-size:clamp(1.4rem,3vw,2.2rem)}section{min-height:72vh;display:grid;align-content:center;padding:8vh 0;border-bottom:1px solid #365148}section span{color:#79d6ad;font:700 1rem monospace;letter-spacing:.12em}section p{max-width:760px;font-size:clamp(1.25rem,2.4vw,1.8rem)}a{color:#79d6ad}footer{padding:8vh 0;font-size:.9rem;color:#adc2b9}aside{position:fixed;top:1rem;right:1rem;padding:.6rem 1rem;background:#f4d35e;color:#07110e;font-weight:700;border-radius:99px}@media print{body{background:#fff;color:#111}section{min-height:auto;page-break-inside:avoid}a{color:#0645ad}aside{position:static}}
  </style></head><body>${fallback}<main><header><small>Pitch Prep</small><h1>${escapeHtml(kit.title)}</h1><p>${escapeHtml(kit.tagline)}</p></header>${sections}<footer><h2>Research sources</h2><ul>${sources || "<li>No credible alternatives were returned.</li>"}</ul><p>Research links generated on ${escapeHtml(new Date(kit.generatedAt).toLocaleDateString("en-CA"))}. Treat this as a starting point and verify important claims.</p></footer></main></body></html>`;
}

export function downloadPitchHtml(kit: PitchKit) {
  const blob = new Blob([renderPitchHtml(kit)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${kit.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pitch"}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
