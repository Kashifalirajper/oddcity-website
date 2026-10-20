// ODDCITY — the page clock. Scrolling the page moves the city from 12:00 PM to 12:00 AM;
// --night (0..1) crossfades every day/night picture pair; the clock pill shows the time.
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = document.querySelector("[data-clock]");
const clockText = clock && clock.querySelector(".time");
const hud = document.querySelector(".hud");
let ticking = false, lastMin = -1;

function frame() {
  ticking = false;
  const max = root.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  const minutes = Math.round(p * 720);                  // 12 hours of city time
  // Night falls between 5 PM and 8 PM (game: sunset, then neon).
  let n = Math.min(1, Math.max(0, (minutes - 300) / 180));
  n = n * n * (3 - 2 * n);
  if (reduce) n = n > 0.5 ? 1 : 0;                      // no slow fade, same information
  root.style.setProperty("--night", n.toFixed(3));
  root.style.setProperty("--progress", p.toFixed(3));
  if (hud) hud.classList.toggle("solid", scrollY > 40);
  if (clockText && minutes !== lastMin) {
    lastMin = minutes;
    const h24 = 12 + Math.floor(minutes / 60), m = minutes % 60;
    const h12 = ((h24 + 11) % 12) + 1, ampm = h24 % 24 < 12 ? "AM" : "PM";
    clockText.textContent = h12 + ":" + String(m - (m % 5)).padStart(2, "0") + " " + ampm;
  }
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
addEventListener("resize", frame);
frame();

// Night pictures only download once the evening is near (keeps the first view light).
const nights = [...document.querySelectorAll("img[data-night]")];
function wakeNights() {
  if (parseFloat(root.style.getPropertyValue("--progress")) < 0.05) return;
  nights.forEach((img) => { img.srcset = img.dataset.night; delete img.dataset.night; });
  const pics = document.querySelectorAll("source[data-night]");
  pics.forEach((s) => { s.srcset = s.dataset.night; delete s.dataset.night; });
  removeEventListener("scroll", wakeNights);
}
addEventListener("scroll", wakeNights, { passive: true });

// One reveal for groups, once.
const io = "IntersectionObserver" in window && !reduce
  ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" })
  : null;
document.querySelectorAll("[data-reveal]").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

// Residents: tap to reveal a real secret from the game.
document.querySelectorAll(".res button").forEach((b) => {
  b.addEventListener("click", () => {
    const card = b.closest(".res"), open = !card.classList.contains("open");
    card.classList.toggle("open", open);
    b.setAttribute("aria-expanded", open);
    b.textContent = open ? "Hide secret" : "Reveal secret";
    card.querySelector(".hidden-secret").setAttribute("aria-hidden", !open);
  });
});

// Nav: mark the section in view.
const links = [...document.querySelectorAll(".nav a")];
if ("IntersectionObserver" in window && links.length) {
  const nio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.setAttribute("aria-current", a.hash === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => { const s = document.querySelector(a.hash); if (s) nio.observe(s); });
}
