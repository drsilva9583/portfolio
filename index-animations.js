/* Homepage-only animation layer. scripts.js stays the shared file.
   Without JS (or with reduced motion / a blocked CDN) the page is a
   complete static design — everything here is enhancement only. */
(function () {
    "use strict";

    var REDUCED =
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        /[?&]nomotion/.test(location.search);
    var FINE = matchMedia("(pointer: fine)").matches;
    var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    function releaseIntro() {
        clearTimeout(window.__introSafety);
        document.documentElement.classList.remove("intro");
    }

    /* ─────────────────────────────────────────────────────────────
       Touchline scroll progress (no library needed)
       ───────────────────────────────────────────────────────────── */
    (function touchline() {
        var fill = document.querySelector("[data-touchline]");
        if (!fill) return;
        var ticking = false;
        function update() {
            var max = document.documentElement.scrollHeight - innerHeight;
            fill.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
            ticking = false;
        }
        addEventListener("scroll", function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        addEventListener("resize", update);
        update();
    })();

    /* ─────────────────────────────────────────────────────────────
       Pitch easter egg — hover "soccer team captain"
       ───────────────────────────────────────────────────────────── */
    (function pitchEgg() {
        var cap = document.querySelector(".captain-hl");
        var about = document.querySelector(".about");
        if (!cap || !about) return;
        cap.addEventListener("pointerenter", function () { about.classList.add("pitch-live"); });
        cap.addEventListener("pointerleave", function () { about.classList.remove("pitch-live"); });
    })();

    /* ─────────────────────────────────────────────────────────────
       Pitch ball — follows the cursor, clamped to stay inside the
       pitch. Desktop pointers only; rests on the center spot without
       JS, on touch, or under reduced motion.
       ───────────────────────────────────────────────────────────── */
    (function pitchBall() {
        if (REDUCED || !FINE) return;
        var ball = document.querySelector(".pitch-ball");
        var svg = document.querySelector(".pitch");
        var about = document.querySelector(".about");
        if (!ball || !svg || !about || !svg.createSVGPoint) return;

        // pitch bounds in viewBox units, kept off the edges/corner arcs
        var MINX = 70, MAXX = 570, MINY = 60, MAXY = 360;
        var x = 320, y = 210, tx = 320, ty = 210;
        var raf = null, onScreen = false, pt = svg.createSVGPoint();

        function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

        function tick() {
            raf = null;
            x += (tx - x) * 0.16;
            y += (ty - y) * 0.16;
            ball.setAttribute("cx", x.toFixed(1));
            ball.setAttribute("cy", y.toFixed(1));
            if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) {
                raf = requestAnimationFrame(tick);
            }
        }

        function wake() { if (!raf && onScreen) raf = requestAnimationFrame(tick); }

        addEventListener("pointermove", function (e) {
            if (!onScreen) return;
            var m = svg.getScreenCTM();
            if (!m) return;
            pt.x = e.clientX; pt.y = e.clientY;
            var p = pt.matrixTransform(m.inverse());
            tx = clamp(p.x, MINX, MAXX);
            ty = clamp(p.y, MINY, MAXY);
            wake();
        }, { passive: true });

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (en) {
                onScreen = en[0].isIntersecting;
            }).observe(about);
        } else {
            onScreen = true;
        }
    })();

    /* ─────────────────────────────────────────────────────────────
       Hero pass-map canvas — curved trajectories with traveling
       pulses. Static arcs when motion is reduced.
       ───────────────────────────────────────────────────────────── */
    (function heroField() {
        var canvas = document.querySelector("[data-field]");
        var hero = document.querySelector(".hero");
        if (!canvas || !hero || !canvas.getContext) return;

        var ctx = canvas.getContext("2d");
        var W = 0, H = 0, arcs = [], pulses = [];
        var raf = null, visible = true, onScreen = true, lastT = 0, lastSpawn = 0;
        var px = -1e4, py = -1e4;

        var VIOLET = [150, 118, 246];
        var TEAL = [64, 189, 205];
        var VERDE = [74, 190, 133];

        function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

        function makeArcs() {
            arcs = [];
            var n = W < 700 ? 7 : 13;
            for (var i = 0; i < n; i++) {
                var x1 = Math.random() * W * 0.9;
                var y1 = Math.random() * H;
                var len = W * (0.25 + Math.random() * 0.45);
                var ang = (Math.random() - 0.5) * 0.9;
                var x2 = Math.min(W * 1.05, x1 + Math.cos(ang) * len);
                var y2 = y1 + Math.sin(ang) * len;
                var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                var perp = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
                var bow = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 130);
                arcs.push({
                    x1: x1, y1: y1, x2: x2, y2: y2,
                    cx: mx + Math.cos(perp) * bow,
                    cy: my + Math.sin(perp) * bow,
                    color: Math.random() < 0.5 ? VIOLET : TEAL,
                    alpha: 0.07 + Math.random() * 0.06
                });
            }
        }

        function pointAt(a, t) {
            var u = 1 - t;
            return {
                x: u * u * a.x1 + 2 * u * t * a.cx + t * t * a.x2,
                y: u * u * a.y1 + 2 * u * t * a.cy + t * t * a.y2
            };
        }

        function drawArc(a, alpha) {
            ctx.beginPath();
            ctx.moveTo(a.x1, a.y1);
            ctx.quadraticCurveTo(a.cx, a.cy, a.x2, a.y2);
            ctx.strokeStyle = rgba(a.color, alpha);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        function drawStatic() {
            ctx.clearRect(0, 0, W, H);
            arcs.forEach(function (a) { drawArc(a, a.alpha + 0.02); });
        }

        function resize() {
            var dpr = Math.min(devicePixelRatio || 1, 2);
            W = canvas.clientWidth;
            H = canvas.clientHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            makeArcs();
            if (REDUCED) drawStatic();
        }

        function spawnPulse(now) {
            if (pulses.length >= 3 || !arcs.length) return;
            var arc = arcs[(Math.random() * arcs.length) | 0];
            var isBall = Math.random() < 1 / 7;
            pulses.push({
                arc: arc,
                t: 0,
                speed: 0.00016 + Math.random() * 0.00017,
                color: isBall ? VERDE : arc.color,
                ball: isBall
            });
            lastSpawn = now;
        }

        function frame(now) {
            raf = null;
            var dt = Math.min(64, now - (lastT || now));
            lastT = now;
            ctx.clearRect(0, 0, W, H);

            for (var i = 0; i < arcs.length; i++) {
                var a = arcs[i];
                var boost = 0;
                if (px > -9999) {
                    var mid = pointAt(a, 0.5);
                    var d = Math.hypot(px - mid.x, py - mid.y);
                    boost = Math.max(0, 1 - d / 260) * 0.08;
                }
                drawArc(a, a.alpha + boost);
            }

            if (now - lastSpawn > 1300 + (pulses.length * 900)) spawnPulse(now);

            for (var j = pulses.length - 1; j >= 0; j--) {
                var p = pulses[j];
                p.t += p.speed * dt;
                if (p.t >= 1) { pulses.splice(j, 1); continue; }
                // trail: brighten the segment just behind the pulse
                var tail = Math.max(0, p.t - 0.14);
                ctx.beginPath();
                var s = pointAt(p.arc, tail);
                ctx.moveTo(s.x, s.y);
                for (var k = 1; k <= 8; k++) {
                    var q = pointAt(p.arc, tail + (p.t - tail) * (k / 8));
                    ctx.lineTo(q.x, q.y);
                }
                ctx.strokeStyle = rgba(p.color, 0.35);
                ctx.lineWidth = 1.2;
                ctx.stroke();

                var head = pointAt(p.arc, p.t);
                ctx.save();
                if (p.ball) {
                    // the occasional verde pulse is the ball: white sphere + seam dot
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = rgba(VERDE, 0.8);
                    ctx.fillStyle = "rgba(245,248,246,0.95)";
                    ctx.beginPath();
                    ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "rgba(20,24,22,0.85)";
                    ctx.beginPath();
                    ctx.arc(head.x + 0.8, head.y - 0.6, 1.1, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = rgba(p.color, 0.9);
                    ctx.fillStyle = rgba(p.color, 0.95);
                    ctx.beginPath();
                    ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            if (visible && onScreen) raf = requestAnimationFrame(frame);
        }

        function play() {
            if (!raf && visible && onScreen && !REDUCED) {
                lastT = 0;
                raf = requestAnimationFrame(frame);
            }
        }

        resize();
        addEventListener("resize", resize);

        if (REDUCED) return; // static arcs only

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                onScreen = entries[0].isIntersecting;
                if (onScreen) play();
            }).observe(hero);
        }
        document.addEventListener("visibilitychange", function () {
            visible = !document.hidden;
            if (visible) play();
        });
        if (FINE) {
            hero.addEventListener("pointermove", function (e) {
                var r = canvas.getBoundingClientRect();
                px = e.clientX - r.left;
                py = e.clientY - r.top;
            });
            hero.addEventListener("pointerleave", function () { px = py = -1e4; });
        }
        play();
    })();

    /* ─────────────────────────────────────────────────────────────
       Variable-font proximity — the nameplate flexes away from
       the cursor. Desktop pointers only, after the intro settles.
       ───────────────────────────────────────────────────────────── */
    function enableProximity() {
        if (REDUCED || !FINE) return;
        var hero = document.querySelector(".hero");
        var chars = Array.prototype.slice.call(document.querySelectorAll(".hero-name .ch"));
        if (!hero || !chars.length) return;

        var px = -1e4, py = -1e4, raf = null, lastMeasure = 0, inside = false;
        var centers = [];
        var state = chars.map(function () { return { wd: 125, wg: 900 }; });

        function measure() {
            centers = chars.map(function (c) {
                var r = c.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            });
        }

        function tick(now) {
            raf = null;
            if (now - lastMeasure > 240) { measure(); lastMeasure = now; }
            var settled = true;
            for (var i = 0; i < chars.length; i++) {
                var d = Math.hypot(px - centers[i].x, py - centers[i].y);
                var f = Math.max(0, 1 - d / 190);
                f = f * f;
                var twd = 125 - 52 * f;
                var twg = 900 - 300 * f;
                var s = state[i];
                s.wd += (twd - s.wd) * 0.16;
                s.wg += (twg - s.wg) * 0.16;
                if (Math.abs(s.wd - 125) > 0.25 || Math.abs(twd - s.wd) > 0.25) settled = false;
                chars[i].style.setProperty("--wd", s.wd.toFixed(1));
                chars[i].style.setProperty("--wg", s.wg.toFixed(0));
            }
            if (inside || !settled) raf = requestAnimationFrame(tick);
        }

        function wake() { if (!raf) raf = requestAnimationFrame(tick); }

        hero.addEventListener("pointermove", function (e) {
            px = e.clientX; py = e.clientY; inside = true; wake();
        });
        hero.addEventListener("pointerleave", function () {
            px = py = -1e4; inside = false; wake();
        });
        addEventListener("resize", function () { lastMeasure = 0; });
    }

    /* ─────────────────────────────────────────────────────────────
       GSAP choreography
       ───────────────────────────────────────────────────────────── */
    if (REDUCED || !hasGsap) {
        releaseIntro();
        enableProximity();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* Intro — letters expand in like a line being played forward */
    var intro = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: enableProximity
    });
    intro
        .from(".hero-name .ch", {
            opacity: 0,
            yPercent: 42,
            "--wd": 62,
            "--wg": 300,
            duration: 0.95,
            ease: "expo.out",
            stagger: 0.05
        })
        .from([".hero-role", ".hero-evidence"], {
            opacity: 0, y: 26, duration: 0.7, stagger: 0.12
        }, "-=0.55")
        .from(".hero-photo", {
            opacity: 0, y: 30, duration: 0.8
        }, "-=0.6")
        .from(".hero-ctas > *", {
            opacity: 0, y: 16, duration: 0.5, stagger: 0.06
        }, "-=0.42")
        .from(".hero-scroll", { opacity: 0, duration: 0.6 }, "-=0.2");

    releaseIntro(); /* GSAP inline styles own the hero now */

    /* Work rows — rule draws across like a pass, title curves in */
    gsap.utils.toArray(".work-row").forEach(function (row) {
        var tl = gsap.timeline({
            scrollTrigger: { trigger: row, start: "top 78%" }
        });
        tl.from(row.querySelector(".work-rule"), {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power3.inOut"
        })
        .from(row.querySelector(".work-title"), {
            x: -38, y: 22, rotation: -1.2, opacity: 0,
            duration: 0.8, ease: "power3.out"
        }, 0.12)
        .from(row.querySelectorAll(".work-meta > *, .work-points li, .work-tech, .statline > div"), {
            y: 18, opacity: 0, duration: 0.55, stagger: 0.06, ease: "power2.out"
        }, 0.28);
    });

    /* Section heads + toolkit + closing */
    gsap.utils.toArray(".work-head, .toolkit .sec-title, .cta-closing").forEach(function (el) {
        gsap.from(el.children.length ? el.children : el, {
            scrollTrigger: { trigger: el, start: "top 82%" },
            y: 26, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
        });
    });

    gsap.utils.toArray(".tool-row").forEach(function (row) {
        var tl = gsap.timeline({
            scrollTrigger: { trigger: row, start: "top 88%" }
        });
        tl.from(row, { y: 22, opacity: 0, duration: 0.6, ease: "power2.out" })
          .from(row.querySelectorAll(".pill"), {
              y: 10, opacity: 0, duration: 0.35, stagger: 0.03, ease: "power2.out"
          }, 0.15);
    });

    /* About — copy rises, fieldcard drifts in, pitch draws itself */
    gsap.from(".about-body > *", {
        scrollTrigger: { trigger: ".about", start: "top 74%" },
        y: 26, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
    });
    gsap.from(".about-fieldcard", {
        scrollTrigger: { trigger: ".about", start: "top 74%" },
        y: 30, opacity: 0, duration: 0.9, ease: "power3.out"
    });

    var pitchStrokes = document.querySelectorAll(".pitch .pitch-stroke");
    if (pitchStrokes.length) {
        pitchStrokes.forEach(function (el) {
            var len = el.getTotalLength();
            el.style.strokeDasharray = len;
            el.style.strokeDashoffset = len;
        });
        gsap.to(pitchStrokes, {
            scrollTrigger: { trigger: ".about", start: "top 65%" },
            strokeDashoffset: 0,
            duration: 1.7,
            ease: "power2.inOut",
            stagger: 0.12
        });
    }

    /* Statline — scoreboard count-up */
    document.querySelectorAll(".statline dd").forEach(function (dd) {
        var end = parseFloat(dd.getAttribute("data-count"));
        var prefix = dd.getAttribute("data-prefix") || "";
        var suffix = dd.getAttribute("data-suffix") || "";
        var comma = dd.getAttribute("data-format") === "comma";
        if (isNaN(end)) return;
        var obj = { v: 0 };
        function render() {
            var n = Math.round(obj.v);
            dd.textContent = prefix + (comma ? n.toLocaleString("en-US") : n) + suffix;
        }
        obj.v = 0;
        render();
        gsap.to(obj, {
            v: end,
            duration: 1.7,
            ease: "power2.out",
            scrollTrigger: { trigger: dd, start: "top 86%" },
            onUpdate: render
        });
    });

    /* Magnetic buttons */
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

        /* Row spotlight position */
        document.querySelectorAll(".work-row").forEach(function (row) {
            row.addEventListener("pointermove", function (e) {
                var r = row.getBoundingClientRect();
                row.style.setProperty("--mx", (e.clientX - r.left) + "px");
                row.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* Font swap shifts layout — refresh trigger positions */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
})();
