# bool.pt — site estático

Este repositório é o site público da Bool em HTML, CSS e JavaScript simples. Não há build, não há `node_modules`, não há framework. O que está no branch `master` é o que o GitHub Pages publica em https://bool.pt, normalmente um minuto depois do commit.

## Como está organizado

```
index.html              Homepage
about/index.html        Uma pasta por página, sempre com um index.html
services/index.html
people/index.html
portfolio/index.html
blog/index.html         A página "Insights"
events/, careers/, contacts/, cookies/, privacy/, terms/
404.html                Página de erro do GitHub Pages
assets/site.css         Estilos de todas as páginas (gerado na migração, não reformatar)
assets/app.css          Estilos do menu mobile, modais e formulários
assets/app.js           Todo o comportamento: cookies, menu, carrosséis, formulários, modais
assets/img/             Imagens. Nomes em minúsculas com hífens
assets/fonts/           Fontes WOFF2 do site
docs/                   PDFs públicos
og/default.png          Imagem de partilha nas redes sociais
favicon.svg, favicon.png, apple-touch-icon.png, robots.txt, CNAME
```

## Regras

### Cabeçalho e rodapé estão copiados em todas as páginas

Não há componente partilhado. O `<header class="site-header">` e o `<footer>` existem em cada um dos 13 ficheiros HTML e têm de ser idênticos. Quando mudares um link do menu, um texto do rodapé ou uma rede social, aplica a mesma alteração em todos os ficheiros e confirma com uma pesquisa (`grep`) que não ficou nenhuma cópia diferente. Única exceção: o atributo `aria-current="page"` e a classe `nav-link--active` marcam a página atual e são diferentes em cada ficheiro.

### Os atributos `data-c-*` ligam o HTML ao CSS

Muitos elementos têm um atributo como `data-c-section-intro` ou `data-c-footer`. É a marca do componente a que o CSS pertence: as regras em `site.css` só se aplicam a elementos com essa marca. Ao copiar um bloco de HTML para outra página ou para criar um elemento novo, copiar os atributos junto. Nunca os apagar nem renomear.

### Todos os caminhos são relativos

O site tem de abrir diretamente do disco, com duplo clique num `index.html`. Por isso nunca se usa um caminho a começar por `/`.

- Da homepage para outra página: `about/index.html`
- De uma página para outra: `../services/index.html`
- Para uma secção de outra página: `../services/index.html#howWeWork`
- Para uma imagem: `../assets/img/nome.webp` (ou `assets/img/nome.webp` a partir da homepage)

Os únicos URLs absolutos são os externos (`https://...`), o `rel="canonical"` e as meta tags Open Graph, que têm de apontar para `https://bool.pt/...`.

### JavaScript

Todo o comportamento vive em `assets/app.js`, um único ficheiro clássico, carregado com `defer`. Não usar `type="module"`, nem `import`, nem `fetch` de ficheiros locais: o Chrome bloqueia tudo isso quando a página é aberta do disco. Cada bloco do ficheiro está numerado e comentado. Os identificadores públicos (Google Analytics, LinkedIn, Turnstile, URL da API dos formulários) estão no topo, em `CONFIG`.

Algumas classes CSS usadas pelo JavaScript vêm do stylesheet original e têm nomes gerados, como `_banner_1vaau_1`. Estão todas listadas uma vez no objeto `CSS` no topo do `app.js`. Não as renomear sem renomear também em `site.css` e no HTML.

### Imagens

Guardar em `assets/img/`, nome em minúsculas e com hífens, já otimizadas: WebP para fotografias (largura máxima 1600 px, qualidade 80), SVG para logótipos. Todas as imagens levam `width`, `height`, `alt` e `loading="lazy"`, exceto a primeira imagem visível de cada página, que não leva `loading="lazy"`.

### Novo artigo, nova página

Para uma página nova, copiar a pasta de uma página parecida, mudar o conteúdo, o `<title>`, a `meta description`, o `canonical` e as meta tags Open Graph, e acrescentar o link onde fizer sentido. Para um artigo, o mesmo a partir de uma página de artigo existente.

### Consentimento de cookies

O banner, a memória da decisão e o carregamento do Google Analytics e do LinkedIn Insight estão na secção 2 e 3 do `app.js`. Nenhum tracker pode carregar sem consentimento. Se mudarem as categorias ou as ferramentas, aumentar `CONSENT_VERSION` para voltar a pedir consentimento a toda a gente, e atualizar as páginas `cookies/` e `privacy/`.

### Formulários

Os formulários fazem POST para a API em `CONFIG.apiBase` (`/contact`, `/subscribe`, `/event`) com um token do Cloudflare Turnstile. Só funcionam em bool.pt: do disco ou de localhost o captcha não carrega e o envio falha. Isso é esperado.

## Testar

1. Abrir o `index.html` da página no browser, a partir do disco. Texto, imagens, layout, menu mobile, carrosséis e modais funcionam assim.
2. Para os formulários, só depois de publicado.

## Publicar

Commit no `master` e push. O GitHub Pages publica o branch tal como está. Não há passo de build. Um commit errado fica no ar até ao commit seguinte, por isso rever o diff antes de fazer push.

Mensagens de commit curtas, em inglês, a dizer o que mudou para quem lê o histórico: `Update team page: add Maria Santos`, `Fix broken link in footer`.

## Histórico

Este site substituiu, em outubro de 2026, um monorepo Astro/React com o mesmo conteúdo. O HTML foi gerado a partir do build desse projeto e limpo; o JavaScript foi reescrito à mão. O monorepo Astro e o conversor usado na migração ficaram guardados no branch `astro-site`.
