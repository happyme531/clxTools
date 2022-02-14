// 原代码来自 https://www.bilibili.com/video/BV1EM4y1V7TB, 已获得许可

// //@ts-check

// class 文府别院 {
//     #buying_price;
//     #selling_price;

//     constructor() { };
//     getbuying_price() {
//         return this.#buying_price;
//     };

//     getselling_price() {
//         return this.#selling_price;
//     };
//     getvalue() {
//         this.#buying_price = parseInt(console.rawInput("请输入玉买价:"));
//         console.log("玉买价:" + this.#buying_price);
//         this.#selling_price = parseInt(console.rawInput("请输入流云卖价:"));
//         console.log("流云卖价:" + this.#selling_price);
//     };
// }

// class 全氏山庄 extends 文府别院 {
//     #buying_price;
//     #buying_num;
//     #selling_price;
//     #selling_num;
//     #empty_blank;
//     #money_in_pack;

//     constructor(bp, sp, eb, mip) {
//         super();
//         this.#buying_price = bp;
//         this.#selling_price = sp;
//         this.#empty_blank = eb;
//         this.#money_in_pack = mip;
//     }

//     getvalue() {
//         this.#money_in_pack = parseInt(console.rawInput("请输入包里已有宝钞:"));
//         console.log("包里已有宝钞:" + this.#money_in_pack);
//         this.#empty_blank = parseInt(console.rawInput("请输入空格子个数:"));
//         console.log("空格子个数:" + this.#empty_blank);
//         this.#selling_price = parseInt(console.rawInput("请输入玉卖价:"));
//         console.log("玉卖价:" + this.#selling_price);
//         this.#buying_price = parseInt(console.rawInput("请输入流云买价:"));
//         console.log("流云买价:" + this.#buying_price);
//     }

//     empty_gaining(w) {
//         return 2 * this.#empty_blank * (0 - this.#buying_price + w.getselling_price() - w.getbuying_price())
//     }
//     transfer_gaining(w) {
//         return this.#selling_price - this.#buying_price + w.getselling_price() - w.getbuying_price();

//     }
//     transfer_num(w) {
//         let temp = Math.floor((190000 - this.#money_in_pack - this.empty_gaining(w)) / this.transfer_gaining(w));
//         if (temp % 2 == 0) return temp;
//         else {
//             this.#money_in_pack += this.#selling_price - w.getbuying_price();
//             return temp;
//         }
//     }
//     real_num(w, tn) {
//         let temp = tn;
//         if (this.#money_in_pack + this.empty_gaining(w) + temp * this.transfer_gaining(w) + 2 * w.getbuying_price() > 200000) return temp - 1;
//         else return temp;
//     }

// }

// function main() {
//     console.show();
//     let q = new 全氏山庄(5500, 8000, 6, 100000);
//     let w = new 文府别院();
//     q.getvalue();
//     w.getvalue();
//     q.empty_gaining(w);
//     console.log("每个空可以获得: " + q.empty_gaining(w));
//     q.transfer_gaining(w);
//     console.log("倒单个流云可以获得: " + q.transfer_gaining(w));
//     let tn = Math.floor(q.transfer_num(w));
//     console.log("理想倒的次数是: " + tn);
//     console.log("应该倒的次数是: " + q.real_num(w, tn));
//     return 0;
// }

// main();


function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

var _buying_price = /*#__PURE__*/new WeakMap();

var _selling_price = /*#__PURE__*/new WeakMap();

//@ts-check
var 文府别院 = /*#__PURE__*/function () {
  "use strict";

  function 文府别院() {
    _classCallCheck(this, 文府别院);

    _buying_price.set(this, {
      writable: true,
      value: void 0
    });

    _selling_price.set(this, {
      writable: true,
      value: void 0
    });
  }

  _createClass(文府别院, [{
    key: "getbuying_price",
    value: function getbuying_price() {
      return _classPrivateFieldGet(this, _buying_price);
    }
  }, {
    key: "getselling_price",
    value: function getselling_price() {
      return _classPrivateFieldGet(this, _selling_price);
    }
  }, {
    key: "getvalue",
    value: function getvalue() {
      _classPrivateFieldSet(this, _buying_price, parseInt(console.rawInput("请输入玉买价:")));

      console.log("玉买价:" + _classPrivateFieldGet(this, _buying_price));

      _classPrivateFieldSet(this, _selling_price, parseInt(console.rawInput("请输入流云卖价:")));

      console.log("流云卖价:" + _classPrivateFieldGet(this, _selling_price));
    }
  }]);

  return 文府别院;
}();

var _buying_price2 = /*#__PURE__*/new WeakMap();

var _buying_num = /*#__PURE__*/new WeakMap();

var _selling_price2 = /*#__PURE__*/new WeakMap();

var _selling_num = /*#__PURE__*/new WeakMap();

var _empty_blank = /*#__PURE__*/new WeakMap();

var _money_in_pack = /*#__PURE__*/new WeakMap();

var 全氏山庄 = /*#__PURE__*/function (_文府别院) {
  "use strict";

  _inherits(全氏山庄, _文府别院);

  var _super = _createSuper(全氏山庄);

  function 全氏山庄(bp, sp, eb, mip) {
    var _this;

    _classCallCheck(this, 全氏山庄);

    _this = _super.call(this);

    _buying_price2.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _buying_num.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _selling_price2.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _selling_num.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _empty_blank.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _money_in_pack.set(_assertThisInitialized(_this), {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(_assertThisInitialized(_this), _buying_price2, bp);

    _classPrivateFieldSet(_assertThisInitialized(_this), _selling_price2, sp);

    _classPrivateFieldSet(_assertThisInitialized(_this), _empty_blank, eb);

    _classPrivateFieldSet(_assertThisInitialized(_this), _money_in_pack, mip);

    return _this;
  }

  _createClass(全氏山庄, [{
    key: "getvalue",
    value: function getvalue() {
      _classPrivateFieldSet(this, _money_in_pack, parseInt(console.rawInput("请输入包里已有宝钞:")));

      console.log("包里已有宝钞:" + _classPrivateFieldGet(this, _money_in_pack));

      _classPrivateFieldSet(this, _empty_blank, parseInt(console.rawInput("请输入空格子个数:")));

      console.log("空格子个数:" + _classPrivateFieldGet(this, _empty_blank));

      _classPrivateFieldSet(this, _selling_price2, parseInt(console.rawInput("请输入玉卖价:")));

      console.log("玉卖价:" + _classPrivateFieldGet(this, _selling_price2));

      _classPrivateFieldSet(this, _buying_price2, parseInt(console.rawInput("请输入流云买价:")));

      console.log("流云买价:" + _classPrivateFieldGet(this, _buying_price2));
    }
  }, {
    key: "empty_gaining",
    value: function empty_gaining(w) {
      return 2 * _classPrivateFieldGet(this, _empty_blank) * (0 - _classPrivateFieldGet(this, _buying_price2) + w.getselling_price() - w.getbuying_price());
    }
  }, {
    key: "transfer_gaining",
    value: function transfer_gaining(w) {
      return _classPrivateFieldGet(this, _selling_price2) - _classPrivateFieldGet(this, _buying_price2) + w.getselling_price() - w.getbuying_price();
    }
  }, {
    key: "transfer_num",
    value: function transfer_num(w) {
      var temp = Math.floor((190000 - _classPrivateFieldGet(this, _money_in_pack) - this.empty_gaining(w)) / this.transfer_gaining(w));
      if (temp % 2 == 0) return temp;else {
        _classPrivateFieldSet(this, _money_in_pack, _classPrivateFieldGet(this, _money_in_pack) + (_classPrivateFieldGet(this, _selling_price2) - w.getbuying_price()));

        return temp;
      }
    }
  }, {
    key: "real_num",
    value: function real_num(w, tn) {
      var temp = tn;
      if (_classPrivateFieldGet(this, _money_in_pack) + this.empty_gaining(w) + temp * this.transfer_gaining(w) + 2 * w.getbuying_price() > 200000) return temp - 1;else return temp;
    }
  }]);

  return 全氏山庄;
}(文府别院);

function main() {
  console.show();
  var q = new 全氏山庄(5500, 8000, 6, 100000);
  var w = new 文府别院();
  var mip;
  q.getvalue();
  w.getvalue();
  q.empty_gaining(w);
  console.log("每个空可以获得: " + q.empty_gaining(w));
  q.transfer_gaining(w);
  console.log("倒单个流云可以获得: " + q.transfer_gaining(w));
  var tn = Math.floor(q.transfer_num(w));
  console.log("理想倒的次数是: " + tn);
  console.log("应该倒的次数是: " + q.real_num(w, tn));
  return 0;
}

main();
