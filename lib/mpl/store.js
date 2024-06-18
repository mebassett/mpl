"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _automerge = _interopRequireDefault(require("automerge"));
var _fs = _interopRequireDefault(require("fs"));
var _v = _interopRequireDefault(require("uuid/v4"));
var _network = _interopRequireDefault(require("./network"));
var _config = _interopRequireDefault(require("./config"));
var Store = exports["default"] = /*#__PURE__*/function () {
  function Store(reducer, network) {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Store);
    // typedef network : (ds: Automerge.DocSet) => MPL.Network 
    this.reducer = reducer;
    this.listeners = [];
    this.state = this.newDocument();
    this.docSet = new _automerge["default"].DocSet();
    this.docSet.setDoc(this.state.docId, this.state);
    this.docSet.registerHandler(function (docId, doc) {
      if (docId === _this.state.docId && doc !== _this.state) {
        _this.state = doc;
        _this.listeners.forEach(function (listener) {
          return listener();
        });
      }
    });
    this.network = network(this.docSet); // || new Network(this.docSet)
    this.network.connect({
      // we use our automerge session ID as the peer id,
      // but we probably want to use the network ID for the document actorIds
      name: _config["default"].name,
      peerId: this.state._state.get("actorId")
    });
  }
  return (0, _createClass2["default"])(Store, [{
    key: "dispatch",
    value: function dispatch(action) {
      var state = this.state;
      var newState;
      switch (action.type) {
        case "NEW_DOCUMENT":
          newState = this.newDocument(state, action);
          break;
        case "OPEN_DOCUMENT":
          newState = this.openDocument(state, action);
          break;
        case "MERGE_DOCUMENT":
          newState = this.mergeDocument(state, action);
          break;
        case "FORK_DOCUMENT":
          newState = this.forkDocument(state, action);
          break;
        default:
          newState = this.reducer(state, action);
      }
      if (this.state.docId !== newState.docId) {
        this.network.broadcastActiveDocId(newState.docId);
      }
      this.state = newState;
      this.docSet.setDoc(newState.docId, newState);
      this.listeners.forEach(function (listener) {
        return listener();
      });
    }
  }, {
    key: "subscribe",
    value: function subscribe(listener) {
      this.listeners.push(listener);
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.state;
    }
  }, {
    key: "getHistory",
    value: function getHistory() {
      return _automerge["default"].getHistory(this.state);
    }
  }, {
    key: "save",
    value: function save() {
      return _automerge["default"].save(this.getState());
    }
  }, {
    key: "forkDocument",
    value: function forkDocument(state, action) {
      return _automerge["default"].change(state, {
        action: action
      }, function (doc) {
        doc.docId = (0, _v["default"])();
      });
    }
  }, {
    key: "openDocument",
    value: function openDocument(state, action) {
      if (action.file) return _automerge["default"].load(action.file);
      if (action.docId) {
        var doc = this.docSet.getDoc(action.docId);
        if (doc) return doc;
        return _automerge["default"].change(_automerge["default"].init(), {
          action: action
        }, function (doc) {
          doc.docId = action.docId;
        });
      }
    }
  }, {
    key: "mergeDocument",
    value: function mergeDocument(state, action) {
      return _automerge["default"].merge(state, _automerge["default"].load(action.file));
    }
  }, {
    key: "newDocument",
    value: function newDocument(state, action) {
      return _automerge["default"].change(_automerge["default"].init(), "new document", function (doc) {
        doc.docId = (0, _v["default"])();
      });
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners() {
      this.listeners = [];
    }
  }, {
    key: "getPeerDocs",
    value: function getPeerDocs() {
      return this.network.getPeerDocs();
    }
  }]);
}();