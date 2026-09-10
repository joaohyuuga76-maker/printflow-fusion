export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    // Se for requisição direta de arquivo estático (.js, .css, etc.), não intercepta
    if (url.pathname.startsWith("/assets/") || url.pathname.includes(".")) {
      return new Response("Not Found", { status: 404 });
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VisionFlow ERP</title>
    <link rel="stylesheet" href="/assets/styles-DoI73Nos.css" />
    <script type="module" src="/assets/client-Dbczfehc.js"></script>
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
