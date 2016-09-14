'use strict'

module.exports = (request, reply, shared) => {
  reply(fs.createReadStream(shared.post_error_page), 405, {'content-type': 'text/html'})
}
