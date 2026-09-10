import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();
const root = createRoot(document.body);
root.render(<RouterProvider router={router} />);
