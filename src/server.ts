import { eventHandler, getRequestURL } from "h3";

export default eventHandler(async (event) => {
  const url = getRequestURL(event);

  if (url.pathname.startsWith("/assets/") || url.pathname.includes(".")) {
    return;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VisionFlow ERP</title>
    <link rel="stylesheet" href="/assets/styles-DoI73Nos.css" />
  </head>
  <body class="bg-background text-foreground">
    <div id="root"></div>
    <script type="module" src="/assets/rolldown-runtime-hePW80VL.js"></script>
    <script type="module" src="/assets/client-Dbczfehc.js"></script>
  </body>
</html>`;
});
