import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

export default createStartHandler({
  createRouter: () => import("./router").then((m) => m.getRouter()),
})(defaultStreamHandler);
