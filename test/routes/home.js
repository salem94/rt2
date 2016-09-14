'use strict'

module.exports = {
  alias: 'Home',
  url_pattern: '/',
  handlers_source: __dirname + '/handlers',
  handlers: {
    GET: 'home-get'
  }
}
