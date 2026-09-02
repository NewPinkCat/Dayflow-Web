const UPDATES_URL = "https://updates.caoquanganh.net/latest.json";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let list = [];
  const flushList = () => {
    if (list.length) {
      out.push('<ul class="space-y-2 mb-4">' + list.join("") + "</ul>");
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { flushList(); continue; }
    const h = line.match(/^#{1,3}\s+(.*)/);
    if (h) { flushList(); out.push(`<h4 class="font-display text-2xl text-[var(--fg)] mb-3 mt-5">${escapeHtml(h[1])}</h4>`); continue; }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) { list.push(`<li class="flex gap-2 text-sm leading-relaxed text-[var(--fg-dim)]"><span class="text-[var(--accent)] mt-1.5">—</span><span>${escapeHtml(bullet[1])}</span></li>`); continue; }
    flushList();
    out.push(`<p class="text-sm leading-relaxed text-[var(--fg-dim)] mb-2">${escapeHtml(line)}</p>`);
  }
  flushList();
  return out.join("");
}

async function loadLatest() {
  const btn = document.getElementById("downloadBtn");
  const version = document.getElementById("versionBadge");
  const date = document.getElementById("dateBadge");
  const releases = document.getElementById("releases");
  try {
    const res = await fetch(UPDATES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const win = data.platforms && data.platforms["windows-x86_64"];
    if (!win) throw new Error("no windows asset");
    btn.href = win.url;
    version.textContent = `VERSION ${data.version}`;
    date.textContent = formatDate(data.pub_date);

    const html = renderMarkdown(data.changelog || data.notes);
    releases.innerHTML = html
      ? `<article class="release info-card p-6 md:p-7">
           <div class="flex items-baseline justify-between gap-4 mb-4">
             <span class="font-display text-3xl md:text-4xl text-[var(--fg)] leading-none">${escapeHtml(data.version)}</span>
             <span class="dl-meta text-[var(--muted)]">${formatDate(data.pub_date)}</span>
           </div>
           ${html}</article>`
      : '<p class="text-sm text-[var(--fg-dim)]">No changelog available.</p>';
  } catch {
    version.textContent = "CHECK LATEST BUILD";
    releases.innerHTML =
      '<p class="text-sm text-[var(--fg-dim)]">Could not load update notes.</p>';
  }
}

document.getElementById("year").textContent = new Date().getFullYear();
loadLatest();

/* Reveal on scroll */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => revealObserver.observe(el));

/* Grain parallax */
const grain = document.getElementById("grain");
let targetGrainY = 0;
let currentGrainY = 0;
window.addEventListener("scroll", () => { targetGrainY = window.scrollY * 0.15; }, { passive: true });
function animateGrain() {
  currentGrainY += (targetGrainY - currentGrainY) * 0.08;
  grain.style.transform = `translateY(${currentGrainY}px)`;
  requestAnimationFrame(animateGrain);
}
animateGrain();