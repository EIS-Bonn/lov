
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Pilot = mongoose.model('Pilot')
  , Vocabulary = mongoose.model('Vocabulary')
  , LogSearch = mongoose.model('LogSearch')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  


exports.index = function (req, res) {
  var criteria = { pilots: req.param('pilot') }
  var perPage = 5
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var options = {
    perPage: perPage,
    page: page,
    criteria: criteria
  }

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count(criteria).exec(function (err, count) {
      res.render('articles/index', {
        title: 'Articles tagged ' + req.param('pilot'),
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}  
  
/**
 * Load
 */

exports.loadFromName = function(req, res, next, name){
  Pilot.loadFromName(name, function (err, pilot) {
    if (err) return next(err)    
    if (!pilot) return next(new Error('Pilot '+name+' not found'))
    req.pilot = pilot
    next()
  })
}

exports.load = function(req, res, next, id){
  Pilot.load(id, function (err, pilot) {
    if (err) return next(err)    
    if (!pilot) return next(new Error('Pilot '+id+' not found'))
    req.pilot = pilot
    next()
  })
}

/**
 * Edit an pilot
 */
exports.edit = function (req, res) {
    res.render('pilots/edit', {
      pilot: req.pilot
    })
}

/**
 * Delete an pilot
 */
exports.destroy = function(req, res){
  var pilot = req.pilot
  pilot.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/dataset/bdo/pilots')
  })
}

/**
 * Create pilot
 */
exports.create = function (req, res) {
  var pilot = new Pilot(req.body)
  pilot.save(function (err) {
    if (err) {return res.render('500')}
    return res.redirect('/dataset/bdo/pilots/' + pilot.name)
  })
}

exports.createOnTheFly = function (req, res) {
  var pilot = new Pilot(req.body)
  pilot.save(function (err) {
    if (err) {return res.render('500')}
    return res.send({pilot:pilot})
  })
}

exports.new = function (req, res){
  //atrillos
  Pilot.findPilot(req.body.name, function(err, pilot){
    if (err) return res.render('500')
    if(pilot){ //vocab already exist
      req.flash('error', 'This pilot already exists')
      res.redirect('/edition/bdo/')
    } else {
      res.render('pilots/new', {
        pilot: new Pilot({})
      });
    }
  })
};


/**
 * Update pilot
 */

exports.update = function(req, res){
  var pilot = req.pilot;
  pilot = _.extend(pilot, req.body)
  pilot.save(function(err) {
    if (err) {
      return res.render('500')
    }
    res.redirect('/dataset/bdo/pilots/' + pilot.name)
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  //Vocabulary.listCreatedPerPiLot(req.pilot._id, function(err, creatVocabs) {
    //if (err) return res.render('500')
    //Vocabulary.listContributedPerPilot(req.pilot._id, function(err, contribVocabs) {
      //if (err) return res.render('500')
      //Vocabulary.listPublishedPerPilot(req.pilot._id, function(err, pubVocabs) {
        //if (err) return res.render('500')
    
        /* prepare pie data*/
        //var pieData = [[
                        //{ 
                          //"label": "Creator",
                          //"value" : (creatVocabs)?creatVocabs.length:0
                        //} , 
                        //{ 
                          //"label": "Contributor",
                          //"value" : (contribVocabs)?contribVocabs.length:0
                        //} , 
                        //{ 
                          //"label": "Publisher",
                          //"value" : (pubVocabs)?pubVocabs.length:0
                        //}
                      //]];
                      
        /* prepare tags */
        //var allVocabs = creatVocabs.concat(contribVocabs.concat(pubVocabs));
        //var tags = [];
        //if(allVocabs.length){
          //for(i=0; i<allVocabs.length; i++){
            //if(allVocabs[i].tags){
              //for(j=0; j<allVocabs[i].tags.length; j++){
                //if(tags.indexOf(allVocabs[i].tags[j])<0)tags.push(allVocabs[i].tags[j]);
              //}
            //}
          //}
       // }
        
        res.render('pilots/show', {
          pilot: req.pilot,
          //allVocabs: allVocabs,
          //pieData: pieData,
          //tags: tags
        })
      //})
    //})
  //})
}

 /**
* Pilot List API
*/
exports.apiListPilots = function (req, res) {
  Pilot.listPilots(function(err, pilots) {
    if (err) return res.render('500')
    //store log in DB
    var log = new LogSearch({
      searchURL: req.originalUrl,
      date: new Date(),
      category: "pilotList",
      method: "api",
      nbResults: pilots.length  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    return standardCallback(req, res, err, pilots);
  })
}

 /**
* Pilots Info API
*/
exports.apiInfoPilot = function (req, res) {
  if (!(req.query.pilot!=null)) return res.send(500, "You must provide a value for 'pilot' parameter");
  Pilot.loadFromNameURIAltURI(req.query.pilot, function (err, pilot) {
    if (err) return res.send(500, err);
    //store log in DB
    var exists = (pilot)?1:0;
    var log = new LogSearch({
      searchURL: req.originalUrl,
      date: new Date(),
      category: "pilotInfo",
      method: "api",
      nbResults: exists  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    return standardCallback(req, res, err, pilot);
  })
}

/* depending on result, send the appropriate response code */
function standardCallback(req, res, err, results) {
  if (err != null) {
    console.log(err);
    return res.send(500, err);
  } else if (!(results != null)) {
    return res.send(404, 'API returned no results');
  } else {
    return res.send(200, results);
  }
};

exports.autoComplete = function(req, res) {
   var regex = new RegExp(req.query["q"], 'i');
   var query = Pilot.find({$or: [{name: regex},{prefUri: regex}]},{name:1,_id:0}).sort({name:1}).limit(10);
        
      // Execute query in a callback and return pilots list
  query.exec(function(err, pilots) {
      if (!err) {
         res.send(pilots, {
            'Content-Type': 'application/json'
         }, 200);
      } else {
         res.send(JSON.stringify(err), {
            'Content-Type': 'application/json'
         }, 404);
      }
   });
}

exports.autoCompleteFull = function(req, res) {
   var regex = new RegExp(req.query["q"], 'i');
   var query = Pilot.find({$or: [{name: regex},{prefUri: regex}]}).sort({name:1}).limit(10);
        
      // Execute query in a callback and return pilots list
  query.exec(function(err, pilots) {
      if (!err) {
         res.send(pilots, {
            'Content-Type': 'application/json'
         }, 200);
      } else {
         res.send(JSON.stringify(err), {
            'Content-Type': 'application/json'
         }, 404);
      }
   });
}
