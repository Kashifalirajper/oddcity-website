// fx: game cursor ring + living sky layer. Mouse-only cursor; touch keeps the system behaviour.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Living background (behind everything).
  const sky = document.createElement("div");
  sky.className = "sky"; sky.setAttribute("aria-hidden", "true");
  sky.innerHTML = '<i class="glow g1"></i><i class="glow g2"></i><i class="glow g3"></i><i class="glow g4"></i><i class="stars"></i><i class="grain"></i>';
  document.body.prepend(sky);

  // Staggered children reveal one by one as each reaches the screen.
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".stagger > *").forEach((c) => io.observe(c));
  }

  if (!fine) return;
  document.documentElement.classList.add("gc");
  if (reduce) return;
  const ring = document.createElement("div");
  ring.className = "cursor-ring"; ring.setAttribute("aria-hidden", "true");
  document.body.append(ring);
  let x = -100, y = -100, raf = 0;
  const paint = () => { raf = 0; ring.style.setProperty("--cx", x + "px"); ring.style.setProperty("--cy", y + "px"); };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    ring.classList.add("on");
    ring.classList.toggle("hot", !!(e.target instanceof Element && e.target.closest("a, button, video, .res, .district")));
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  addEventListener("pointerdown", () => ring.classList.add("down"), { passive: true });
  addEventListener("pointerup", () => ring.classList.remove("down"), { passive: true });
  document.addEventListener("pointerleave", () => ring.classList.remove("on"));
})();
