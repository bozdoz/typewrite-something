import loadScript from './loadScript';
import waitFor from './waitFor';

// TODO: create a queue to store calls before sentry loaded
window.sentry = {
  addBreadcrumb() {},
  captureException() {},
  captureMessage() {},
  setExtras() {},
};

if (process.env.NODE_ENV === 'production') {
  loadScript('https://browser.sentry-cdn.com/6.2.5/bundle.min.js', {
    integrity:
      'sha384-+0tgGyP4idWu9/NA6Jbmnj3SApxIg65/GR1zo3qSieRNyzmmDQ/5a1Yu6mfmUw+v',
    crossOrigin: 'anonymous',
  });

  waitFor(() => !!window.Sentry).then(() => {
    window.Sentry.init({
      dsn:
        'https://ce393e73e1e74437accc9886f98abb7d@o69899.ingest.sentry.io/149608',

      // To set your release version
      release: `typewritesomething@${process.env.npm_package_version}`,
      integrations: [new window.Integrations.BrowserTracing()],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });

    window.sentry = window.Sentry;
  });
}
