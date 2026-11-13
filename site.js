// ODDCITY site services, switched on by /site-config.js:
// - Google Analytics 4 on every page (+ events from the web game: game_loaded, match_start, match_end, ad_reward_earned).
// - Google AdSense; on /play also the games "Ad Placement API" (rewarded ads + a between-match ad), used by WebAds.cs.
(() => {
  const cfg = window.ODDCITY || {};
  const add = (src, attrs) => {
    const s = document.createElement("script");
    s.async = true; s.src = src;
    Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (cfg.ga) {
    add("https://www.googletagmanager.com/gtag/js?id=" + cfg.ga);
    gtag("js", new Date());
    gtag("config", cfg.ga);
  }
  window.oddcityTrack = (name, params) => { if (cfg.ga) gtag("event", name, params || {}); };

  if (!cfg.adsense) return;
  const attrs = { "data-ad-client": cfg.adsense, crossorigin: "anonymous" };
  if (cfg.adsTest) attrs["data-adbreak-test"] = "on";
  add("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + cfg.adsense, attrs);
  if (!location.pathname.startsWith("/play")) return;

  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = (o) => window.adsbygoogle.push(o);
  window.adConfig({ preloadAdBreaks: "on", sound: "on" });
  window.oddcityAds = {
    ready: true,
    // kind "reward": done(true) only when the ad was watched to the end. kind "next": between matches, done(true) always.
    show(kind, done) {
      let viewed = false, over = false;
      const end = (ok) => { if (!over) { over = true; done(ok); } };
      const o = { type: kind, name: kind === "reward" ? "reward" : "between_matches", adBreakDone: () => end(kind === "reward" ? viewed : true) };
      if (kind === "reward") Object.assign(o, { beforeReward: (showAd) => showAd(), adViewed: () => { viewed = true; }, adDismissed: () => {} });
      window.adBreak(o);
      setTimeout(() => end(kind === "reward" ? viewed : true), 90000);   // never leave the game paused
    },
  };
})();
