/**
 * Trava de acesso do Brand Studio.
 *
 * Mesma ideia do gate do /ppt-michelob no site do Somma: a verificação
 * acontece só no servidor. A senha nunca vai para o navegador e o HTML dos
 * slides só é entregue depois que o cookie está válido. Um bloqueio feito no
 * cliente não protegeria nada, porque o conteúdo já teria sido baixado junto
 * com a página.
 *
 * Diferença em relação ao Somma: lá o código tem fallback no próprio arquivo.
 * Aqui NÃO PODE — o repo 2as-inteligencia-financeira/brand-studio é público, e
 * um fallback no código seria publicar a senha. Só variável de ambiente.
 *
 * Variáveis (Vercel → Settings → Environment Variables):
 *   BRAND_ACCESS_CODE    código de 6 dígitos
 *   BRAND_ACCESS_SECRET  segredo para assinar o cookie
 * Mudar qualquer uma delas exige um novo deploy para valer.
 *
 * Roda no Edge Runtime, então usa Web Crypto — não existe node:crypto aqui.
 */

export const config = {
  // Protege tudo, menos: os assets (a tela de login precisa deles e nada ali é
  // confidencial), a própria tela de login e a infraestrutura da Vercel.
  matcher: ["/((?!assets/|login|favicon|robots.txt|_vercel|_next).*)"],
};

const COOKIE = "bs-acesso";
const DIAS = 30;

/** Assinatura HMAC-SHA256 em hex. */
async function assina(valor, segredo) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(valor));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Comparação em tempo constante, para não vazar o acerto pelo tempo de
 * resposta. Sai cedo só quando os tamanhos diferem — aí não há o que vazar.
 */
function iguais(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Extrai um cookie do header `Cookie`. Devolve "" quando não existe. */
function leCookie(header, nome) {
  if (!header) return "";
  for (const parte of header.split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim();
  }
  return "";
}

function semConfig() {
  return new Response(
    "Brand Studio sem configuração de acesso. Defina BRAND_ACCESS_CODE e " +
      "BRAND_ACCESS_SECRET nas variáveis de ambiente da Vercel e refaça o deploy.",
    { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}

export default async function middleware(req) {
  const codigo = process.env.BRAND_ACCESS_CODE?.trim();
  const segredo = process.env.BRAND_ACCESS_SECRET;

  // Falha fechada: sem configuração, ninguém entra. O contrário publicaria o
  // material inteiro caso a variável sumisse.
  if (!codigo || !segredo) return semConfig();

  const token = await assina("liberado", segredo);
  const url = new URL(req.url);

  // ── Tentativa de login ────────────────────────────────────────────────
  if (url.pathname === "/api/auth") {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    /**
     * O código vem em header, não no corpo.
     *
     * Medido no vercel dev: o Edge Middleware entrega o corpo vazio —
     * `req.json()` estourava e `req.text()` devolvia "" (enviado.len=0 com
     * codigo.len=6). Header é lido sem problema e, sobre HTTPS, viaja tão
     * protegido quanto o corpo. O que não pode é query string, que entra em
     * log de acesso.
     */
    const enviado = (req.headers.get("x-bs-codigo") ?? "").trim();
    if (!enviado) return Response.json({ ok: false, erro: "sem-codigo" }, { status: 400 });

    if (!iguais(enviado, codigo)) {
      // Atraso pequeno e fixo: encarece a força bruta sem virar canal lateral.
      await new Promise((r) => setTimeout(r, 400));
      return Response.json({ ok: false }, { status: 401 });
    }

    const res = Response.json({ ok: true });
    res.headers.append(
      "set-cookie",
      `${COOKIE}=${token}; Path=/; Max-Age=${60 * 60 * 24 * DIAS}; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }

  // ── Toda a demais navegação ───────────────────────────────────────────
  // Lê do header, não de req.cookies: `req.cookies` é API do NextRequest, e
  // aqui o middleware recebe um Request padrão — a propriedade não existe e o
  // acesso opcional devolvia undefined, barrando quem já tinha entrado.
  const atual = leCookie(req.headers.get("cookie"), COOKIE);
  if (iguais(atual, token)) return; // segue para o conteúdo

  // Reescreve (não redireciona): a URL pedida continua na barra, então depois
  // de entrar a pessoa cai na página que queria.
  return Response.redirect(new URL(`/login?de=${encodeURIComponent(url.pathname)}`, req.url), 302);
}
