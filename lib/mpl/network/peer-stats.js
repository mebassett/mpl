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
var PeerStats = exports["default"] = /*#__PURE__*/function (_EventEmitter) {
  function PeerStats(peergroup) {
    var _this;
    (0, _classCallCheck2["default"])(this, PeerStats);
    _this = _callSuper(this, PeerStats);
    _this.peergroup = peergroup;
    _this.peerStats = {};
    _this.peergroup.on('peer', function (peer) {
      console.log("ON PEER", peer.id, peer.self);
      _this.peerStats[peer.id] = {
        connected: peer.self,
        self: peer.self,
        name: peer.name,
        lastActivity: Date.now(),
        messagesSent: 0,
        messagesReceived: 0
      };
      _this.emit('peer');
      peer.on('disconnect', function () {
        _this.peerStats[peer.id].connected = peer.self;
        _this.emit('peer');
      });
      peer.on('closed', function () {
        delete _this.peerStats[peer.id];
        _this.emit('peer');
      });
      peer.on('connect', function () {
        _this.peerStats[peer.id].connected = true;
        _this.peerStats[peer.id].lastActivity = Date.now();
        _this.emit('peer');
      });
      peer.on('rename', function (name) {
        // this is only used for self
        _this.peerStats[peer.id].name = name;
        _this.emit('peer');
      });
      peer.on('message', function (m) {
        if (m.name) {
          // this comes in off the network
          _this.peerStats[peer.id].name = m.name;
        }
        if (m.docId) {
          _this.peerStats[peer.id].docId = m.docId;
        }
        if (m.docTitle) {
          _this.peerStats[peer.id].docTitle = m.docTitle;
        }
        _this.peerStats[peer.id].lastActivity = Date.now();
        _this.peerStats[peer.id].messagesReceived += 1;
        _this.emit('peer');
      });
      peer.on('sent', function (m) {
        _this.peerStats[peer.id].messagesSent += 1;
        _this.emit('peer');
      });
    });
    return _this;
  }
  (0, _inherits2["default"])(PeerStats, _EventEmitter);
  return (0, _createClass2["default"])(PeerStats, [{
    key: "getStats",
    value: function getStats() {
      return this.peerStats;
    }
  }]);
}(_events["default"]);