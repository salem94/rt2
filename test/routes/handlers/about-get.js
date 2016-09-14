'use strict'

module.exports = (request, reply, shared) => {
  const message = `You asked the ${request.tokens.what} about ${request.tokens.who}`
  reply(message, 200, {'content-type': 'text/plain'})
}
