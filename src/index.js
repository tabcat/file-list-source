
'use strict'

const errCode = require('err-code')
const get = require('dlv')

/**
* Create an async iterator that yields paths that match requested file paths.
* @param {FileList} fileList instance of FileList https://developer.mozilla.org/en-US/docs/Web/API/FileList
* @param {Object} [options] optionally set options
* @param {Boolean} [options.noWarn] log warn when fileList constructor name is not 'FileList'
* @param {Boolean} [options.preserveMtime] preserve the files mtime
*/
module.exports = async function * fileListSource (fileList, options = {}) {
  if (get(fileList, 'constructor.name') !== 'FileList' && !options.noWarn) {
    console.warn('fileList.constructor.name was not equal to FileList.')
  }
  // Check the input paths comply with options.recursive and convert to glob sources
  for await (const file of Object.values(fileList)) {
    const filePath = file.webkitRelativePath || file.path || file.mozFullPath || file.name
    if (typeof filePath !== 'string') {
      throw errCode(
        new Error('Path must be a string'),
        'ERR_INVALID_PATH',
        { path: filePath }
      )
    }

    const mode = options.mode

    let mtime = options.mtime

    if (options.preserveMtime) {
      const time = file.lastModified || Date.parse(file.lastModifiedDate)
      if (time) {
        mtime = {
          secs: Number(time.toString().slice(0, -3)),
          nsecs: Number(time.toString().slice(-3))
        }
      } else if (!options.noWarn) console.warn('no time properties found')
    }

    yield {
      path: toPosix(filePath),
      content: file,
      mode,
      mtime
    }
  }
}

const toPosix = path => path.replace(/\\/g, '/')
