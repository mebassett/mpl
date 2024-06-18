"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _events = _interopRequireDefault(require("events"));
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var bonjour = require('bonjour')();
var WebSocket = require('ws');
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');
var BonjourSignaller = exports["default"] = /*#__PURE__*/function (_EventEmitter) {
  function BonjourSignaller(peergroup) {
    var _this;
    (0, _classCallCheck2["default"])(this, BonjourSignaller);
    _this = _callSuper(this, BonjourSignaller);
    _this.PORT = process.env.PORT || 3000 + Math.floor(Math.random() * 1000);
    _this.peergroup = peergroup;
    return _this;
  }
  (0, _inherits2["default"])(BonjourSignaller, _EventEmitter);
  return (0, _createClass2["default"])(BonjourSignaller, [{
    key: "start",
    value: function start() {
      this.enableNetworking();
      this.emit('connect');
    }
  }, {
    key: "stop",
    value: function stop() {
      this.disableNetworking();
      this.emit('disconnect');
    }
  }, {
    key: "prepareSignalServer",
    value: function prepareSignalServer() {
      var _this2 = this;
      console.log("prepareSignalServer: listening on ", this.PORT);
      this.wss = new WebSocket.Server({
        port: this.PORT
      });
      this.wss.on('connection', function (ws) {
        ws.on('message', function (raw) {
          console.log('received: bj %s', raw);
          var signal = JSON.parse(raw);
          if (signal.action == 'hello') {
            _this2.greet(ws, signal);
          } else if (signal.action == 'offer') {
            _this2.hearOffer(ws, signal);
          }
        });
      });
    }

    // if a client attached and just say "hello", we tell them our session and name.
    // this allows clients that might already know us to disconnect without icing.
  }, {
    key: "greet",
    value: function greet(ws, signal) {
      var me = this.peergroup.self();
      ws.send(JSON.stringify({
        action: 'greet',
        session: me.id,
        name: me.name
      }));
    }
  }, {
    key: "enableBonjour",
    value: function enableBonjour() {
      var _this3 = this;
      this.searchBonjour();
      setTimeout(function () {
        _this3.publishBonjour();
      }, 500); // wait half a second to let bonjour detection happen first
    }
  }, {
    key: "disableBonjour",
    value: function disableBonjour() {
      if (this.browser) this.browser.stop();
      if (this.service) this.service.stop();
    }

    // in addition to manually introducing ourselves, we can also check published bonjour
    // postings for services that match what we're looking for.
  }, {
    key: "searchBonjour",
    value: function searchBonjour() {
      var _this4 = this;
      this.browser = bonjour.find({
        type: 'automesh'
      }, function (service) {
        var me = _this4.peergroup.self();
        console.log("peerDiscovery(): ", service.host, ":", service.port);
        console.log("peerDiscovery(): ", service.txt);
        var meta = service.txt;
        if (meta.session == me.id) {
          console.log("peerDiscovery(): Own session.");
          return;
        }
        if (meta.session < me.id) {
          console.log("peerDiscovery(): peer outranks me - wait for them to offer");
          return;
        }
        _this4.hearHello(service.txt.name, service.txt.session, service.host, service.port);
      });
    }
  }, {
    key: "publishBonjour",
    value: function publishBonjour() {
      var me = this.peergroup.self();
      // text is encoded into a k/v object by bonjour
      // bonjour downcases keynames.
      console.log(me);
      var text = {
        session: me.id,
        name: me.name
      };
      var publish = {
        name: 'automesh-' + me.id,
        type: 'automesh',
        port: this.PORT,
        txt: text
      };
      console.log("publishBonjour():", 'automesh-' + me.id, "type:", 'automesh', "port:", this.PORT, "txt:", JSON.stringify(text).split('\n').join(' '));
      this.service = bonjour.publish(publish);
    }
  }, {
    key: "manualHello",
    value: function manualHello(host, port, callback) {
      var _this5 = this;
      console.log("sendOffer():", host + ":" + port);
      var me = this.peergroup.self();
      var msg = {
        name: me.name,
        session: me.id,
        action: 'hello'
      };

      // This is creating a pile of websockets but to do this right I need to
      // queue up messages that arrive here until we have an 'open' websocket and then send them.
      var ws = new WebSocket("ws://" + host + ":" + port + "/");
      ws.on('open', function () {
        if (callback) callback();
        ws.send(JSON.stringify(msg));
      });
      ws.on('message', function (data) {
        console.log(data);
        var greeting = JSON.parse(data);
        if (greeting.session != me.id && !(greeting.session in _this5.peergroup.Peers)) _this5.hearHello(greeting.name, greeting.session, host, port);
      });
      ws.on('error', function (error) {
        if (callback) callback(error);
      });
    }

    // initiated by .start()
  }, {
    key: "enableNetworking",
    value: function enableNetworking() {
      console.log("enableNetworking()");
      this.prepareSignalServer();
    }
  }, {
    key: "disableNetworking",
    value: function disableNetworking() {
      console.log("enableNetworking()");
      if (this.wss) {
        // NB for future debuggers: the server will stay running until all cxns close too
        this.wss.close();
      }
      this.disableBonjour(); // this is safe even if bonjour wasn't enabled.
    }

    // initiated by bonjour `find()` and `manualHello()`.
  }, {
    key: "hearHello",
    value: function hearHello(name, session, host, port) {
      var _this6 = this;
      console.log("hearHello()");
      var meta = {
        name: name,
        session: session,
        action: 'hello'
      };
      this.peergroup.processSignal(meta, undefined, function (offer) {
        return _this6.sendOffer(host, port, offer);
      });
    }

    // initiated by hearHello()
  }, {
    key: "sendOffer",
    value: function sendOffer(host, port, offer) {
      var _this7 = this;
      console.log("sendOffer():", host + ":" + port);
      var me = this.peergroup.self();
      var msg = {
        name: me.name,
        session: me.id,
        action: 'offer'
      };
      msg.body = offer;

      // This is creating a pile of websockets but to do this right I need to
      // queue up messages that arrive here until we have an 'open' websocket and then send them.
      var ws = new WebSocket("ws://" + host + ":" + port + "/");
      ws.on('open', function () {
        ws.send(JSON.stringify(msg));
      });
      ws.on('message', function (data) {
        _this7.hearReply(JSON.parse(data));
      });
    }

    // express calls this in response to a post on "/"
  }, {
    key: "hearOffer",
    value: function hearOffer(ws, signal) {
      var _this8 = this;
      console.log("hearOffer: from", signal.name, "/", signal.session);
      var meta = {
        name: signal.name,
        session: signal.session,
        action: 'offer'
      };
      this.peergroup.processSignal(meta, signal.body, function (reply) {
        var me = _this8.peergroup.self();
        var msg = {
          name: me.name,
          session: me.id,
          body: reply,
          action: 'reply'
        };
        _this8.sendReply(ws, msg);
      });
    }

    // this gets sent over the wire by express.
  }, {
    key: "sendReply",
    value: function sendReply(ws, reply) {
      console.log("sendReply()");
      ws.send(JSON.stringify(reply));
    }

    // request receives this in response to the above.
  }, {
    key: "hearReply",
    value: function hearReply(reply) {
      console.log("hearReply(): from", reply.name, "/", reply.session);
      this.peergroup.processSignal(reply, reply.body, null);
    }
  }]);
}(_events["default"]);