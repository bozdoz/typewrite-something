import * as Sentry from '@sentry/browser';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://ce393e73e1e74437accc9886f98abb7d@o69899.ingest.us.sentry.io/149608',

    // To set your release version
    release: `typewritesomething@${process.env.npm_package_version}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.4,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
