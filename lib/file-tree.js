'use strict'

const FS = require('fs')
const PATH = require('path')

function directoryTree (path, ig) {
  const name = PATH.basename(path)
  const item = { path, name }
  let stats

  try { stats = FS.statSync(path) }
  catch (e) { return null }

  if (ig.ignores(path)) return null

  if (stats.isFile()) {
    item.size = stats.size
    item.type = 'file'
  }
  else {
    item.type = 'folder'
    item.children = FS.readdirSync(path)
      .map(child => directoryTree(PATH.join(path, child), ig))
      .filter(e => !!e)
    // item.size = item.children.reduce((prev, cur) => prev + cur.size, 0)
  }
  return item
}

module.exports = directoryTree
