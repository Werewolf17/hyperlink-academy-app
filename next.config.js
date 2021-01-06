let path = require('path')
const withSourceMaps = require('@zeit/next-source-maps')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const {
  NEXT_PUBLIC_SENTRY_DSN: SENTRY_DSN,
  SENTRY_ORG,
  SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN,
  NODE_ENV,
  VERCEL_GITHUB_COMMIT_SHA,
  VERCEL_GITLAB_COMMIT_SHA,
  VERCEL_BITBUCKET_COMMIT_SHA,
} = process.env
process.env.SENTRY_DSN = SENTRY_DSN

const COMMIT_SHA =
  VERCEL_GITHUB_COMMIT_SHA ||
  VERCEL_GITLAB_COMMIT_SHA ||
  VERCEL_BITBUCKET_COMMIT_SHA

module.exports = withSourceMaps({
  redirects: ()=>{
    return [{
      source: "/blog/:path*",
      destination: "/library/:path",
      permanent: true
    }]
  },
  pageExtensions: ['js', 'jsx', 'ts', 'md', 'mdx', 'txt'],
  webpack: (config, options) => {
    if (!options.isServer) {
      config.resolve.alias['@sentry/node'] = '@sentry/browser'
    }

    config.module.rules.push({
      test: /\.txt$/i,
      use: 'raw-loader',
    }, {
      test: /\.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader:  '@mdx-js/loader',
          options: {
            rehypePlugins: [require('rehype-slug')]
          }
        },
        path.join(__dirname, './src/mdxHelper.js')
      ]
    })

   if (
      SENTRY_DSN &&
      SENTRY_ORG &&
      SENTRY_PROJECT &&
      SENTRY_AUTH_TOKEN &&
      COMMIT_SHA &&
      NODE_ENV === 'production'
    ) {
      config.plugins.push(
        new SentryWebpackPlugin({
          include: '.next',
          ignore: ['node_modules'],
          urlPrefix: '~/_next',
          release: COMMIT_SHA,
        })
      )
    }

    return config
  }
})
