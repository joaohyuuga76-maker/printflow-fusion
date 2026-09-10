import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();
const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
