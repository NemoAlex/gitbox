'use strict'

const FS = require('fs')
const PATH = require('path')

function directoryTree (path, exclude) {
  const name = PATH.basename(path)
  const item = { path, name }
  let stats

  try { stats = FS.statSync(path) }
  catch (e) { return null }

  if (exclude && exclude.length) {
    for (var i = 0; i < exclude.length; i++) {
      if (new RegExp(exclude[i]).test(name)) return null
    }
  }

  if (stats.isFile()) {
    item.size = stats.size
    item.type = 'file'
  }
  else {
    item.type = 'folder'
    item.children = FS.readdirSync(path)
      .map(child => directoryTree(PATH.join(path, child), exclude))
      .filter(e => !!e)
    // item.size = item.children.reduce((prev, cur) => prev + cur.size, 0)
  }
  return item
}

module.exports = directoryTree