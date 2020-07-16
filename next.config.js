let path = require('path')
module.exports = {
  pageExtensions: ['js', 'jsx', 'ts', 'md', 'mdx', 'txt'],
  webpack: (config, options) => {
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

    return config
  }
}
