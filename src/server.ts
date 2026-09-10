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
    <script type="module">
      import "/assets/rolldown-runtime-hePW80VL.js";
      import { getRouter } from "/assets/client-Dbczfehc.js";
      import { createRoot } from "https://esm.sh/react-dom@18/client";
      import { RouterProvider } from "https://esm.sh/@tanstack/react-router";

      try {
        const router = getRouter();
        const rootElement = document.getElementById("root");
        if (rootElement) {
          createRoot(rootElement).render(
            window.React ? window.React.createElement(RouterProvider, { router }) : null
          );
        }
      } catch (err) {
        console.error("Erro na inicializacao:", err);
      }
    </script>
  </body>
</html>`;
});
