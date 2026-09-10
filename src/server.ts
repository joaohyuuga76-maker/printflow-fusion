import { eventHandler, sendRedirect } from "h3";

export default eventHandler(async (event) => {
  const url = new URL(event.node.req.url || "/", "http://localhost");

  // Deixa assets passarem direto
  if (url.pathname.startsWith("/assets/") || url.pathname.includes(".")) {
    return;
  }

  // Entrega o shell HTML limpo apontando para o módulo do cliente
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VisionFlow ERP</title>
    <link rel="stylesheet" href="/assets/styles-DoI73Nos.css" />
  </head>
  <body class="dark bg-background text-foreground">
    <div id="root"></div>
    <script type="module" src="/src/client.tsx"></script>
  </body>
</html>`;
});
