# AGENTS.md — 2AS Brand Studio


## Projeto
2AS Brand Studio — base oficial de marca e materiais comerciais da 2AS Inteligência Financeira (Manual da Marca, Apresentação Comercial, Pitch Executivo, Arquitetura Comercial, Diretrizes de Proposta, Logo Showcase). É a fonte oficial dos assets de marca; o que está em `assets/` prevalece sobre cópias locais em outras pastas. Produção na Vercel, projeto `brand-studio`. Confirme o domínio no projeto Vercel antes de publicar. Stack: HTML/CSS/JS estático servido direto, **sem build e sem `package.json`**; sem backend, sem banco.

## Regras fixas (só mudam com sprint própria aprovada por Anderson)
1. Não há TypeScript aqui — o projeto é HTML/CSS/JS estático, sem build e sem dependências. Não introduzir bundler, framework ou `package.json` sem sprint própria: o "sem build" é a escolha de arquitetura, não uma pendência.
2. Não há auth, RLS nem schema neste projeto. O que ocupa esse lugar é a política de segurança de entrega em `vercel.json` (CSP, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, Permissions-Policy): **só muda em sprint dedicada com aprovação explícita do Anderson**. Afrouxar a CSP para acomodar um script novo é decisão de segurança, não detalhe de implementação — pare e devolva ao orquestrador.
3. Não existe interface administrativa. Deploy, rollback e commit permanecem fora do produto, feitos por quem tem acesso à Vercel.
4. Sem build, suíte ou CI: confira as páginas alteradas e os headers de `vercel.json` quando a entrega os afetar.

## Fora do ciclo atual
O escopo é o pedido atual, complementado pelo contexto vigente do projeto. Sempre incluir: IA autônoma ou ação crítica sem autorização explícita. Incluir também: substituir asset oficial de marca sem aprovação do Anderson, já que este repo é a fonte da qual os outros projetos copiam.

Estado, decisões e próximos passos: `/Users/andersonalmeida/Documents/SEGUNDO CÉREBRO/01 Projetos/2AS/AI_CONTEXT.md`. Recupere somente as notas relevantes; mantenha memória durável no cofre.
