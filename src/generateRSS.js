let fs = require('fs')
let {Feed} =  require('feed')
let matter = require('gray-matter')
let path  = require("path")

function generate () {
  let feed = new Feed({
    title: 'Hyperlink Library',
    link: 'https://hyperlink.academy',
    id: 'https://hyperlink.academy',
    feedLinks: {
      rss: 'https://hyperlink.academy/rss.xml'
    },
    copyright: 'CC0'
  })

  let pages = fs.readdirSync(path.join(__dirname, '../pages/library'))

  pages.map(file => {
    if(fs.lstatSync(path.join('./pages/library/', file)).isDirectory()) return
    let content =  fs.readFileSync(path.join(__dirname, '../pages/library', file))
    let {data} = matter(content)
    feed.addItem({
      title: data.title,
      link: 'https://hyperlink.academy/library/' + file.slice(0, -4),
      author: data.author,
      date: new Date(data.date),
      description: data.description
    })
  })

  fs.writeFileSync(path.join(__dirname, '../public', 'atom.xml'), feed.atom1())
  fs.writeFileSync(path.join(__dirname, '../public', 'rss.xml'), feed.rss2())
}

generate()
