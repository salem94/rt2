'use strict'

module.exports = (request, reply, shared) => {
  reply(shared.global_settings.greetings, 200, {
      'content-type': 'text/plain'
    })
}
