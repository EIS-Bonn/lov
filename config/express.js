/**
 * Module dependencies.
 */
var globalPath = require('./configPath').path;
var express = require('express')
  , csrf = express.csrf()
  , mongoStore = require('connect-mongo')(express)
  , flash = require('connect-flash')
  , winston = require('winston')
  , helpers = require('view-helpers')
  , pkg = require('../package.json')

var env = process.env.NODE_ENV || 'development'

module.exports = function (app, config, passport) {

  app.set('showStackError', true)

  // should be placed before express.static
  app.use(express.compress({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
    },
    level: 9
  }))
var pathroot = globalPath+'/lov'
  app.use(express.favicon())
  app.use(express.static(pathroot + '/public'))
  app.use(express.static(pathroot + '/versions'))
  app.use('/vocommons',express.static(pathroot + '/vocommons'))

  // Logging
  // Use winston on production
  var log
  if (env !== 'development') {
    log = {
      stream: {
        write: function (message, encoding) {
          winston.info(message)
        }
      }
    }
  } else {
    log = 'dev'
  }
  // Don't log during tests
  if (env !== 'test') app.use(express.logger(log))

  // set views path, template engine and default layout
  app.set('views', pathroot + '/app/views')
  app.set('view engine', 'jade')

  app.configure(function () {
    // expose package.json to views
    app.use(function (req, res, next) {
      res.locals.pkg = pkg
      next()
    })

    // cookieParser should be above session
    app.use(express.cookieParser())

    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride())

    // express/mongo session storage
    app.use(express.session({
      secret: pkg.name,
      store: new mongoStore({
        url: config.db,
        collection : 'sessions'
      })
    }))
    
    //allow cross domain CORS
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    })

    // use passport session
    app.use(passport.initialize())
    app.use(passport.session())

    // connect flash for flash messages - should be declared after sessions
    app.use(flash())

    // should be declared after session and flash
    app.use(helpers(pkg.name))

    // adds CSRF support
    if (process.env.NODE_ENV !== 'test') {
      
      //app.use(express.csrf())
      var conditionalCSRF = function (req, res, next) {
        if (req.path != '/dataset/bdo/sparql') {//don't check the csrf if sent to sparql as it is not supported by yasgui
          csrf(req, res, next);
        } else {
          next();
        }
      }

      app.use(conditionalCSRF);

      // This could be moved to view-helpers :-)
      app.use(function(req, res, next){
        if(typeof req.csrfToken == 'function'){//small hack to work in the case of sparql access using yasgui
          res.locals.csrf_token = req.csrfToken()
        }
        next()
      })
    }
    
    app.enable('trust proxy')

    // routes should be at the last
    app.use(app.router)

    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function(err, req, res, next){
      // treat as 404
      if (err.message
        && (~err.message.indexOf('not found')
        || (~err.message.indexOf('Cast to ObjectId failed')))) {
        return next()
      }

      // log it
      // send emails if you want
      console.error(err.stack)

      // error page
      res.status(500).render('500', { error: err.stack })
    })

    // assume 404 since no middleware responded
    app.use(function(req, res, next){
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not found'
      })
    })
  })

  // development env config
  app.configure('development', function () {
    app.locals.pretty = true
  })
}