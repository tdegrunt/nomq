redis = require 'redis'
{EventEmitter} = require 'events'

# Base class
module.exports.NoMQ = class NoMQ extends EventEmitter

  constructor: ->
    @client = redis.createClient()
    @pubClient = redis.createClient()
    @subClient = redis.createClient()

  quit: ->
    @client.quit()
    @pubClient.quit()
    @subClient.quit()

# Requester
module.exports.Requester = class Requester extends NoMQ

  constructor: (@identity) ->
    super
    @subClient.subscribe "#{@identity}-response"
    @subClient.on "message", (channel, msg) =>
      if channel == "#{@identity}-response"
        @emit 'reply', JSON.parse(msg)

  request: (message) ->
    @client.lpush @identity, JSON.stringify(message)
    @pubClient.publish "#{@identity}-announce", "announce"

# Replier
module.exports.Replier = class Replier extends NoMQ

  constructor: (@identity) ->
    super
    @handshake()

    # TODO: Check for backlog. This is over-simplified, especially in case of multiple workers
    @client.llen @identity, (err, length) =>
      for i in [1..length]
        @readRequest()

  handshake: ->
    @subClient.subscribe "#{@identity}-announce"
    @subClient.on "message", (channel, msg) =>
      if channel == "#{@identity}-announce"
        @readRequest()
     
  readRequest: ->
    @client.rpop @identity, (err, msg) =>
      @emit 'request', JSON.parse(msg) if msg
 
  reply: (message) ->
    @pubClient.publish "#{@identity}-response", JSON.stringify(message)

