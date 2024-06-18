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
var _peer = _interopRequireDefault(require("./peer"));
var _events = _interopRequireDefault(require("events"));
var _automerge = _interopRequireDefault(require("automerge"));
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var PeerGroup = exports["default"] = /*#__PURE__*/function (_EventEmitter) {
  function PeerGroup(docSet, wrtc) {
    var _this;
    (0, _classCallCheck2["default"])(this, PeerGroup);
    _this = _callSuper(this, PeerGroup);
    _this.docSet = docSet;
    _this.wrtc = wrtc;
    _this.Peers = {};
    _this.connections = {};
    _this.processSignal = _this.processSignal.bind(_this);
    return _this;
  }
  (0, _inherits2["default"])(PeerGroup, _EventEmitter);
  return (0, _createClass2["default"])(PeerGroup, [{
    key: "join",
    value: function join(session, name) {
      // add ourselves to the peers list with a do-nothing signaller
      // this has to happen after all the listeners register... which suggests
      // we have some kind of an antipattern going
      this.me = this.getOrCreatePeer(session, name, undefined);
    }
  }, {
    key: "close",
    value: function close() {
      for (var id in this.Peers) {
        this.Peers[id].close();
        delete this.Peers[id];
      }
    }
  }, {
    key: "peers",
    value: function peers() {
      return Object.values(this.Peers);
    }
  }, {
    key: "self",
    value: function self() {
      return this.me;
    }
  }, {
    key: "getOrCreatePeer",
    value: function getOrCreatePeer(id, name, handler) {
      var _this2 = this;
      if (!this.Peers[id]) {
        var peer = new _peer["default"](id, name, handler, this.wrtc);
        this.Peers[id] = peer;
        this.connections[id] = new _automerge["default"].Connection(this.docSet, function (msg) {
          console.log('send to ' + id + ':', msg);
          peer.send(msg);
        });
        peer.on('message', function (msg) {
          console.log('receive from ' + id + ':', msg);
          _this2.connections[id].receiveMsg(msg);
        });
        peer.on('closed', function () {
          _this2.connections[id].close();
          delete _this2.connections[id];
          delete _this2.Peers[id];
        });
        this.connections[id].open();
        this.emit("peer", peer);
      }
      return this.Peers[id];
    }
  }, {
    key: "processSignal",
    value: function processSignal(msg, signal, handler) {
      var id = msg.session;
      if (!id) throw new Error("Tried to process a signal that had no peer ID");
      var name = msg.name;
      var peer;
      switch (msg.action) {
        case "hello":
          // on a "hello" we throw out the peer
          if (this.Peers[id]) console.log("ALREADY HAVE A PEER UNDERWAY - NEW HELLO - RESET", id);
          delete this.Peers[id];
          peer = this.getOrCreatePeer(id, name, handler);
          peer.establishDataChannel();
          break;
        case "offer":
          // on an "offer" we can create a peer if we don't have one
          // but this is might get wonky, since it could be a peer that's trying to reconnect 
          peer = this.getOrCreatePeer(id, name, handler);
          peer.handleSignal(signal);
          break;
        case "reply":
          peer = this.Peers[id]; // we definitely don't want replies for unknown peers.
          if (!peer) throw "Received an offer or a reply for a peer we don't have registered.";
          peer.handleSignal(signal);
          break;
        default:
          throw new Error("Unrecognized signal:", signal);
      }
    }
  }]);
}(_events["default"]);