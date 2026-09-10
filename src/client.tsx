import { RouterProvider } from "@tanstack/react-router";
import { hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();

hydrateRoot(document, <RouterProvider router={router} />);
