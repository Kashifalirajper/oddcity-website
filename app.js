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

// ================================================================ motion layer (v2)
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const hero = document.querySelector(".hero");
const drift = [...document.querySelectorAll(".district .dn")];

// Hero parallax + districts drifting inside their frames (transform only, one rAF with the clock).
function parallax() {
  if (reduce) return;
  if (hero) {
    const h = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
    root.style.setProperty("--hero", h.toFixed(3));
  }
  const vh = innerHeight;
  for (const el of drift) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const t = (r.top + r.height / 2 - vh / 2) / vh;   // -1..1 around the screen centre
    el.style.setProperty("--py", (t * -34).toFixed(1) + "px");
  }
}
addEventListener("scroll", () => requestAnimationFrame(parallax), { passive: true });
parallax();

// Headings: split into words that rise in turn (text stays one heading for screen readers).
document.querySelectorAll(".sec-head h2, .midnight h2").forEach((h) => {
  h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
        const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
        w.append(inner); frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
  });
  walk(h);
  h.classList.add("words");
  if (!h.closest("[data-reveal]")) (io ? io.observe(h) : h.classList.add("in"));
});
document.querySelectorAll(".stagger").forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty("--i", i)));

// Gameplay loops: load + play only while on screen; never autoplay with reduced motion.
const loops = [...document.querySelectorAll("video.loop")];
if ("IntersectionObserver" in window) {
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) { v.src = v.dataset.src; }
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  }), { threshold: 0.35 });
  loops.forEach((v) => vio.observe(v));
}
loops.forEach((v) => v.addEventListener("click", () => (v.paused ? v.play() : v.pause())));
document.addEventListener("visibilitychange", () => { if (document.hidden) loops.forEach((v) => v.pause()); });

// Tap anywhere: a burst of the game's coins, stars and hearts.
const layer = document.querySelector(".bursts");
const BITS = [
  ["#ffd166", '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffd166"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#b8860b" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#b8860b" font-family="Barlow,Arial">$</text></svg>'],
  ["#8d7ef2", '<svg viewBox="0 0 24 24"><path fill="#8d7ef2" d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7L12 2Z"/></svg>'],
  ["#ff7a7a", '<svg viewBox="0 0 24 24"><path fill="#ff7a7a" d="M12 21s-7.5-4.6-9.4-9.3C1.3 8.3 3.4 4.5 7 4.5c2 0 3.5 1.1 5 2.9 1.5-1.8 3-2.9 5-2.9 3.6 0 5.7 3.8 4.4 7.2C19.5 16.4 12 21 12 21Z"/></svg>'],
  ["#36d6c7", '<svg viewBox="0 0 24 24"><path fill="#36d6c7" d="M12 1.5c.6 4.8 3.7 7.9 8.5 8.5-4.8.6-7.9 3.7-8.5 8.5-.6-4.8-3.7-7.9-8.5-8.5 4.8-.6 7.9-3.7 8.5-8.5Z"/></svg>'],
];
let live = 0;
function burst(x, y, count = 9, spread = 1) {
  if (reduce || !layer || live > 40) return;
  const ring = document.createElement("span");
  ring.className = "ring"; ring.style.setProperty("--x0", x + "px"); ring.style.setProperty("--y0", y + "px");
  ring.addEventListener("animationend", () => ring.remove()); layer.append(ring);
  for (let i = 0; i < count; i++) {
    const [, svg] = BITS[(Math.random() * BITS.length) | 0];
    const b = document.createElement("span");
    b.className = "bit"; b.innerHTML = svg;
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.6, d = (60 + Math.random() * 70) * spread;
    b.style.setProperty("--x0", x + "px"); b.style.setProperty("--y0", y + "px");
    b.style.setProperty("--x1", x + Math.cos(a) * d + "px"); b.style.setProperty("--y1", y + Math.sin(a) * d - 30 * spread + "px");
    b.style.setProperty("--r", (Math.random() * 360 - 180) + "deg"); b.style.setProperty("--s", (0.7 + Math.random() * 0.6).toFixed(2));
    live++; b.addEventListener("animationend", () => { b.remove(); live--; });
    layer.append(b);
  }
}
addEventListener("pointerdown", (e) => {
  const t = e.target instanceof Element ? e.target : document.body;
  if (e.button !== 0 || t.closest("video, input, textarea, select")) return;
  burst(e.clientX, e.clientY, t.closest("a, button") ? 7 : 9);
}, { passive: true });

// Resident cards: flip + confetti on reveal.
document.querySelectorAll(".res button").forEach((b) => b.addEventListener("click", () => {
  const card = b.closest(".res");
  card.classList.remove("flip"); void card.offsetWidth; card.classList.add("flip");
  if (card.classList.contains("open")) { const r = card.getBoundingClientRect(); setTimeout(() => burst(r.left + r.width / 2, r.top + r.height * 0.45, 14, 1.5), 300); }
}));

// Tilt + cursor glow on cards (mouse only).
if (fine && !reduce) {
  document.querySelectorAll(".res, .feat, .shot, .district .dn").forEach((el) => {
    el.classList.add("tilt");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
      el.style.setProperty("--glow-x", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--glow-y", (y * 100).toFixed(1) + "%");
    });
    el.addEventListener("pointerleave", () => { el.classList.remove("tilting"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });
}
