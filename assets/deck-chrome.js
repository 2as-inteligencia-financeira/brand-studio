/**
 * kit-visual · deck-chrome
 *
 * Transforma uma página rolável que já existe numa peça de apresentação, sem
 * tocar no desenho dela. Uma linha por página:
 *
 *   <script src="../../kit-visual/deck-chrome.js" defer></script>
 *
 * O que injeta (tudo do /proposta-comercial-somma-club-2026 do Somma V3):
 *   · barra de progresso de leitura no topo
 *   · navegação por capítulos, com capítulo ativo por IntersectionObserver
 *   · setas / PageUp / PageDown / Home / End
 *   · tela cheia e "copiar link"
 *   · entrada por scroll (reveal) nas seções
 *
 * Não impõe paleta: lê as variáveis CSS que a página já declara
 * (--amber, --text, --bg, --border, --muted) e cai em valores neutros se
 * não achar. Por isso funciona igual no registro escuro do brand-studio e no
 * claro da landing.
 *
 * Configuração opcional, antes do <script>:
 *   <script>window.deckChrome = { sections: ".minha-secao", label: "h2" }</script>
 */

(function () {
  "use strict";

  var cfg = Object.assign(
    {
      /** Seletor das seções que viram capítulo. Seções aninhadas dentro de
          outra seção são descartadas — só o nível de fora vira capítulo. */
      sections: "section",
      /** Onde procurar o rótulo do capítulo, em ordem de preferência. */
      label: ".eyebrow, .kicker, h2, h1",
      /** Rótulo máximo na barra (corta com reticência). */
      maxLabel: 22,
      /** Liga a entrada por scroll. */
      reveal: true,
      /** Mínimo de seções pra valer a pena montar a barra. */
      min: 3,
    },
    window.deckChrome || {},
  );

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function slug(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  function textOf(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function clip(s, n) {
    return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
  }

  function start() {
    var found = Array.prototype.slice.call(document.querySelectorAll(cfg.sections));
    // Só o nível de fora vira capítulo: uma seção contida em outra da lista
    // sairia como capítulo duplicado e bagunçaria o estado ativo.
    var sections = found.filter(function (el) {
      return !found.some(function (other) {
        return other !== el && other.contains(el);
      });
    });
    if (sections.length < cfg.min) return;

    /* ── Capítulos: id e rótulo derivados do conteúdo ──────────────────
       O id vem do rótulo, então inserir seção no meio nunca desalinha a
       numeração — mesma ideia da lista de slides do deck Michelob. */
    var chapters = sections.map(function (sec, i) {
      var lbl = sec.querySelector(cfg.label);
      var raw = lbl ? textOf(lbl) : "";
      var name = raw || "Seção " + (i + 1);
      if (!sec.id) sec.id = slug(raw) || "sec-" + (i + 1);
      sec.setAttribute("data-section", sec.id);
      return { anchor: sec.id, label: clip(name, cfg.maxLabel), el: sec };
    });

    injectStyle();

    var bar = document.createElement("div");
    bar.className = "dc-progress";
    bar.setAttribute("aria-hidden", "true");

    var header = document.createElement("div");
    header.className = "dc-bar";
    header.innerHTML =
      '<nav class="dc-nav" aria-label="Capítulos"><ul class="dc-list"></ul></nav>' +
      '<div class="dc-actions">' +
      '<button class="dc-btn" data-act="copy" aria-label="Copiar link">link</button>' +
      '<button class="dc-btn" data-act="full" aria-label="Tela cheia">tela cheia</button>' +
      "</div>";

    var list = header.querySelector(".dc-list");
    chapters.forEach(function (c, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.className = "dc-chip";
      b.textContent = c.label;
      b.addEventListener("click", function () {
        go(i);
      });
      li.appendChild(b);
      list.appendChild(li);
      c.chip = b;
    });

    document.body.appendChild(bar);
    document.body.appendChild(header);

    /* ── Capítulo ativo ───────────────────────────────────────────────
       rootMargin -45%/-45% reduz a zona de decisão a uma faixa no meio da
       tela: o capítulo troca quando a seção chega ao meio, não quando
       encosta na borda. Sem isso duas seções disputam o estado. */
    var active = 0;
    function setActive(i) {
      if (i === active) return;
      chapters[active] && chapters[active].chip.removeAttribute("aria-current");
      active = i;
      var chip = chapters[i].chip;
      chip.setAttribute("aria-current", "true");
      // Mantém o capítulo ativo visível na barra rolável.
      chip.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    var obs = new IntersectionObserver(
      function (entries) {
        var best = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          })[0];
        if (!best) return;
        for (var i = 0; i < chapters.length; i++) {
          if (chapters[i].anchor === best.target.id) {
            setActive(i);
            break;
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    chapters.forEach(function (c) {
      obs.observe(c.el);
    });
    setActive(0);
    chapters[0].chip.setAttribute("aria-current", "true");

    function go(i) {
      var k = Math.max(0, Math.min(chapters.length - 1, i));
      chapters[k].el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }

    /* ── Teclado ──────────────────────────────────────────────────── */
    addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      if (["ArrowRight", "ArrowDown", "PageDown"].indexOf(e.key) >= 0) {
        e.preventDefault();
        go(active + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].indexOf(e.key) >= 0) {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(chapters.length - 1);
      }
    });

    /* ── Ações ────────────────────────────────────────────────────── */
    header.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "full") {
        if (document.fullscreenElement) document.exitFullscreen().catch(noop);
        else document.documentElement.requestFullscreen().catch(noop);
      } else if (b.dataset.act === "copy") {
        navigator.clipboard
          .writeText(location.href)
          .then(function () {
            b.textContent = "copiado";
            setTimeout(function () {
              b.textContent = "link";
            }, 2000);
          })
          .catch(noop);
      }
    });
    document.addEventListener("fullscreenchange", function () {
      var b = header.querySelector('[data-act="full"]');
      b.textContent = document.fullscreenElement ? "sair" : "tela cheia";
    });

    /* ── Progresso ────────────────────────────────────────────────── */
    var raf = 0;
    function tick() {
      raf = 0;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    }
    addEventListener(
      "scroll",
      function () {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      { passive: true },
    );
    addEventListener("resize", tick);
    tick();

    /* ── Reveal ───────────────────────────────────────────────────────
       Só nos filhos diretos da seção, e nunca na primeira seção — a capa
       precisa estar visível no primeiro quadro, inclusive pra quem chega
       sem JS ou com o scroll já no topo. */
    if (cfg.reveal && !reduce) {
      var ro = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.setAttribute("data-dc-reveal", "in");
              ro.unobserve(e.target);
            }
          });
        },
        { threshold: 0.2 },
      );
      chapters.slice(1).forEach(function (c) {
        Array.prototype.forEach.call(c.el.children, function (child, i) {
          child.setAttribute("data-dc-reveal", "");
          child.style.setProperty("--dc-delay", Math.min(i, 6) * 60 + "ms");
          ro.observe(child);
        });
      });
    }
  }

  function noop() {}

  function injectStyle() {
    var css = [
      /* Todos os valores caem em neutro se a página não declarar o token. */
      ":root{--dc-accent:var(--amber,var(--kit-primary,#f59e0b));",
      "--dc-fg:var(--text,var(--kit-text,#f6f4ed));",
      "--dc-bg:var(--bg,var(--kit-bg,#090907));",
      "--dc-line:var(--border,var(--kit-border,rgba(128,128,128,.28)));",
      "--dc-muted:var(--muted,var(--kit-muted,#9c988d));}",

      ".dc-progress{position:fixed;left:0;right:0;top:0;height:2px;z-index:9999;",
      "background:var(--dc-accent);transform:scaleX(0);transform-origin:left;will-change:transform}",

      ".dc-bar{position:fixed;left:0;right:0;bottom:0;z-index:9998;display:flex;align-items:center;",
      "gap:12px;padding:8px 12px;background:color-mix(in srgb,var(--dc-bg) 88%,transparent);",
      "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--dc-line)}",

      ".dc-nav{min-width:0;flex:1}",
      ".dc-list{display:flex;gap:4px;margin:0;padding:0;list-style:none;overflow-x:auto;",
      "scrollbar-width:none;-ms-overflow-style:none}",
      ".dc-list::-webkit-scrollbar{display:none}",

      ".dc-chip{white-space:nowrap;border:0;background:transparent;cursor:pointer;",
      "font:inherit;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;",
      "color:var(--dc-muted);padding:6px 10px;border-radius:999px;",
      "transition:color .18s ease,background-color .18s ease}",
      ".dc-chip:hover{color:var(--dc-fg)}",
      '.dc-chip[aria-current="true"]{color:var(--dc-accent);',
      "background:color-mix(in srgb,var(--dc-accent) 14%,transparent)}",

      ".dc-actions{display:flex;gap:6px;flex:0 0 auto}",
      ".dc-btn{border:1px solid var(--dc-line);background:transparent;cursor:pointer;font:inherit;",
      "font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--dc-muted);",
      "padding:6px 10px;border-radius:999px;transition:color .18s ease,border-color .18s ease}",
      ".dc-btn:hover{color:var(--dc-fg);border-color:var(--dc-fg)}",

      /* A barra fica no rodapé: reserva espaço pra não cobrir conteúdo. */
      "body{padding-bottom:56px}",

      "[data-dc-reveal]{opacity:0;transform:translateY(20px);",
      "transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1);",
      "transition-delay:var(--dc-delay,0ms)}",
      '[data-dc-reveal="in"]{opacity:1;transform:none}',

      "@media (max-width:640px){.dc-btn{display:none}}",
      "@media (prefers-reduced-motion:reduce){[data-dc-reveal]{opacity:1;transform:none}",
      ".dc-progress,.dc-chip,.dc-btn{transition:none}}",
      "@media print{.dc-bar,.dc-progress{display:none}body{padding-bottom:0}",
      "[data-dc-reveal]{opacity:1;transform:none}}",
    ].join("");

    var el = document.createElement("style");
    el.setAttribute("data-deck-chrome", "");
    el.textContent = css;
    document.head.appendChild(el);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
