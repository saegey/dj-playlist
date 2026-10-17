// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bba1d8af14af919928e5049d9b50cf73@o4507969145012224.ingest.us.sentry.io/4510852354408448",

  // Exception tracking only: no tracesSampleRate, so tracing/spans are off.
});
