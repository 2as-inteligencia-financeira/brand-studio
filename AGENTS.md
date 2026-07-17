# AGENTS.md — 2AS Brand Studio

Instruções de projeto para qualquer agente de IA que trabalhar aqui — Claude Code, Cursor, Codex, Grok, ou outro. Formato aberto AGENTS.md: qualquer ferramenta compatível lê isso automaticamente na raiz do repo. Não é exclusivo de uma IA.

## Projeto
2AS Brand Studio — base oficial de marca e materiais comerciais da 2AS Inteligência Financeira (Manual da Marca, Apresentação Comercial, Pitch Executivo, Arquitetura Comercial, Diretrizes de Proposta, Logo Showcase). É a fonte oficial dos assets de marca; o que está em `assets/` prevalece sobre cópias locais em outras pastas. Produção na Vercel, projeto `brand-studio` ([AJUSTAR: confirmar o domínio — o `CLAUDE.md` do workspace aponta brand.2asfinancas.com, mas o repo não declara isso e ainda cita `hub.2asfinancas.com`, que foi arquivado]). Stack: HTML/CSS/JS estático servido direto, **sem build e sem `package.json`**; sem backend, sem banco.

## Papéis: quem decide, quem digita
- Orquestrador — o modelo de raciocínio mais forte disponível na ferramenta do momento. Lê o estado atual no Notion, decide o escopo da sprint, define o que entra e o que fica de fora, delega a implementação. Não digita o volume de código.
- Executor — o modelo mais barato disponível. Implementa exatamente o que o orquestrador definiu. Não reabre decisão de escopo, não improvisa arquitetura, não decide segurança sozinho.
- Nunca inverter os papéis. Se o executor encontrar algo que exige decisão de escopo ou segurança, ele para e devolve pro orquestrador, não decide sozinho.

## Onde mora o estado (e por que você não busca sozinho)
- O estado vivo do projeto (roadmap, sprint atual, decisões estruturais, gaps registrados) mora no Notion, mas você não tem acesso direto a ele. Nenhuma conexão MCP do Notion está configurada nesta ferramenta.
- Anderson ou o Claude (orquestrador rodando no claude.ai, que tem acesso ao Notion) trazem o contexto necessário para você dentro do próprio prompt de cada sessão. Trate o que vier no prompt como o estado atual, não tente reconstruir ou adivinhar o que não foi passado.
- Se faltar contexto que você julga necessário, pare e pergunte no lugar de assumir, buscar em outro lugar, ou inventar.
- Você nunca lê nem escreve no Notion diretamente, mesmo que encontre credenciais, tokens ou integrações no ambiente. Se algo assim aparecer, trate como fora de escopo e reporte, não use.

## Regras fixas (só mudam com sprint própria aprovada por Anderson)
1. Não há TypeScript aqui — o projeto é HTML/CSS/JS estático, sem build e sem dependências. Não introduzir bundler, framework ou `package.json` sem sprint própria: o "sem build" é a escolha de arquitetura, não uma pendência.
2. Não há auth, RLS nem schema neste projeto. O que ocupa esse lugar é a política de segurança de entrega em `vercel.json` (CSP, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, Permissions-Policy): **só muda em sprint dedicada com aprovação explícita do Anderson**. Afrouxar a CSP para acomodar um script novo é decisão de segurança, não detalhe de implementação — pare e devolva ao orquestrador.
3. Não existe interface administrativa. Deploy, rollback e commit permanecem fora do produto, feitos por quem tem acesso à Vercel.
4. Não há suíte de teste nem CI. [AJUSTAR: definir a verificação mínima aceitável antes de promover — hoje é validação visual das páginas e conferência de que os headers de `vercel.json` continuam aplicados]
5. Toda sprint segue a sequência: objetivo → escopo dentro/fora → fontes de dados e contratos de leitura → build/lint/testes → preview → aprovação → evidência de produção registrada no Notion.

## Fora do ciclo atual
[AJUSTAR: preencher o que está fora de escopo neste projeto — o estado da sprint está no Notion, fora do meu alcance.] Sempre incluir: IA autônoma ou ação crítica sem autorização explícita. Incluir também: substituir asset oficial de marca sem aprovação do Anderson, já que este repo é a fonte da qual os outros projetos copiam.

## Como fechar qualquer sprint
1. Devolver ao orquestrador (Anderson ou o Claude do claude.ai) evidência real: PR, commit, deploy, migration aplicada. Você não escreve essa evidência no Notion, quem registra é quem tem acesso.
2. Se a sprint revelou um gap ou mudou uma regra, reportar isso de forma explícita na resposta final, para o orquestrador decidir se registra em Decisões Estratégicas 2AS ou Auditoria de Migração 2AS.
3. Nunca marcar como concluída na sua própria resposta sem entregar essas duas coisas. Quem confirma o fechamento formal da sprint no Notion é o orquestrador, não você.
