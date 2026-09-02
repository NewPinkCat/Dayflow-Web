const UPDATES_URL = "https://updates.caoquanganh.net/latest.json";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function loadLatest() {
  const btn = document.getElementById("downloadBtn");
  const version = document.getElementById("versionBadge");
  const size = document.getElementById("sizeBadge");
  const date = document.getElementById("dateBadge");
  try {
    const res = await fetch(UPDATES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const win = data.platforms && data.platforms["windows-x86_64"];
    if (!win) throw new Error("no windows asset");
    btn.href = win.url;
    version.textContent = `VERSION ${data.version}`;
    date.textContent = formatDate(data.pub_date);
  } catch {
    version.textContent = "CHECK LATEST BUILD";
  }
}

document.getElementById("year").textContent = new Date().getFullYear();
loadLatest();

/* Update notes placeholder until public source is wired up */
document.getElementById("releases").innerHTML =
  '<p class="text-sm text-[var(--fg-dim)] max-w-lg">Update notes will appear here when a public changelog source is connected.</p>';

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