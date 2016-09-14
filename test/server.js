'use strict'

const http = require('http')
const global_settings = require('global-settings')

const rt2 = require('rt2')({
  source: __dirname+'/routes'
})
rt2.loadRoutes(['home', 'about'])

http.createServer((request, response) => {
  rt2.dispatch(request, response, {post_error_page: './ohno.html', global_settings})
}).listen(1337, '127.0.0.1')
