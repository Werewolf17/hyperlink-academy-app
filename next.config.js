const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/
})
module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'md', 'mdx', 'txt'],
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.txt$/i,
      use: 'raw-loader',
    })

    return config
  }
})
