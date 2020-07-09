const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [require('rehype-slug')]
  }
})
module.exports = withMDX({
  target: 'server',
  pageExtensions: ['js', 'jsx', 'ts', 'md', 'mdx', 'txt'],
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.txt$/i,
      use: 'raw-loader',
    })

    return config
  }
})
