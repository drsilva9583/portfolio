/* Inner-page animation layer (experience / education / contact).
   scripts.js stays the shared baseline (nav, touchline, year, scroll-to-top);
   index.html keeps its own index-animations.js. Without JS, a blocked CDN,
   or reduced motion, every page is a complete static design — everything
   here is enhancement only. */
(function () {
    "use strict";

    var REDUCED =
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        /[?&]nomotion/.test(location.search);
    var FINE = matchMedia("(pointer: fine)").matches;
    var hasGsap =
        typeof window.gsap !== "undefined" &&
        typeof window.ScrollTrigger !== "undefined";

    function releaseIntro() {
        clearTimeout(window.__introSafety);
        document.documentElement.classList.remove("intro");
    }

    /* ─────────────────────────────────────────────────────────────
       Statline count-ups — same behavior as the homepage, plus a
       data-decimals hook for fractional values (e.g. a 3.6 GPA).
       ───────────────────────────────────────────────────────────── */
    function countUps() {
        document.querySelectorAll(".statline dd").forEach(function (dd) {
            var end = parseFloat(dd.getAttribute("data-count"));
            if (isNaN(end)) return;
            var prefix = dd.getAttribute("data-prefix") || "";
            var suffix = dd.getAttribute("data-suffix") || "";
            var comma = dd.getAttribute("data-format") === "comma";
            var decimals = parseInt(dd.getAttribute("data-decimals") || "0", 10);
            var obj = { v: 0 };
            function render() {
                var s;
                if (decimals > 0) {
                    s = obj.v.toFixed(decimals);
                } else {
                    var n = Math.round(obj.v);
                    s = comma ? n.toLocaleString("en-US") : String(n);
                }
                dd.textContent = prefix + s + suffix;
            }
            render();
            gsap.to(obj, {
                v: end,
                duration: 1.7,
                ease: "power2.out",
                scrollTrigger: { trigger: dd, start: "top 88%" },
                onUpdate: render
            });
        });
    }

    /* ─────────────────────────────────────────────────────────────
       Static path (no GSAP / reduced motion): show everything now.
       Count values already sit in the HTML, so nothing to compute.
       ───────────────────────────────────────────────────────────── */
    if (REDUCED || !hasGsap) {
        releaseIntro();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* Page intro — kinetic title played forward, then sub + live signal */
    var introChars = document.querySelectorAll(".page-intro-title .ch");
    var intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (introChars.length) {
        intro.from(".page-intro-title .ch", {
            opacity: 0,
            yPercent: 45,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.04
        });
    } else if (document.querySelector(".page-intro-title")) {
        intro.from(".page-intro-title", { opacity: 0, y: 26, duration: 0.85 });
    }
    intro.from([".page-intro .sec-sub", ".page-intro-live"], {
        opacity: 0, y: 20, duration: 0.6, stagger: 0.12
    }, "-=0.4");
    releaseIntro(); /* GSAP inline styles own the intro now */

    /* Section headings rise in */
    gsap.utils.toArray(".sec-title").forEach(function (el) {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: "top 85%" },
            y: 24, opacity: 0, duration: 0.7, ease: "power3.out"
        });
    });

    /* Experience rows — rule draws across like a pass, title curves in,
       meta / bullets / tech / statline stagger up behind it */
    gsap.utils.toArray(".exp-row").forEach(function (row) {
        var tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 82%" } });
        var rule = row.querySelector(".spotlight-rule");
        if (rule) {
            tl.from(rule, {
                scaleX: 0,
                transformOrigin: "left center",
                duration: 0.9,
                ease: "power3.inOut"
            });
        }
        tl.from(row.querySelector(".exp-title"), {
            x: -38, y: 22, rotation: -1.2, opacity: 0,
            duration: 0.8, ease: "power3.out"
        }, 0.12)
        .from(row.querySelectorAll(".exp-meta > *, .exp-points li, .exp-tech, .statline > div"), {
            y: 18, opacity: 0, duration: 0.55, stagger: 0.06, ease: "power2.out"
        }, 0.28);
    });

    /* Cards (education) drift up as they cross the viewport */
    gsap.utils.toArray(".reveal-card").forEach(function (card) {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: "top 84%" },
            y: 28, opacity: 0, duration: 0.7, ease: "power3.out"
        });
    });

    /* Closing CTA / contact copy / form card — stagger their children */
    gsap.utils.toArray(".page-cta, .contact-direct, .contact-card").forEach(function (el) {
        gsap.from(el.children.length ? el.children : el, {
            scrollTrigger: { trigger: el, start: "top 84%" },
            y: 22, opacity: 0, duration: 0.65, stagger: 0.09, ease: "power3.out"
        });
    });

    /* Count-ups */
    countUps();

    /* Magnetic buttons + row spotlight position (desktop pointers only) */
    if (FINE) {
        document.querySelectorAll("[data-magnet]").forEach(function (el) {
            var xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
            var yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
                yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
            });
            el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
        });

        document.querySelectorAll(".spotlight-row").forEach(function (row) {
            row.addEventListener("pointermove", function (e) {
                var r = row.getBoundingClientRect();
                row.style.setProperty("--mx", (e.clientX - r.left) + "px");
                row.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* Font swap shifts layout — refresh trigger positions once ready */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
})();
