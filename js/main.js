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

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--fg)]">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[11px] text-[var(--accent)] bg-black/40 px-1.5 py-0.5 border border-[var(--border)]">$1</code>');
}

// Renders the changelog as an array of per-version sections. Each section is
// split on a `## [version]` heading (or `## [Unreleased]`, which is skipped)
// and carries the version title and its body HTML separately so the caller can
// render one card per release.
function renderSections(text) {
  if (!text) return [];
  text = text.replace(/^\uFEFF/, "");
  const lines = text.split("\n");
  const sections = [];
  let current = null;
  let list = [];
  const flushList = () => {
    if (current && list.length) {
      current.body += '<ul class="space-y-2 mb-4">' + list.join("") + "</ul>";
      list = [];
    }
  };
  const closeSection = () => {
    flushList();
    current = null;
  };
  let started = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { continue; }
    const versionHeading = line.match(/^##\s+(.*)/);
    if (versionHeading && /^\[.*?\]/.test(versionHeading[1].trim())) {
      const title = versionHeading[1].trim();
      if (/^\[?Unreleased\]?/.test(title)) {
        closeSection();
        started = true;
        continue;
      }
      closeSection();
      current = { title, body: "" };
      sections.push(current);
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^\[[^\]]+\]:\s+https?:/.test(line)) continue;
    const h = line.match(/^#{1,3}\s+(.*)/);
    if (h) { flushList(); if (current) current.body += `<h4 class="font-display text-xl text-[var(--fg)] mb-3 mt-4">${inline(h[1])}</h4>`; continue; }
    const bullet = line.match(/^(\s*)[-*]\s+(.*)/);
    if (bullet) {
      // Sub-bullets (indented "- item" lines) render as nested items instead
      // of leaking the raw "-" into a paragraph.
      const sub = bullet[1].length >= 2;
      const marker = sub ? "\u2022" : "\u2014";
      list.push(`<li class="flex gap-2 text-sm leading-relaxed text-[var(--fg-dim)] ${sub ? "pl-5" : ""}"><span class="text-[var(--accent)] mt-1.5">${marker}</span><span>${inline(bullet[2])}</span></li>`);
      continue;
    }
    flushList();
    if (current) current.body += `<p class="text-sm leading-relaxed text-[var(--fg-dim)] mb-2">${inline(line)}</p>`;
  }
  closeSection();
  return sections;
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

    const sections = renderSections(data.changelog || data.notes);
    if (sections.length) {
      const cards = sections
        .map(
          (s, i) => `<article class="info-card p-6 md:p-7" data-idx="${i}">
             <div class="release-head mb-4">
               <span class="font-display text-3xl md:text-4xl text-[var(--fg)] leading-none">${inline(s.title)}</span>
             </div>
             <div class="release-card-body">${s.body}</div>
             <button class="release-toggle" hidden>See more</button>
           </article>`,
        )
        .join("");
      releases.innerHTML = cards;
      releases.querySelectorAll("article").forEach((card) => {
        const body = card.querySelector(".release-card-body");
        const toggle = card.querySelector(".release-toggle");
        const MAX_HEIGHT = 520;
        if (body.scrollHeight > MAX_HEIGHT) {
          body.style.maxHeight = MAX_HEIGHT + "px";
          body.style.overflow = "hidden";
          toggle.hidden = false;
          toggle.addEventListener("click", () => {
            const collapsed = body.style.maxHeight && body.style.maxHeight !== "none";
            if (collapsed) {
              body.style.maxHeight = "none";
              toggle.textContent = "See less";
            } else {
              body.style.maxHeight = MAX_HEIGHT + "px";
              toggle.textContent = "See more";
            }
          });
        }
      });
    } else {
      releases.innerHTML = '<p class="text-sm text-[var(--fg-dim)]">No changelog available.</p>';
    }
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