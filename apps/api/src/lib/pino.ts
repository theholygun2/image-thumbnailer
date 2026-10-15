import pino from "pino";
import { env } from "../env";

const level = env.NODE_ENV === "production" ? "info" : "debug";

/**
 * Shared pino instance.
 *
 * - development → pino-pretty (colorized, human-readable, local dev only)
 * - staging, production → plain JSON lines
 *
 * JSON in staging/prod satisfies project-setup.md / deployment-workflow.md's
 * pre-containerization checklist: structured logging, not console.log, so
 * the eventual move to CloudWatch/similar doesn't require touching every
 * call site. `test` also gets JSON — it's noise either way in CI, and
 * pino-pretty is a dev-only devDependency, not something worth pulling into
 * every environment.
 */
export const logger = pino({
  level,
  // `exactOptionalPropertyTypes` forbids assigning `undefined` to an
  // optional property, so the key is conditionally spread in rather than
  // set to `transport: undefined` for staging/production/test.
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    },
  }),
});
