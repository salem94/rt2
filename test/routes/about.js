'use strict'

module.exports = {
  alias: 'About',
  //               0     1    2
  url_pattern: '/about/(.*)/(.*)',
  handlers_source: __dirname + '/handlers',
  handlers: {
    GET: 'about-get',
    POST: 'about-post'
  },
  tokens: {
    1: 'what',
    2: 'who'
  }
}
