/*!
 * Module dependencies.
 */

var async = require('async');
var http = require('http');
var mongoose = require('mongoose')

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , vocabularies = require('../app/controllers/vocabularies')
  , logs = require('../app/controllers/logs')
  , versions = require('../app/controllers/versions')
  , languages = require('../app/controllers/languages')
  , edition = require('../app/controllers/edition')
  , agents = require('../app/controllers/agents')
  , pilots = require('../app/controllers/pilots') //atrillos
  , auth = require('./middlewares/authorization')
  , search = require('../app/controllers/search')
  , searchMulti = require('../app/controllers/searchMulti')
  , qa = require('../app/controllers/qa')
  , bot = require('../app/controllers/bot')
  , negotiate = require('express-negotiate')
  , queryExamples = require('../lib/queryExamples')
  , LogSparql = mongoose.model('LogSparql')
  

/**
 * Route middlewares
 */

//var articleAuth = [auth.requiresLogin, auth.article.hasAuthorization]
var agentAuth = [auth.requiresLogin, auth.agent.hasAuthorization]
var userAuth = [auth.requiresLogin, auth.user.hasAuthorization]


/**
 * Expose routes
 */

module.exports = function (app, passport,esclient, elasticsearchClient, emailTransporter) {

  /* ########### Edition ########### */
  //root and authentication
  app.get('/edition', function(req, res){res.redirect('/edition/bdo/')})
  app.get('/edition/bdo', auth.requiresLogin, edition.index)
  app.get('/edition/bdo/signup', users.signup)
  app.get('/edition/bdo/login', users.login)
  app.get('/edition/bdo/logout', users.logout)
  app.post('/edition/bdo/users', users.create)
  app.post('/edition/bdo/session',
    passport.authenticate('local', {
     failureRedirect: '/edition/bdo/login',
      failureFlash: true
    }), users.session)
  //global actions
  app.post('/edition/bdo/usersReview', auth.requiresLogin, edition.reviewUsersBatch)
  app.post('/edition/bdo/suggestTakeAction', auth.requiresLogin, edition.suggestTakeAction)
  app.post('/edition/bdo/suggestUpdateStatus', auth.requiresLogin, edition.suggestUpdateStatus)
  //users
  app.get('/edition/bdo/users', auth.requiresAdmin, users.index)
  app.post('/edition/bdo/userChangeCategory', auth.requiresAdmin, users.userChangeCategory)
  app.del('/edition/bdo/users/:userId', auth.requiresAdmin, users.destroy)
  app.get('/edition/bdo/users/:userId', auth.requiresAdminOrUser, users.edit)
  app.put('/edition/bdo/users/:userId', auth.requiresAdminOrUser, users.update)
  app.param('userId', users.load)
  //agents
  app.get('/edition/bdo/agents/new', auth.requiresLogin, agents.new);
  app.post('/edition/bdo/agents', auth.requiresLogin, agents.create)
  app.post('/edition/bdo/agents/creationOnTheFly', auth.requiresLogin, agents.createOnTheFly)
  app.get('/edition/bdo/agents/:agentId', auth.requiresLogin, agents.edit)
  app.put('/edition/bdo/agents/:agentId', auth.requiresLogin, agents.update)
  app.del('/edition/bdo/agents/:agentId', auth.requiresLogin, agents.destroy)
  app.param('agentId', agents.load)
  //atrillos
  //pilots
  app.get('/edition/bdo/pilots/new', auth.requiresAdmin, pilots.new);
  app.post('/edition/bdo/pilots', auth.requiresAdmin, pilots.create)
  //app.post('/edition/bdo/pilots/creationOnTheFly', auth.requiresAdmin, pilots.createOnTheFly)
  app.get('/edition/bdo/pilots/:pilotId', auth.requiresAdmin, pilots.edit)
  app.put('/edition/bdo/pilots/:pilotId', auth.requiresAdmin, pilots.update)
  app.del('/edition/bdo/pilots/:pilotId', auth.requiresAdmin, pilots.destroy)
  app.param('pilotId', pilots.load)
  //vocabs
  app.post('/edition/bdo/vocabs/new', auth.requiresLogin, vocabularies.new) //create the vocab
  app.get('/edition/bdo/vocabs/:vocabPxEdition', auth.requiresLogin, vocabularies.edit)
  app.post('/edition/bdo/vocabs', auth.requiresLogin, vocabularies.create) //save initial metadata + version
  app.del('/dataset/bdo/vocabs/:vocabPxEdition', auth.requiresAdmin, vocabularies.destroy)
  app.put('/edition/bdo/vocabs/:vocabPxEdition', auth.requiresLogin, vocabularies.update)
  //versions
  app.get('/edition/bdo/vocabs/:vocabPxEdition/versions', auth.requiresLogin, versions.list)
  app.del('/edition/bdo/vocabs/:vocabPxEdition/versions', auth.requiresLogin, versions.remove)
  app.post('/edition/bdo/vocabs/:vocabPxEdition/versions/review', auth.requiresLogin, versions.changeStatusReviewed)
  app.post('/edition/bdo/vocabs/:vocabPxEdition/versions/reviewAll', auth.requiresLogin, versions.changeStatusReviewedAll)
  app.post('/edition/bdo/vocabs/:vocabPxEdition/versions/edit', auth.requiresLogin, versions.edit)
  app.post('/edition/bdo/vocabs/:vocabPxEdition/versions/new', auth.requiresLogin, versions.new)
  
  // agent
  app.get('/dataset/bdo/agents', function(req, res){search.searchAgent(req,res,esclient);})
  app.get('/dataset/bdo/agents/:agentName', agents.show)
  app.param('agentName', agents.loadFromName)

  //atrillos
  // pilot
  app.get('/dataset/bdo/pilots', function(req, res){search.searchPilot(req,res,esclient);})
  app.get('/dataset/bdo/pilots/:pilotName', pilots.show)
  app.param('pilotName', pilots.loadFromName)

  
  // vocabs routes

  app.get('/', function(req, res){res.redirect('/dataset/bdo/')})
  app.get('/dataset', function(req, res){res.redirect('/dataset/bdo/')})
  app.get('/dataset/bdo', vocabularies.index)
  app.get('/dataset/bdo/vocabs', function(req, res){search.searchVocabulary(req,res,esclient);})
  app.get('/dataset/bdo/vocabs/:vocabPx/versions/:date.n3', function(req, res) {
    res.set('Content-Type', 'text/n3');
    res.download(require('path').resolve(__dirname+'/../versions/'+req.vocab._id+'/'+req.vocab._id+'_'+req.params.date+'.n3'),req.params.vocabPx+'_'+req.params.date+'.n3');
});
  app.get('/dataset/bdo/vocabs/:vocabPx', vocabularies.show)
  app.get('/dataset/bdo/details/vocabulary:vocabularyid', function(req, res) {
    var vocabularyId=req.param('vocabularyid');
    if(vocabularyId){
      var prefix = vocabularyId.substring(1,vocabularyId.indexOf(".html"));
      res.redirect('/dataset/bdo/vocabs/'+ prefix);
    }
    else res.redirect('/dataset/bdo/');
  });
  //app.get('/vocabs/new', auth.requiresLogin, vocabularies.new)
  //app.post('/vocabs', auth.requiresLogin, vocabularies.create)
  //app.get('/vocabs/:vocabPx/edit', articleAuth, vocabularies.edit)
  //app.put('/vocabs/:vocabPx', articleAuth, vocabularies.update)
  //app.del('/vocabs/:vocabPx', articleAuth, vocabularies.destroy)
  app.param('vocabPx', vocabularies.load)
  app.param('vocabPxEdition', vocabularies.loadEdition)
  

  // languages routes
  app.get('/dataset/bdo/languages/:langIso639P3PCode', languages.show)
  app.param('langIso639P3PCode', languages.load)
  
  
  
  // article routes
 // app.get('/articles', articles.index)
 // app.get('/articles/new', auth.requiresLogin, articles.new)
 // app.post('/articles', auth.requiresLogin, articles.create)
 // app.get('/articles/:id', articles.show)
  //app.get('/articles/:id/edit', articleAuth, articles.edit)
  //app.put('/articles/:id', articleAuth, articles.update)
 // app.del('/articles/:id', articleAuth, articles.destroy)

  //app.param('id', articles.load)
  
  app.get('/dataset/bdo/about', function(req, res){res.render('about', {});}  )
  
  
  // search
  app.get('/dataset/bdo/terms', function(req, res){search.search(req,res,esclient);})
  app.get('/dataset/bdo/searchMulti', auth.requiresLogin, function(req, res){searchMulti.search(req,res,esclient);})
  	  
  //app.get('/dataset/bdo/qa', auth.requiresLogin, function(req, res){qa.search(req,res);})
  app.get('/dataset/bdo/qa', function(req, res){qa.search(req,res);})
  
  //Bot
  app.get('/dataset/bdo/suggest', function(req, res){bot.isInLOV(req,res);})
  app.post('/dataset/bdo/suggest',function(req, res){bot.submit(req,res,emailTransporter);})
  
  // tag routes
  //var tags = require('../app/controllers/tags')
  //app.get('/tags/:tag', tags.index)
  
  
  //APIs  
  app.get('/dataset/bdo/context', function(req, res){vocabularies.jsonLDListVocabs(req,res);})
  
  app.get('/dataset/bdo/api/v2/term/suggest', function(req, res){search.apiSuggestTerms(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/term/autocomplete', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/autocomplete/terms', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/term/autocompleteLabels', function(req, res){search.apiAutocompleteLabelsTerms(req,res,elasticsearchClient);})
  
  app.get('/dataset/bdo/api/v2/term/search', function(req, res){search.apiSearch(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/search', function(req, res){search.apiSearch(req,res,esclient);})
  
  app.get('/dataset/bdo/api/v2/agent/autocomplete', agents.autoComplete)
  app.get('/dataset/bdo/api/v2/agent/autocompleteFull', agents.autoCompleteFull)
  app.get('/dataset/bdo/api/v2/agent/search', function(req, res){search.apiSearchAgent(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/agent/list', function(req, res){agents.apiListAgents(req,res);})
  app.get('/dataset/bdo/api/v2/agent/info', function(req, res){agents.apiInfoAgent(req,res);})

  //atrillos
  app.get('/dataset/bdo/api/v2/pilot/autocomplete', pilots.autoComplete)
  app.get('/dataset/bdo/api/v2/pilot/autocompleteFull', pilots.autoCompleteFull)
  app.get('/dataset/bdo/api/v2/pilot/search', function(req, res){search.apiSearchPilot(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/pilot/list', function(req, res){pilots.apiListPilots(req,res);})
  app.get('/dataset/bdo/api/v2/pilot/info', function(req, res){pilots.apiInfoPilot(req,res);})
  
  app.get('/dataset/bdo/api/v2/vocabulary/autocomplete', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/autocomplete/vocabularies', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/vocabulary/list', function(req, res){vocabularies.apiListVocabs(req,res);})
  app.get('/dataset/bdo/api/v2/vocabulary/search', function(req, res){search.apiSearchVocabs(req,res,esclient);})
  app.get('/dataset/bdo/api/v2/vocabulary/info', function(req, res){vocabularies.apiInfoVocab(req,res);})
  app.get('/dataset/bdo/api/v2/vocabulary/prefix/exists', function(req, res){vocabularies.apiPrefixExists(req,res);})
  
  app.get('/dataset/bdo/api/v2/log/sparql', function(req, res){logs.apiSPARQL(req,res);})

  app.get('/dataset/bdo/api/v2/tags/list', function(req, res){vocabularies.apiTags(req,res);})
  
  app.get('/dataset/bdo/api', function(req, res){res.render('api', {});}  )
  app.get('/dataset/bdo/api/v1', function(req, res){res.render('api', {});}  )
  app.get('/dataset/bdo/api/v2', function(req, res){res.render('api', {});}  )
  app.get('/dataset/bdo/apidoc', function(req, res){res.render('api', {});}  )
  
  
  /* Vocommons */
  app.get('/vocommons', function(req, res){res.redirect('/vocommons/voaf/')});
  app.get('/vocommons/voaf', function(req, res, next) {
    req.negotiate({
        'application/rdf+xml': function() {
           res.set('Content-Type', 'application/rdf+xml');
           res.download(require('path').resolve(__dirname+'/../vocommons/voaf/v2.3/voaf_v2.3.rdf'));
        },
        'html,default': function() {res.redirect('/vocommons/voaf/v2.3/');}
    });
  });
  
  app.get('/endpoint/bdo', function(req, res){res.redirect('/dataset/bdo/sparql')});   
  app.get('/dataset/bdo/sparql', function(req, res, next) {
    //TODO log SPARQL Queries using the logSearch object ??
    
    req.negotiate({'application/sparql-results+json,application/sparql-results+xml,text/tab-separated-values,text/csv,application/json,application/xml': function() {
          //console.log('req.query '+JSON.stringify(req.query.query))
          executeSPARQLQuery(res, req.headers, req.query.query, req.query['default-graph-uri'],req.query['named-graph-uri']);
        },
        'html': function() {
          res.render('endpoint/index', {queryExamples:queryExamples});
        },
        'default': function() {
          executeSPARQLQuery(res, req.headers, req.query.query, req.query['default-graph-uri'],req.query['named-graph-uri']);
        }
    });
  });
  app.post('/dataset/bdo/sparql', function(req, res, next) {
      //console.log('req.query '+JSON.stringify(req.body.query))
      executeSPARQLQuery(res, req.headers, req.body.query, req.body['default-graph-uri'],req.body['named-graph-uri']);
      
  });
  
  function executeSPARQLQuery(res, headers, query, defaultGraphUri, namedGraphUri) {
    var sparqlExecTime = Date.now();
    path='/bigdataocean/sparql?query='+  encodeURIComponent(query);
    if(defaultGraphUri)path+='&default-graph-uri='+ encodeURIComponent(defaultGraphUri);
    if(namedGraphUri)path+='&named-graph-uri='+ encodeURIComponent(namedGraphUri);
    delete headers['content-length'];
    delete headers['cookie'];
    var options = {hostname: 'localhost',port: 3030,path: path, headers: headers};
    //console.log('OPTIONS: '+JSON.stringify(options));
    http.get(options, function(response) {
        var bodyChunks = [];
        response.on('data', function(d) {bodyChunks.push(d);});// Continuously update stream with data
        response.on('end', function() {
          var body = Buffer.concat(bodyChunks);
          var duration = (Date.now() - sparqlExecTime)
          var log = new LogSparql({query: encodeURIComponent(query),
            date: new Date(),
            execTime: duration,
            nbResults: 0  });//console.log(log);
          log.save(function (err){if(err)console.log(err)});
          //console.log(body);
          //console.log('HEADERS: '+JSON.stringify(response.headers))
          res.set(response.headers); 
          res.send(200, body);});
    });    
  }
  

}
