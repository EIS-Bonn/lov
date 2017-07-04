
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema

  
/**
 * Getters
 */

var getName = function (name) {
  return name
}

var getDescription = function (description) {
  return description
}

var getNbOccurrences = function (nbOccurrences) {
  return nbOccurrences
}

/**
 * Setters
 */

var setName = function (name) {
  return name
}

var setDescription = function (description) {
  return description
}

var setNbOccurrences = function (nbOccurrences) {
  return nbOccurrences
}


  
/**
 * Pilot Schema
 */

var PilotSchema = new Schema({
  //atrillos
  name: {type : String, default : '', trim : true},
  description: {type : String, default : '', trim : true},  
  nbOccurrences: {type: Number}
})

/**
 * Statics
 */

PilotSchema.statics = {

  /**
   * Find pilot by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */
  loadFromName: function (name, cb) {
    this.findOne({name : name})
      .exec(cb)
  },
  
  load: function (id, cb) {
    this.findOne({_id : id})
      .exec(cb)
  },

  listPilots: function (cb) {
    this.find({},{"_id":0}).sort({'name':1}).exec(cb)
  },

  mostPopularPilots: function (nbItemsRequired, cb) {
    this.find({},{"_id":0}).sort({'nbOccurrences':-1}).limit(nbItemsRequired).exec(cb)
  },

  findPilot: function (name, cb) {    
   this.findOne({name})
      .exec(cb)
  },

}

mongoose.model('Pilot', PilotSchema)
