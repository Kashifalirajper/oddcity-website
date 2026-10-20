// Section films: each district has a day + night film of the same camera move. The scroll clock (--night)
// crossfades them; only the film(s) you can actually see decode (both only during the sunset blend),
// and only while the district is on screen. Chase cam + midnight use video.loop handling in app.js.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const films = [...document.querySelectorAll("[data-film]")];
  if (!films.length || !("IntersectionObserver" in window)) return;
  const onScreen = new Set();

  const night = () => parseFloat(root.style.getPropertyValue("--night")) || 0;
  function want(v, on) {
    if (on) {
      if (!v.src) v.src = v.dataset.src;
      if (v.paused && !reduce) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }
  function update(film) {
    const [day, nightV] = film.querySelectorAll("video");
    const n = night(), vis = onScreen.has(film);
    want(day, vis && n < 0.97);
    want(nightV, vis && n > 0.03);
    if (!day.paused && !nightV.paused && Math.abs(nightV.currentTime - day.currentTime) > 0.08) nightV.currentTime = day.currentTime;
    if (nightV.paused && !day.paused) nightV.currentTime = day.currentTime;   // ready on the same frame for the blend
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target);
    update(e.target);
  }), { rootMargin: "80px 0px", threshold: 0.1 });
  films.forEach((f) => io.observe(f));

  let t = 0;
  addEventListener("scroll", () => { if (!t) t = requestAnimationFrame(() => { t = 0; onScreen.forEach(update); }); }, { passive: true });
  setInterval(() => onScreen.forEach(update), 700);   // drift correction
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) films.forEach((f) => f.querySelectorAll("video").forEach((v) => v.pause()));
    else onScreen.forEach(update);
  });
})();
