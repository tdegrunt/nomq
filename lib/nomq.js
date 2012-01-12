(function() {
  var EventEmitter, NoMQ, Replier, Requester, redis;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  redis = require('redis');

  EventEmitter = require('events').EventEmitter;

  module.exports.NoMQ = NoMQ = (function() {

    __extends(NoMQ, EventEmitter);

    function NoMQ() {
      this.client = redis.createClient();
      this.pubClient = redis.createClient();
      this.subClient = redis.createClient();
    }

    NoMQ.prototype.quit = function() {
      this.client.quit();
      this.pubClient.quit();
      return this.subClient.quit();
    };

    return NoMQ;

  })();

  module.exports.Requester = Requester = (function() {

    __extends(Requester, NoMQ);

    function Requester(identity) {
      var _this = this;
      this.identity = identity;
      Requester.__super__.constructor.apply(this, arguments);
      this.subClient.subscribe("" + this.identity + "-response");
      this.subClient.on("message", function(channel, msg) {
        if (channel === ("" + _this.identity + "-response")) {
          return _this.emit('reply', JSON.parse(msg));
        }
      });
    }

    Requester.prototype.request = function(message) {
      this.client.lpush(this.identity, JSON.stringify(message));
      return this.pubClient.publish("" + this.identity + "-announce", "announce");
    };

    return Requester;

  })();

  module.exports.Replier = Replier = (function() {

    __extends(Replier, NoMQ);

    function Replier(identity) {
      var _this = this;
      this.identity = identity;
      Replier.__super__.constructor.apply(this, arguments);
      this.handshake();
      this.client.llen(this.identity, function(err, length) {
        var i, _results;
        _results = [];
        for (i = 1; 1 <= length ? i <= length : i >= length; 1 <= length ? i++ : i--) {
          _results.push(_this.readRequest());
        }
        return _results;
      });
    }

    Replier.prototype.handshake = function() {
      var _this = this;
      this.subClient.subscribe("" + this.identity + "-announce");
      return this.subClient.on("message", function(channel, msg) {
        if (channel === ("" + _this.identity + "-announce")) {
          return _this.readRequest();
        }
      });
    };

    Replier.prototype.readRequest = function() {
      var _this = this;
      return this.client.rpop(this.identity, function(err, msg) {
        if (msg) return _this.emit('request', JSON.parse(msg));
      });
    };

    Replier.prototype.reply = function(message) {
      return this.pubClient.publish("" + this.identity + "-response", JSON.stringify(message));
    };

    return Replier;

  })();

}).call(this);
