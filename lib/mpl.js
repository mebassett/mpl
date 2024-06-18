"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _store = _interopRequireDefault(require("./mpl/store"));
var _network = _interopRequireDefault(require("./mpl/network"));
var _automerge = _interopRequireDefault(require("automerge"));
var _config = _interopRequireDefault(require("./mpl/config"));
var MPL = {
  Store: _store["default"],
  Automerge: _automerge["default"],
  Network: _network["default"],
  config: _config["default"]
};
var _default = exports["default"] = MPL;