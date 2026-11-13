# Marão Burgers · landing page

Landing page cinematográfica da Marão Burgers (61 Hollis St, Framingham, MA), em inglês.

## Rodar

```bash
npm install
npm run dev       # desenvolvimento em http://localhost:4174
npm run build     # gera o site estático em dist/
npm run preview   # serve o dist/ para conferir
```

O `dist/` sobe em qualquer hospedagem estática (Cloudflare Pages, Netlify, Vercel).

## Onde mexer

| O quê | Onde |
|---|---|
| Link do pedido online, mapa, e-mail, Instagram | `vite.config.js` (objeto `SITE`) |
| Textos e seções | `src/sections/*.html` (juntadas no `index.html` por `<!-- @include -->`) |
| Cardápio completo (gerado do site atual) | `src/sections/parts/*.html` e `src/data/menu.json` |
| Cores, fontes, espaços | `src/styles/tokens.css` |
| Estilos | `src/styles/main.css` |
| Animações | `src/motion/` (hero, chapa, prato giratório, faíscas, som, nav…) |
| Horário de funcionamento ("Open now") | `src/motion/hours.js` e `src/sections/visit.html` |

## Mídia

- `public/frames/` — quadros do vídeo do hero (desktop `d/` e celular `m/`), tocados pela rolagem.
- `public/video/` — vídeo da chapa (anda com a rolagem) e os loops de pastel, açaí e caldo de cana.
- `public/img/` — logo, mascote, burgers recortados do prato giratório e fotos do cardápio.
- `public/audio/` — sons opcionais (botão **Sound**).

## Stack

Vite (HTML, CSS e JS puros), GSAP + ScrollTrigger, Lenis. Fontes Archivo e Fraunces servidas pelo próprio site.
