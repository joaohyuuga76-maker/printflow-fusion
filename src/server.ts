export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    // Se a requisição for para assets estáticos (js, css, imagens, fontes), deixa o Nitro servir
    if (url.pathname.startsWith("/assets/") || url.pathname.includes(".")) {
      return new Response("Not Found", { status: 404 });
    }

    // Para qualquer página, entrega o HTML SPA base para o navegador carregar o React
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VisionFlow ERP</title>
    <link rel="stylesheet" href="/assets/styles.css" />
    <script type="module" src="/src/client.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
