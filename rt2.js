'use strict'
// Core
const EventEmitter = require('events')
const path = require('path')
const util = require('util')
const isArray = util.isArray
const isObject = util.isObject
const isString = util.isString
const isFunction = util.isFunction
// Third
const p2r = require('path-to-regexp')
// Project
const bi_handlers = require('handlers')


function Rt2 (idata = {}) {
  this.routes = []
  this.source = idata.source || './node_modules/routes'
  this.debug = !!(idata.debug) // forced bool cast.
  this.handlers = bi_handlers
}

Rt2.prototype.log = function (msg, dbg = true) {
  if (dbg && this.debug) {
    console.log(`[Rt2:debug] ${msg}`)
  } else if (!dbg) {
    console.log(`[Rt2] ${msg}`)
  }
}

Rt2.prototype.processedRoute = function (uroute) {
  // uroute_definition must be an object.
  if (!uroute || !(uroute.constructor.name === 'Object')) {
    throw new Error(`Needed an unprocessed route definition object, but ${uroute} received`)
  }

  const proute = {
    alias: uroute.alias || 'N/A',
    tokens: uroute.tokens || {},
    keys: [],
    url_pattern: null,
    handlers: {},
    allowed_methods: []
  }
  proute.url_pattern = p2r(uroute.url_pattern, proute.keys)
  /*
  If u_route.handlers is an array of controller files, iterate over it
  and for each controller file, load it.
  if handlers_source is null, use the controller file as a full path for the
  module.
  if is not null, join in to the controller filename
  */

  if (!(uroute.hasOwnProperty('handlers'))) {
    return proute
  }

  if (!(isObject(uroute.handlers))) {
    throw new Error(`Route handlers is invalid ${uroute}`)
  }

  Object.keys(uroute.handlers).forEach(handler_name => {
    // <current> may be a file name or a function.
    const current = uroute.handlers[handler_name]
    if (isFunction(current)) {
      proute.handlers[handler_name] = current
    } else {
      if (isString(uroute.handlers_source)) {
        proute.handlers[handler_name] = require(path.join(uroute.handlers_source, current))
      } else {
        proute.handlers[handler_name] = require(current)
      }
    }
  })

  return proute
}

Rt2.prototype.loadRoutes = function (route_definition) {
  /*
  Process the route definition, and put the processed route definition
  in this.routes
  */
  if (!route_definition) {
    throw new Error(`Can not load the route, ${route_definition} received. `)
  }

  switch (route_definition.constructor.name) {
    case 'String':
      /*
      If route_definition is a string, then take it as a module path
      and try to load it, then call loadRoute again.
      */
      let rdef = require(path.join(this.source, route_definition))
      return this.loadRoutes(rdef)
    case 'Object':
      let processed_route_definition = this.processedRoute(route_definition)
      this.routes.push(processed_route_definition)
      return (this.routes.length - 1)
    case 'Array':
      // route_definition is an array of paths or objects.
      Object.keys(route_definition).forEach(element_index => {
        this.loadRoutes(route_definition[element_index])
      })
      return (this.routes.length - 1)
  }
}

Rt2.prototype.replyFn = function (response) {
  return (function reply(body, status_code, headers) {
    return new Promise(resolve => {
      // If body is a stream, pipe it to te response.
      if (body instanceof EventEmitter && typeof body.read === 'function') {
        body.pipe(response)
        body.on('end', (data) => {
          response.writeHead(status_code, headers)
          response.end(data)
        })
      } else {
        response.writeHead(status_code, headers)
        response.end(body)
      }
    })
  })
}

Rt2.prototype.parsedTokens = function (route, request) {
  /*
  Asynchronously generate the tokens to be passed to a controller.
  The tokens will be added in request under the 'tokens' key.
  */
  const tokens = {}
  const tokens_keys_list = Object.keys(route.tokens)
  const url_match = route.url_pattern.exec(request.url)
  return (function fill (tokens_keys_list_index) {
    return new Promise(resolve => {
      if (tokens_keys_list_index >= tokens_keys_list.length) {
        resolve(tokens)
      } else {
        const token_name = route.tokens[tokens_keys_list[tokens_keys_list_index]]
        tokens[token_name] = url_match[tokens_keys_list_index + 1]
        resolve(fill(tokens_keys_list_index + 1))
      }
    })
  })(0)
}

Rt2.prototype.matchingRoute = function (url) {
  // rl_index points to a this.routes index
  const rti = this
  return (function iter (rl_index = 0) {
    return new Promise(resolve => {
      if (rl_index >= rti.routes.length) {
        resolve(null)
      }
      const current = rti.routes[rl_index]
      rti.log(`Iteration ${rl_index + 1}/${rti.routes.length}`)
      if (current === undefined) {
        rti.log(`Iteration finished whitout finding a matching route for ${url}`)
        resolve(null)
      }
      if (current.url_pattern.test(url)) {
        rti.log(`Iteration finished. Matching route found ${current.alias}`)
        resolve(rti.routes[rl_index])
      } else {
        rti.log(`No route found yet for ${url}.`)
        resolve(iter(rl_index + 1))
      }
    })
  })(0)
}

Rt2.prototype.controllerFor = function (route, method) {
  const rti = this
  return new Promise(resolve => {
    if (typeof route.handlers[method] === 'function') {
      resolve(route.handlers[method])
    } else {
      resolve(rti.handlers['405'])
    }
  })
}

Rt2.prototype.dispatch = function (request, response, shared) {

  this.matchingRoute(request.url)
  .then(route => {
    // Find controller. If route is null, return 404.
    if (route === null) {
      return Promise.resolve([this.handlers['404']])
    }
    return Promise.all([this.controllerFor(route, request.method),
                        this.parsedTokens(route, request)])
  })
  .then(results => {
    // results[0] -> controller, results[1] -> parsed tokens
    request.tokens = results[1]
    setImmediate(results[0], request, this.replyFn(response), shared)
  })
}

module.exports = (idata) => new Rt2(idata)
