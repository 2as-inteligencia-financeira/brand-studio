# 2AS Brand Studio

Projeto separado para materiais comerciais da 2AS:

- Manual da marca
- Apresentação comercial
- Pitch executivo
- Precificação
- Estrutura de soluções (SaaS, CFO as a Service, BPO)

## Estrutura

- `index.html` - hub de navegação
- `assets/theme.css` - tokens visuais e estilos compartilhados
- `slides/manual-marca.html`
- `slides/apresentacao.html`
- `slides/pitch.html`
- `slides/precificacao.html`
- `slides/solucoes.html`
- `originais/*.html` - cópias dos arquivos que você já tinha pronto

## Como usar

Abra `index.html` no navegador ou sirva a pasta com qualquer servidor estático.

Exemplo simples:

```bash
cd "brand-studio"
python3 -m http.server 8080
```

Depois acesse: `http://localhost:8080`

## Evolução recomendada

- Migrar os conteúdos dos arquivos originais de `marca/apresentacoes/` para as páginas equivalentes quando quiser.
- Criar versão PDF de cada página para envio comercial.
- Adicionar variações por segmento (EdTech, serviços, indústria etc.).
