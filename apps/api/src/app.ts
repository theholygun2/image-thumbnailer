import { Hono } from "hono";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPIRouteHandler } from "hono-openapi";
import { openApiDocumentation } from "./lib/openapi";
import { errorHandler } from "./middleware/error-handler";
import { loggerMiddleware } from "./middleware/logger";
import { imagesRoute } from "./routes/images";
import { uploadsRoute } from "./routes/uploads";
import { env } from "./env";

const app = new Hono()

  .use(loggerMiddleware)

  .use(
    "/api/*",
    cors({
      origin: env.APP_URL,
      credentials: true,
    }),
  )

  .get(
    "/",
    describeRoute({
      tags: ["Meta"],
      summary: "Root",
      responses: {
        200: { description: "Server is running" },
      },
    }),
    (c) => c.json({ message: "Hono server is running" }),
  )

  .get(
    "/health",
    describeRoute({
      tags: ["Meta"],
      summary: "Liveness check",
      description: "Static check used by Docker/EC2. No external dependencies.",
      responses: {
        200: { description: "Process is up" },
      },
    }),
    (c) => c.json({ status: "ok" }),
  );

const routes = app
  .route("/api/uploads", uploadsRoute)
  .route("/api/images", imagesRoute);

app.onError(errorHandler);

// OpenAPI 3.1 spec for this app's routes (uploads, images, meta).
app.get("/openapi.json", openAPIRouteHandler(app, { documentation: openApiDocumentation }));

app.get(
  "/reference",
  Scalar({
    pageTitle: "Image Thumbnailer API Reference",
    sources: [{ url: "/openapi.json", title: "API" }],
  }),
);

export type AppType = typeof routes;

export default app;