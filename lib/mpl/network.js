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
var _bonjourSignaler = _interopRequireDefault(require("./network/bonjour-signaler"));
var _webrtcSignaler = _interopRequireDefault(require("./network/webrtc-signaler"));
var _peerStats = _interopRequireDefault(require("./network/peer-stats"));
var _peergroup = _interopRequireDefault(require("./network/peergroup"));
var _events = _interopRequireDefault(require("events"));
var _config = _interopRequireDefault(require("./config"));
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var Network = exports["default"] = /*#__PURE__*/function (_EventEmitter) {
  function Network(docSet, wrtc) {
    var _this;
    (0, _classCallCheck2["default"])(this, Network);
    _this = _callSuper(this, Network);
    _this.peergroup = new _peergroup["default"](docSet, wrtc);
    _this.signaler = new _bonjourSignaler["default"](_this.peergroup);
    _this.webRTCSignaler = new _webrtcSignaler["default"](_this.peergroup);
    _this.peerStats = new _peerStats["default"](_this.peergroup);
    _this.connected = false;
    return _this;
  }
  (0, _inherits2["default"])(Network, _EventEmitter);
  return (0, _createClass2["default"])(Network, [{
    key: "connect",
    value: function connect(config) {
      var _this2 = this;
      if (this.connected) throw "network already connected - disconnect first";

      // allow connect without a config to use the previous connect's config.
      this.config = config || this.config;

      // we define "connect" and "disconnect" for ourselves as whether
      // we're connected to the signaller.
      this.signaler.on('connect', function () {
        _this2.peergroup.self().emit('connect');
      });
      this.signaler.on('disconnect', function () {
        _this2.peergroup.self().emit('disconnect');
      });
      var name = this.config.name || process.env.NAME;
      var peerId = this.config.peerId;
      if (!peerId) throw new Error("peerId required, not found in config");
      this.peergroup.join(peerId, name);
      this.signaler.start();
      this.connected = true;
    }
  }, {
    key: "broadcastActiveDocId",
    value: function broadcastActiveDocId(docId) {
      this.webRTCSignaler.broadcastActiveDocId(docId);
    }
  }, {
    key: "getPeerDocs",
    value: function getPeerDocs() {
      return this.webRTCSignaler.getPeerDocs();
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      if (this.connected == false) throw "network already disconnected - connect first";
      console.log("NETWORK DISCONNECT");
      this.signaler.stop();
      this.peergroup.close();
      this.connected = false;
    }
  }]);
}(_events["default"]);