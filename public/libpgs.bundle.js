// node_modules/.pnpm/libpgs@0.8.1/node_modules/libpgs/dist/libpgs.js
var t = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
var e = function(t2) {
  return t2 && t2.Math === Math && t2;
};
var r = e("object" == typeof globalThis && globalThis) || e("object" == typeof window && window) || e("object" == typeof self && self) || e("object" == typeof t && t) || e("object" == typeof t && t) || /* @__PURE__ */ (function() {
  return this;
})() || Function("return this")();
var n = {};
var o = function(t2) {
  try {
    return !!t2();
  } catch (t3) {
    return true;
  }
};
var i = !o((function() {
  return 7 !== Object.defineProperty({}, 1, { get: function() {
    return 7;
  } })[1];
}));
var a = !o((function() {
  var t2 = function() {
  }.bind();
  return "function" != typeof t2 || t2.hasOwnProperty("prototype");
}));
var s = a;
var u = Function.prototype.call;
var c = s ? u.bind(u) : function() {
  return u.apply(u, arguments);
};
var f = {};
var h = {}.propertyIsEnumerable;
var p = Object.getOwnPropertyDescriptor;
var d = p && !h.call({ 1: 2 }, 1);
f.f = d ? function(t2) {
  var e2 = p(this, t2);
  return !!e2 && e2.enumerable;
} : h;
var l;
var y;
var v = function(t2, e2) {
  return { enumerable: !(1 & t2), configurable: !(2 & t2), writable: !(4 & t2), value: e2 };
};
var m = a;
var b = Function.prototype;
var g = b.call;
var w = m && b.bind.bind(g, g);
var T = m ? w : function(t2) {
  return function() {
    return g.apply(t2, arguments);
  };
};
var O = T;
var S = O({}.toString);
var P = O("".slice);
var j = function(t2) {
  return P(S(t2), 8, -1);
};
var E = o;
var A = j;
var I = Object;
var U = T("".split);
var R = E((function() {
  return !I("z").propertyIsEnumerable(0);
})) ? function(t2) {
  return "String" === A(t2) ? U(t2, "") : I(t2);
} : I;
var x = function(t2) {
  return null == t2;
};
var D = x;
var C = TypeError;
var B = function(t2) {
  if (D(t2)) throw new C("Can't call method on " + t2);
  return t2;
};
var k = R;
var _ = B;
var F = function(t2) {
  return k(_(t2));
};
var L = "object" == typeof document && document.all;
var N = void 0 === L && void 0 !== L ? function(t2) {
  return "function" == typeof t2 || t2 === L;
} : function(t2) {
  return "function" == typeof t2;
};
var M = N;
var $ = function(t2) {
  return "object" == typeof t2 ? null !== t2 : M(t2);
};
var H = r;
var W = N;
var q = function(t2, e2) {
  return arguments.length < 2 ? (r2 = H[t2], W(r2) ? r2 : void 0) : H[t2] && H[t2][e2];
  var r2;
};
var G = T({}.isPrototypeOf);
var V = r.navigator;
var z = V && V.userAgent;
var X = z ? String(z) : "";
var J = r;
var Y = X;
var K = J.process;
var Z = J.Deno;
var Q = K && K.versions || Z && Z.version;
var tt = Q && Q.v8;
tt && (y = (l = tt.split("."))[0] > 0 && l[0] < 4 ? 1 : +(l[0] + l[1])), !y && Y && (!(l = Y.match(/Edge\/(\d+)/)) || l[1] >= 74) && (l = Y.match(/Chrome\/(\d+)/)) && (y = +l[1]);
var et = y;
var rt = et;
var nt = o;
var ot = r.String;
var it = !!Object.getOwnPropertySymbols && !nt((function() {
  var t2 = /* @__PURE__ */ Symbol("symbol detection");
  return !ot(t2) || !(Object(t2) instanceof Symbol) || !Symbol.sham && rt && rt < 41;
}));
var at = it && !Symbol.sham && "symbol" == typeof Symbol.iterator;
var st = q;
var ut = N;
var ct = G;
var ft = Object;
var ht = at ? function(t2) {
  return "symbol" == typeof t2;
} : function(t2) {
  var e2 = st("Symbol");
  return ut(e2) && ct(e2.prototype, ft(t2));
};
var pt = String;
var dt = function(t2) {
  try {
    return pt(t2);
  } catch (t3) {
    return "Object";
  }
};
var lt = N;
var yt = dt;
var vt = TypeError;
var mt = function(t2) {
  if (lt(t2)) return t2;
  throw new vt(yt(t2) + " is not a function");
};
var bt = mt;
var gt = x;
var wt = function(t2, e2) {
  var r2 = t2[e2];
  return gt(r2) ? void 0 : bt(r2);
};
var Tt = c;
var Ot = N;
var St = $;
var Pt = TypeError;
var jt = { exports: {} };
var Et = r;
var At = Object.defineProperty;
var It = function(t2, e2) {
  try {
    At(Et, t2, { value: e2, configurable: true, writable: true });
  } catch (r2) {
    Et[t2] = e2;
  }
  return e2;
};
var Ut = r;
var Rt = It;
var xt = "__core-js_shared__";
var Dt = jt.exports = Ut[xt] || Rt(xt, {});
(Dt.versions || (Dt.versions = [])).push({ version: "3.38.1", mode: "global", copyright: "\xA9 2014-2024 Denis Pushkarev (zloirock.ru)", license: "https://github.com/zloirock/core-js/blob/v3.38.1/LICENSE", source: "https://github.com/zloirock/core-js" });
var Ct = jt.exports;
var Bt = Ct;
var kt = function(t2, e2) {
  return Bt[t2] || (Bt[t2] = e2 || {});
};
var _t = B;
var Ft = Object;
var Lt = function(t2) {
  return Ft(_t(t2));
};
var Nt = Lt;
var Mt = T({}.hasOwnProperty);
var $t = Object.hasOwn || function(t2, e2) {
  return Mt(Nt(t2), e2);
};
var Ht = T;
var Wt = 0;
var qt = Math.random();
var Gt = Ht(1 .toString);
var Vt = function(t2) {
  return "Symbol(" + (void 0 === t2 ? "" : t2) + ")_" + Gt(++Wt + qt, 36);
};
var zt = kt;
var Xt = $t;
var Jt = Vt;
var Yt = it;
var Kt = at;
var Zt = r.Symbol;
var Qt = zt("wks");
var te = Kt ? Zt.for || Zt : Zt && Zt.withoutSetter || Jt;
var ee = function(t2) {
  return Xt(Qt, t2) || (Qt[t2] = Yt && Xt(Zt, t2) ? Zt[t2] : te("Symbol." + t2)), Qt[t2];
};
var re = c;
var ne = $;
var oe = ht;
var ie = wt;
var ae = function(t2, e2) {
  var r2, n2;
  if ("string" === e2 && Ot(r2 = t2.toString) && !St(n2 = Tt(r2, t2))) return n2;
  if (Ot(r2 = t2.valueOf) && !St(n2 = Tt(r2, t2))) return n2;
  if ("string" !== e2 && Ot(r2 = t2.toString) && !St(n2 = Tt(r2, t2))) return n2;
  throw new Pt("Can't convert object to primitive value");
};
var se = TypeError;
var ue = ee("toPrimitive");
var ce = function(t2, e2) {
  if (!ne(t2) || oe(t2)) return t2;
  var r2, n2 = ie(t2, ue);
  if (n2) {
    if (void 0 === e2 && (e2 = "default"), r2 = re(n2, t2, e2), !ne(r2) || oe(r2)) return r2;
    throw new se("Can't convert object to primitive value");
  }
  return void 0 === e2 && (e2 = "number"), ae(t2, e2);
};
var fe = ht;
var he = function(t2) {
  var e2 = ce(t2, "string");
  return fe(e2) ? e2 : e2 + "";
};
var pe = $;
var de = r.document;
var le = pe(de) && pe(de.createElement);
var ye = function(t2) {
  return le ? de.createElement(t2) : {};
};
var ve = ye;
var me = !i && !o((function() {
  return 7 !== Object.defineProperty(ve("div"), "a", { get: function() {
    return 7;
  } }).a;
}));
var be = i;
var ge = c;
var we = f;
var Te = v;
var Oe = F;
var Se = he;
var Pe = $t;
var je = me;
var Ee = Object.getOwnPropertyDescriptor;
n.f = be ? Ee : function(t2, e2) {
  if (t2 = Oe(t2), e2 = Se(e2), je) try {
    return Ee(t2, e2);
  } catch (t3) {
  }
  if (Pe(t2, e2)) return Te(!ge(we.f, t2, e2), t2[e2]);
};
var Ae = {};
var Ie = i && o((function() {
  return 42 !== Object.defineProperty((function() {
  }), "prototype", { value: 42, writable: false }).prototype;
}));
var Ue = $;
var Re = String;
var xe = TypeError;
var De = function(t2) {
  if (Ue(t2)) return t2;
  throw new xe(Re(t2) + " is not an object");
};
var Ce = i;
var Be = me;
var ke = Ie;
var _e = De;
var Fe = he;
var Le = TypeError;
var Ne = Object.defineProperty;
var Me = Object.getOwnPropertyDescriptor;
var $e = "enumerable";
var He = "configurable";
var We = "writable";
Ae.f = Ce ? ke ? function(t2, e2, r2) {
  if (_e(t2), e2 = Fe(e2), _e(r2), "function" == typeof t2 && "prototype" === e2 && "value" in r2 && We in r2 && !r2[We]) {
    var n2 = Me(t2, e2);
    n2 && n2[We] && (t2[e2] = r2.value, r2 = { configurable: He in r2 ? r2[He] : n2[He], enumerable: $e in r2 ? r2[$e] : n2[$e], writable: false });
  }
  return Ne(t2, e2, r2);
} : Ne : function(t2, e2, r2) {
  if (_e(t2), e2 = Fe(e2), _e(r2), Be) try {
    return Ne(t2, e2, r2);
  } catch (t3) {
  }
  if ("get" in r2 || "set" in r2) throw new Le("Accessors not supported");
  return "value" in r2 && (t2[e2] = r2.value), t2;
};
var qe = Ae;
var Ge = v;
var Ve = i ? function(t2, e2, r2) {
  return qe.f(t2, e2, Ge(1, r2));
} : function(t2, e2, r2) {
  return t2[e2] = r2, t2;
};
var ze = { exports: {} };
var Xe = i;
var Je = $t;
var Ye = Function.prototype;
var Ke = Xe && Object.getOwnPropertyDescriptor;
var Ze = Je(Ye, "name");
var Qe = { EXISTS: Ze, PROPER: Ze && "something" === function() {
}.name, CONFIGURABLE: Ze && (!Xe || Xe && Ke(Ye, "name").configurable) };
var tr = N;
var er = Ct;
var rr = T(Function.toString);
tr(er.inspectSource) || (er.inspectSource = function(t2) {
  return rr(t2);
});
var nr;
var or;
var ir;
var ar = er.inspectSource;
var sr = N;
var ur = r.WeakMap;
var cr = sr(ur) && /native code/.test(String(ur));
var fr = Vt;
var hr = kt("keys");
var pr = function(t2) {
  return hr[t2] || (hr[t2] = fr(t2));
};
var dr = {};
var lr = cr;
var yr = r;
var vr = $;
var mr = Ve;
var br = $t;
var gr = Ct;
var wr = pr;
var Tr = dr;
var Or = "Object already initialized";
var Sr = yr.TypeError;
var Pr = yr.WeakMap;
if (lr || gr.state) {
  jr = gr.state || (gr.state = new Pr());
  jr.get = jr.get, jr.has = jr.has, jr.set = jr.set, nr = function(t2, e2) {
    if (jr.has(t2)) throw new Sr(Or);
    return e2.facade = t2, jr.set(t2, e2), e2;
  }, or = function(t2) {
    return jr.get(t2) || {};
  }, ir = function(t2) {
    return jr.has(t2);
  };
} else {
  Er = wr("state");
  Tr[Er] = true, nr = function(t2, e2) {
    if (br(t2, Er)) throw new Sr(Or);
    return e2.facade = t2, mr(t2, Er, e2), e2;
  }, or = function(t2) {
    return br(t2, Er) ? t2[Er] : {};
  }, ir = function(t2) {
    return br(t2, Er);
  };
}
var jr;
var Er;
var Ar = { set: nr, get: or, has: ir, enforce: function(t2) {
  return ir(t2) ? or(t2) : nr(t2, {});
}, getterFor: function(t2) {
  return function(e2) {
    var r2;
    if (!vr(e2) || (r2 = or(e2)).type !== t2) throw new Sr("Incompatible receiver, " + t2 + " required");
    return r2;
  };
} };
var Ir = T;
var Ur = o;
var Rr = N;
var xr = $t;
var Dr = i;
var Cr = Qe.CONFIGURABLE;
var Br = ar;
var kr = Ar.enforce;
var _r = Ar.get;
var Fr = String;
var Lr = Object.defineProperty;
var Nr = Ir("".slice);
var Mr = Ir("".replace);
var $r = Ir([].join);
var Hr = Dr && !Ur((function() {
  return 8 !== Lr((function() {
  }), "length", { value: 8 }).length;
}));
var Wr = String(String).split("String");
var qr = ze.exports = function(t2, e2, r2) {
  "Symbol(" === Nr(Fr(e2), 0, 7) && (e2 = "[" + Mr(Fr(e2), /^Symbol\(([^)]*)\).*$/, "$1") + "]"), r2 && r2.getter && (e2 = "get " + e2), r2 && r2.setter && (e2 = "set " + e2), (!xr(t2, "name") || Cr && t2.name !== e2) && (Dr ? Lr(t2, "name", { value: e2, configurable: true }) : t2.name = e2), Hr && r2 && xr(r2, "arity") && t2.length !== r2.arity && Lr(t2, "length", { value: r2.arity });
  try {
    r2 && xr(r2, "constructor") && r2.constructor ? Dr && Lr(t2, "prototype", { writable: false }) : t2.prototype && (t2.prototype = void 0);
  } catch (t3) {
  }
  var n2 = kr(t2);
  return xr(n2, "source") || (n2.source = $r(Wr, "string" == typeof e2 ? e2 : "")), t2;
};
Function.prototype.toString = qr((function() {
  return Rr(this) && _r(this).source || Br(this);
}), "toString");
var Gr = ze.exports;
var Vr = N;
var zr = Ae;
var Xr = Gr;
var Jr = It;
var Yr = function(t2, e2, r2, n2) {
  n2 || (n2 = {});
  var o2 = n2.enumerable, i2 = void 0 !== n2.name ? n2.name : e2;
  if (Vr(r2) && Xr(r2, i2, n2), n2.global) o2 ? t2[e2] = r2 : Jr(e2, r2);
  else {
    try {
      n2.unsafe ? t2[e2] && (o2 = true) : delete t2[e2];
    } catch (t3) {
    }
    o2 ? t2[e2] = r2 : zr.f(t2, e2, { value: r2, enumerable: false, configurable: !n2.nonConfigurable, writable: !n2.nonWritable });
  }
  return t2;
};
var Kr = {};
var Zr = Math.ceil;
var Qr = Math.floor;
var tn = Math.trunc || function(t2) {
  var e2 = +t2;
  return (e2 > 0 ? Qr : Zr)(e2);
};
var en = function(t2) {
  var e2 = +t2;
  return e2 != e2 || 0 === e2 ? 0 : tn(e2);
};
var rn = en;
var nn = Math.max;
var on = Math.min;
var an = en;
var sn = Math.min;
var un = function(t2) {
  var e2 = an(t2);
  return e2 > 0 ? sn(e2, 9007199254740991) : 0;
};
var cn = function(t2) {
  return un(t2.length);
};
var fn = F;
var hn = function(t2, e2) {
  var r2 = rn(t2);
  return r2 < 0 ? nn(r2 + e2, 0) : on(r2, e2);
};
var pn = cn;
var dn = function(t2) {
  return function(e2, r2, n2) {
    var o2 = fn(e2), i2 = pn(o2);
    if (0 === i2) return !t2 && -1;
    var a2, s2 = hn(n2, i2);
    if (t2 && r2 != r2) {
      for (; i2 > s2; ) if ((a2 = o2[s2++]) != a2) return true;
    } else for (; i2 > s2; s2++) if ((t2 || s2 in o2) && o2[s2] === r2) return t2 || s2 || 0;
    return !t2 && -1;
  };
};
var ln = { includes: dn(true), indexOf: dn(false) };
var yn = $t;
var vn = F;
var mn = ln.indexOf;
var bn = dr;
var gn = T([].push);
var wn = function(t2, e2) {
  var r2, n2 = vn(t2), o2 = 0, i2 = [];
  for (r2 in n2) !yn(bn, r2) && yn(n2, r2) && gn(i2, r2);
  for (; e2.length > o2; ) yn(n2, r2 = e2[o2++]) && (~mn(i2, r2) || gn(i2, r2));
  return i2;
};
var Tn = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
var On = wn;
var Sn = Tn.concat("length", "prototype");
Kr.f = Object.getOwnPropertyNames || function(t2) {
  return On(t2, Sn);
};
var Pn = {};
Pn.f = Object.getOwnPropertySymbols;
var jn = q;
var En = Kr;
var An = Pn;
var In = De;
var Un = T([].concat);
var Rn = jn("Reflect", "ownKeys") || function(t2) {
  var e2 = En.f(In(t2)), r2 = An.f;
  return r2 ? Un(e2, r2(t2)) : e2;
};
var xn = $t;
var Dn = Rn;
var Cn = n;
var Bn = Ae;
var kn = function(t2, e2, r2) {
  for (var n2 = Dn(e2), o2 = Bn.f, i2 = Cn.f, a2 = 0; a2 < n2.length; a2++) {
    var s2 = n2[a2];
    xn(t2, s2) || r2 && xn(r2, s2) || o2(t2, s2, i2(e2, s2));
  }
};
var _n = o;
var Fn = N;
var Ln = /#|\.prototype\./;
var Nn = function(t2, e2) {
  var r2 = $n[Mn(t2)];
  return r2 === Wn || r2 !== Hn && (Fn(e2) ? _n(e2) : !!e2);
};
var Mn = Nn.normalize = function(t2) {
  return String(t2).replace(Ln, ".").toLowerCase();
};
var $n = Nn.data = {};
var Hn = Nn.NATIVE = "N";
var Wn = Nn.POLYFILL = "P";
var qn = Nn;
var Gn = r;
var Vn = n.f;
var zn = Ve;
var Xn = Yr;
var Jn = It;
var Yn = kn;
var Kn = qn;
var Zn = function(t2, e2) {
  var r2, n2, o2, i2, a2, s2 = t2.target, u2 = t2.global, c2 = t2.stat;
  if (r2 = u2 ? Gn : c2 ? Gn[s2] || Jn(s2, {}) : Gn[s2] && Gn[s2].prototype) for (n2 in e2) {
    if (i2 = e2[n2], o2 = t2.dontCallGetSet ? (a2 = Vn(r2, n2)) && a2.value : r2[n2], !Kn(u2 ? n2 : s2 + (c2 ? "." : "#") + n2, t2.forced) && void 0 !== o2) {
      if (typeof i2 == typeof o2) continue;
      Yn(i2, o2);
    }
    (t2.sham || o2 && o2.sham) && zn(i2, "sham", true), Xn(r2, n2, i2, t2);
  }
};
var Qn = !o((function() {
  function t2() {
  }
  return t2.prototype.constructor = null, Object.getPrototypeOf(new t2()) !== t2.prototype;
}));
var to = $t;
var eo = N;
var ro = Lt;
var no = Qn;
var oo = pr("IE_PROTO");
var io = Object;
var ao = io.prototype;
var so = no ? io.getPrototypeOf : function(t2) {
  var e2 = ro(t2);
  if (to(e2, oo)) return e2[oo];
  var r2 = e2.constructor;
  return eo(r2) && e2 instanceof r2 ? r2.prototype : e2 instanceof io ? ao : null;
};
var uo = T;
var co = mt;
var fo = $;
var ho = function(t2) {
  return fo(t2) || null === t2;
};
var po = String;
var lo = TypeError;
var yo = function(t2, e2, r2) {
  try {
    return uo(co(Object.getOwnPropertyDescriptor(t2, e2)[r2]));
  } catch (t3) {
  }
};
var vo = $;
var mo = B;
var bo = function(t2) {
  if (ho(t2)) return t2;
  throw new lo("Can't set " + po(t2) + " as a prototype");
};
var go = Object.setPrototypeOf || ("__proto__" in {} ? (function() {
  var t2, e2 = false, r2 = {};
  try {
    (t2 = yo(Object.prototype, "__proto__", "set"))(r2, []), e2 = r2 instanceof Array;
  } catch (t3) {
  }
  return function(r3, n2) {
    return mo(r3), bo(n2), vo(r3) ? (e2 ? t2(r3, n2) : r3.__proto__ = n2, r3) : r3;
  };
})() : void 0);
var wo = {};
var To = wn;
var Oo = Tn;
var So = Object.keys || function(t2) {
  return To(t2, Oo);
};
var Po = i;
var jo = Ie;
var Eo = Ae;
var Ao = De;
var Io = F;
var Uo = So;
wo.f = Po && !jo ? Object.defineProperties : function(t2, e2) {
  Ao(t2);
  for (var r2, n2 = Io(e2), o2 = Uo(e2), i2 = o2.length, a2 = 0; i2 > a2; ) Eo.f(t2, r2 = o2[a2++], n2[r2]);
  return t2;
};
var Ro;
var xo = q("document", "documentElement");
var Do = De;
var Co = wo;
var Bo = Tn;
var ko = dr;
var _o = xo;
var Fo = ye;
var Lo = "prototype";
var No = "script";
var Mo = pr("IE_PROTO");
var $o = function() {
};
var Ho = function(t2) {
  return "<" + No + ">" + t2 + "</" + No + ">";
};
var Wo = function(t2) {
  t2.write(Ho("")), t2.close();
  var e2 = t2.parentWindow.Object;
  return t2 = null, e2;
};
var qo = function() {
  try {
    Ro = new ActiveXObject("htmlfile");
  } catch (t3) {
  }
  var t2, e2, r2;
  qo = "undefined" != typeof document ? document.domain && Ro ? Wo(Ro) : (e2 = Fo("iframe"), r2 = "java" + No + ":", e2.style.display = "none", _o.appendChild(e2), e2.src = String(r2), (t2 = e2.contentWindow.document).open(), t2.write(Ho("document.F=Object")), t2.close(), t2.F) : Wo(Ro);
  for (var n2 = Bo.length; n2--; ) delete qo[Lo][Bo[n2]];
  return qo();
};
ko[Mo] = true;
var Go = Object.create || function(t2, e2) {
  var r2;
  return null !== t2 ? ($o[Lo] = Do(t2), r2 = new $o(), $o[Lo] = null, r2[Mo] = t2) : r2 = qo(), void 0 === e2 ? r2 : Co.f(r2, e2);
};
var Vo = $;
var zo = Ve;
var Xo = Error;
var Jo = T("".replace);
var Yo = String(new Xo("zxcasd").stack);
var Ko = /\n\s*at [^:]*:[^\n]*/;
var Zo = Ko.test(Yo);
var Qo = v;
var ti = !o((function() {
  var t2 = new Error("a");
  return !("stack" in t2) || (Object.defineProperty(t2, "stack", Qo(1, 7)), 7 !== t2.stack);
}));
var ei = Ve;
var ri = function(t2, e2) {
  if (Zo && "string" == typeof t2 && !Xo.prepareStackTrace) for (; e2--; ) t2 = Jo(t2, Ko, "");
  return t2;
};
var ni = ti;
var oi = Error.captureStackTrace;
var ii = j;
var ai = T;
var si = function(t2) {
  if ("Function" === ii(t2)) return ai(t2);
};
var ui = mt;
var ci = a;
var fi = si(si.bind);
var hi = function(t2, e2) {
  return ui(t2), void 0 === e2 ? t2 : ci ? fi(t2, e2) : function() {
    return t2.apply(e2, arguments);
  };
};
var pi = {};
var di = pi;
var li = ee("iterator");
var yi = Array.prototype;
var vi = {};
vi[ee("toStringTag")] = "z";
var mi = "[object z]" === String(vi);
var bi = mi;
var gi = N;
var wi = j;
var Ti = ee("toStringTag");
var Oi = Object;
var Si = "Arguments" === wi(/* @__PURE__ */ (function() {
  return arguments;
})());
var Pi = bi ? wi : function(t2) {
  var e2, r2, n2;
  return void 0 === t2 ? "Undefined" : null === t2 ? "Null" : "string" == typeof (r2 = (function(t3, e3) {
    try {
      return t3[e3];
    } catch (t4) {
    }
  })(e2 = Oi(t2), Ti)) ? r2 : Si ? wi(e2) : "Object" === (n2 = wi(e2)) && gi(e2.callee) ? "Arguments" : n2;
};
var ji = Pi;
var Ei = wt;
var Ai = x;
var Ii = pi;
var Ui = ee("iterator");
var Ri = function(t2) {
  if (!Ai(t2)) return Ei(t2, Ui) || Ei(t2, "@@iterator") || Ii[ji(t2)];
};
var xi = c;
var Di = mt;
var Ci = De;
var Bi = dt;
var ki = Ri;
var _i = TypeError;
var Fi = c;
var Li = De;
var Ni = wt;
var Mi = hi;
var $i = c;
var Hi = De;
var Wi = dt;
var qi = function(t2) {
  return void 0 !== t2 && (di.Array === t2 || yi[li] === t2);
};
var Gi = cn;
var Vi = G;
var zi = function(t2, e2) {
  var r2 = arguments.length < 2 ? ki(t2) : e2;
  if (Di(r2)) return Ci(xi(r2, t2));
  throw new _i(Bi(t2) + " is not iterable");
};
var Xi = Ri;
var Ji = function(t2, e2, r2) {
  var n2, o2;
  Li(t2);
  try {
    if (!(n2 = Ni(t2, "return"))) {
      if ("throw" === e2) throw r2;
      return r2;
    }
    n2 = Fi(n2, t2);
  } catch (t3) {
    o2 = true, n2 = t3;
  }
  if ("throw" === e2) throw r2;
  if (o2) throw n2;
  return Li(n2), r2;
};
var Yi = TypeError;
var Ki = function(t2, e2) {
  this.stopped = t2, this.result = e2;
};
var Zi = Ki.prototype;
var Qi = function(t2, e2, r2) {
  var n2, o2, i2, a2, s2, u2, c2, f2 = r2 && r2.that, h2 = !(!r2 || !r2.AS_ENTRIES), p2 = !(!r2 || !r2.IS_RECORD), d2 = !(!r2 || !r2.IS_ITERATOR), l2 = !(!r2 || !r2.INTERRUPTED), y2 = Mi(e2, f2), v2 = function(t3) {
    return n2 && Ji(n2, "normal", t3), new Ki(true, t3);
  }, m2 = function(t3) {
    return h2 ? (Hi(t3), l2 ? y2(t3[0], t3[1], v2) : y2(t3[0], t3[1])) : l2 ? y2(t3, v2) : y2(t3);
  };
  if (p2) n2 = t2.iterator;
  else if (d2) n2 = t2;
  else {
    if (!(o2 = Xi(t2))) throw new Yi(Wi(t2) + " is not iterable");
    if (qi(o2)) {
      for (i2 = 0, a2 = Gi(t2); a2 > i2; i2++) if ((s2 = m2(t2[i2])) && Vi(Zi, s2)) return s2;
      return new Ki(false);
    }
    n2 = zi(t2, o2);
  }
  for (u2 = p2 ? t2.next : n2.next; !(c2 = $i(u2, n2)).done; ) {
    try {
      s2 = m2(c2.value);
    } catch (t3) {
      Ji(n2, "throw", t3);
    }
    if ("object" == typeof s2 && s2 && Vi(Zi, s2)) return s2;
  }
  return new Ki(false);
};
var ta = Pi;
var ea = String;
var ra = function(t2) {
  if ("Symbol" === ta(t2)) throw new TypeError("Cannot convert a Symbol value to a string");
  return ea(t2);
};
var na = ra;
var oa = Zn;
var ia = G;
var aa = so;
var sa = go;
var ua = kn;
var ca = Go;
var fa = Ve;
var ha = v;
var pa = function(t2, e2) {
  Vo(e2) && "cause" in e2 && zo(t2, "cause", e2.cause);
};
var da = function(t2, e2, r2, n2) {
  ni && (oi ? oi(t2, e2) : ei(t2, "stack", ri(r2, n2)));
};
var la = Qi;
var ya = function(t2, e2) {
  return void 0 === t2 ? arguments.length < 2 ? "" : e2 : na(t2);
};
var va = ee("toStringTag");
var ma = Error;
var ba = [].push;
var ga = function(t2, e2) {
  var r2, n2 = ia(wa, this);
  sa ? r2 = sa(new ma(), n2 ? aa(this) : wa) : (r2 = n2 ? this : ca(wa), fa(r2, va, "Error")), void 0 !== e2 && fa(r2, "message", ya(e2)), da(r2, ga, r2.stack, 1), arguments.length > 2 && pa(r2, arguments[2]);
  var o2 = [];
  return la(t2, ba, { that: o2 }), fa(r2, "errors", o2), r2;
};
sa ? sa(ga, ma) : ua(ga, ma, { name: true });
var wa = ga.prototype = ca(ma.prototype, { constructor: ha(1, ga), message: ha(1, ""), name: ha(1, "AggregateError") });
oa({ global: true, constructor: true, arity: 2 }, { AggregateError: ga });
var Ta = ee;
var Oa = Go;
var Sa = Ae.f;
var Pa = Ta("unscopables");
var ja = Array.prototype;
void 0 === ja[Pa] && Sa(ja, Pa, { configurable: true, value: Oa(null) });
var Ea;
var Aa;
var Ia;
var Ua = o;
var Ra = N;
var xa = $;
var Da = so;
var Ca = Yr;
var Ba = ee("iterator");
var ka = false;
[].keys && ("next" in (Ia = [].keys()) ? (Aa = Da(Da(Ia))) !== Object.prototype && (Ea = Aa) : ka = true);
var _a = !xa(Ea) || Ua((function() {
  var t2 = {};
  return Ea[Ba].call(t2) !== t2;
}));
_a && (Ea = {}), Ra(Ea[Ba]) || Ca(Ea, Ba, (function() {
  return this;
}));
var Fa = { IteratorPrototype: Ea, BUGGY_SAFARI_ITERATORS: ka };
var La = Ae.f;
var Na = $t;
var Ma = ee("toStringTag");
var $a = function(t2, e2, r2) {
  t2 && !r2 && (t2 = t2.prototype), t2 && !Na(t2, Ma) && La(t2, Ma, { configurable: true, value: e2 });
};
var Ha = Fa.IteratorPrototype;
var Wa = Go;
var qa = v;
var Ga = $a;
var Va = pi;
var za = function() {
  return this;
};
var Xa = Zn;
var Ja = c;
var Ya = N;
var Ka = function(t2, e2, r2, n2) {
  var o2 = e2 + " Iterator";
  return t2.prototype = Wa(Ha, { next: qa(+!n2, r2) }), Ga(t2, o2, false), Va[o2] = za, t2;
};
var Za = so;
var Qa = go;
var ts = $a;
var es = Ve;
var rs = Yr;
var ns = pi;
var os = Qe.PROPER;
var is = Qe.CONFIGURABLE;
var as = Fa.IteratorPrototype;
var ss = Fa.BUGGY_SAFARI_ITERATORS;
var us = ee("iterator");
var cs = "keys";
var fs = "values";
var hs = "entries";
var ps = function() {
  return this;
};
var ds = function(t2, e2, r2, n2, o2, i2, a2) {
  Ka(r2, e2, n2);
  var s2, u2, c2, f2 = function(t3) {
    if (t3 === o2 && y2) return y2;
    if (!ss && t3 && t3 in d2) return d2[t3];
    switch (t3) {
      case cs:
      case fs:
      case hs:
        return function() {
          return new r2(this, t3);
        };
    }
    return function() {
      return new r2(this);
    };
  }, h2 = e2 + " Iterator", p2 = false, d2 = t2.prototype, l2 = d2[us] || d2["@@iterator"] || o2 && d2[o2], y2 = !ss && l2 || f2(o2), v2 = "Array" === e2 && d2.entries || l2;
  if (v2 && (s2 = Za(v2.call(new t2()))) !== Object.prototype && s2.next && (Za(s2) !== as && (Qa ? Qa(s2, as) : Ya(s2[us]) || rs(s2, us, ps)), ts(s2, h2, true)), os && o2 === fs && l2 && l2.name !== fs && (is ? es(d2, "name", fs) : (p2 = true, y2 = function() {
    return Ja(l2, this);
  })), o2) if (u2 = { values: f2(fs), keys: i2 ? y2 : f2(cs), entries: f2(hs) }, a2) for (c2 in u2) (ss || p2 || !(c2 in d2)) && rs(d2, c2, u2[c2]);
  else Xa({ target: e2, proto: true, forced: ss || p2 }, u2);
  return d2[us] !== y2 && rs(d2, us, y2, { name: o2 }), ns[e2] = y2, u2;
};
var ls = function(t2, e2) {
  return { value: t2, done: e2 };
};
var ys = F;
var vs = function(t2) {
  ja[Pa][t2] = true;
};
var ms = pi;
var bs = Ar;
var gs = Ae.f;
var ws = ds;
var Ts = ls;
var Os = i;
var Ss = "Array Iterator";
var Ps = bs.set;
var js = bs.getterFor(Ss);
var Es = ws(Array, "Array", (function(t2, e2) {
  Ps(this, { type: Ss, target: ys(t2), index: 0, kind: e2 });
}), (function() {
  var t2 = js(this), e2 = t2.target, r2 = t2.index++;
  if (!e2 || r2 >= e2.length) return t2.target = null, Ts(void 0, true);
  switch (t2.kind) {
    case "keys":
      return Ts(r2, false);
    case "values":
      return Ts(e2[r2], false);
  }
  return Ts([r2, e2[r2]], false);
}), "values");
var As = ms.Arguments = ms.Array;
if (vs("keys"), vs("values"), vs("entries"), Os && "values" !== As.name) try {
  gs(As, "name", { value: "values" });
} catch (t2) {
}
var Is = Pi;
var Us = mi ? {}.toString : function() {
  return "[object " + Is(this) + "]";
};
mi || Yr(Object.prototype, "toString", Us, { unsafe: true });
var Rs = r;
var xs = X;
var Ds = j;
var Cs = function(t2) {
  return xs.slice(0, t2.length) === t2;
};
var Bs = Cs("Bun/") ? "BUN" : Cs("Cloudflare-Workers") ? "CLOUDFLARE" : Cs("Deno/") ? "DENO" : Cs("Node.js/") ? "NODE" : Rs.Bun && "string" == typeof Bun.version ? "BUN" : Rs.Deno && "object" == typeof Deno.version ? "DENO" : "process" === Ds(Rs.process) ? "NODE" : Rs.window && Rs.document ? "BROWSER" : "REST";
var ks = "NODE" === Bs;
var _s = Gr;
var Fs = Ae;
var Ls = q;
var Ns = function(t2, e2, r2) {
  return r2.get && _s(r2.get, e2, { getter: true }), r2.set && _s(r2.set, e2, { setter: true }), Fs.f(t2, e2, r2);
};
var Ms = i;
var $s = ee("species");
var Hs = G;
var Ws = TypeError;
var qs = T;
var Gs = o;
var Vs = N;
var zs = Pi;
var Xs = ar;
var Js = function() {
};
var Ys = q("Reflect", "construct");
var Ks = /^\s*(?:class|function)\b/;
var Zs = qs(Ks.exec);
var Qs = !Ks.test(Js);
var tu = function(t2) {
  if (!Vs(t2)) return false;
  try {
    return Ys(Js, [], t2), true;
  } catch (t3) {
    return false;
  }
};
var eu = function(t2) {
  if (!Vs(t2)) return false;
  switch (zs(t2)) {
    case "AsyncFunction":
    case "GeneratorFunction":
    case "AsyncGeneratorFunction":
      return false;
  }
  try {
    return Qs || !!Zs(Ks, Xs(t2));
  } catch (t3) {
    return true;
  }
};
eu.sham = true;
var ru;
var nu;
var ou;
var iu;
var au = !Ys || Gs((function() {
  var t2;
  return tu(tu.call) || !tu(Object) || !tu((function() {
    t2 = true;
  })) || t2;
})) ? eu : tu;
var su = au;
var uu = dt;
var cu = TypeError;
var fu = De;
var hu = function(t2) {
  if (su(t2)) return t2;
  throw new cu(uu(t2) + " is not a constructor");
};
var pu = x;
var du = ee("species");
var lu = function(t2, e2) {
  var r2, n2 = fu(t2).constructor;
  return void 0 === n2 || pu(r2 = fu(n2)[du]) ? e2 : hu(r2);
};
var yu = a;
var vu = Function.prototype;
var mu = vu.apply;
var bu = vu.call;
var gu = "object" == typeof Reflect && Reflect.apply || (yu ? bu.bind(mu) : function() {
  return bu.apply(mu, arguments);
});
var wu = T([].slice);
var Tu = TypeError;
var Ou = /(?:ipad|iphone|ipod).*applewebkit/i.test(X);
var Su = r;
var Pu = gu;
var ju = hi;
var Eu = N;
var Au = $t;
var Iu = o;
var Uu = xo;
var Ru = wu;
var xu = ye;
var Du = function(t2, e2) {
  if (t2 < e2) throw new Tu("Not enough arguments");
  return t2;
};
var Cu = Ou;
var Bu = ks;
var ku = Su.setImmediate;
var _u = Su.clearImmediate;
var Fu = Su.process;
var Lu = Su.Dispatch;
var Nu = Su.Function;
var Mu = Su.MessageChannel;
var $u = Su.String;
var Hu = 0;
var Wu = {};
var qu = "onreadystatechange";
Iu((function() {
  ru = Su.location;
}));
var Gu = function(t2) {
  if (Au(Wu, t2)) {
    var e2 = Wu[t2];
    delete Wu[t2], e2();
  }
};
var Vu = function(t2) {
  return function() {
    Gu(t2);
  };
};
var zu = function(t2) {
  Gu(t2.data);
};
var Xu = function(t2) {
  Su.postMessage($u(t2), ru.protocol + "//" + ru.host);
};
ku && _u || (ku = function(t2) {
  Du(arguments.length, 1);
  var e2 = Eu(t2) ? t2 : Nu(t2), r2 = Ru(arguments, 1);
  return Wu[++Hu] = function() {
    Pu(e2, void 0, r2);
  }, nu(Hu), Hu;
}, _u = function(t2) {
  delete Wu[t2];
}, Bu ? nu = function(t2) {
  Fu.nextTick(Vu(t2));
} : Lu && Lu.now ? nu = function(t2) {
  Lu.now(Vu(t2));
} : Mu && !Cu ? (iu = (ou = new Mu()).port2, ou.port1.onmessage = zu, nu = ju(iu.postMessage, iu)) : Su.addEventListener && Eu(Su.postMessage) && !Su.importScripts && ru && "file:" !== ru.protocol && !Iu(Xu) ? (nu = Xu, Su.addEventListener("message", zu, false)) : nu = qu in xu("script") ? function(t2) {
  Uu.appendChild(xu("script"))[qu] = function() {
    Uu.removeChild(this), Gu(t2);
  };
} : function(t2) {
  setTimeout(Vu(t2), 0);
});
var Ju = { set: ku, clear: _u };
var Yu = r;
var Ku = i;
var Zu = Object.getOwnPropertyDescriptor;
var Qu = function() {
  this.head = null, this.tail = null;
};
Qu.prototype = { add: function(t2) {
  var e2 = { item: t2, next: null }, r2 = this.tail;
  r2 ? r2.next = e2 : this.head = e2, this.tail = e2;
}, get: function() {
  var t2 = this.head;
  if (t2) return null === (this.head = t2.next) && (this.tail = null), t2.item;
} };
var tc;
var ec;
var rc;
var nc;
var oc;
var ic = Qu;
var ac = /ipad|iphone|ipod/i.test(X) && "undefined" != typeof Pebble;
var sc = /web0s(?!.*chrome)/i.test(X);
var uc = r;
var cc = function(t2) {
  if (!Ku) return Yu[t2];
  var e2 = Zu(Yu, t2);
  return e2 && e2.value;
};
var fc = hi;
var hc = Ju.set;
var pc = ic;
var dc = Ou;
var lc = ac;
var yc = sc;
var vc = ks;
var mc = uc.MutationObserver || uc.WebKitMutationObserver;
var bc = uc.document;
var gc = uc.process;
var wc = uc.Promise;
var Tc = cc("queueMicrotask");
if (!Tc) {
  Oc = new pc(), Sc = function() {
    var t2, e2;
    for (vc && (t2 = gc.domain) && t2.exit(); e2 = Oc.get(); ) try {
      e2();
    } catch (t3) {
      throw Oc.head && tc(), t3;
    }
    t2 && t2.enter();
  };
  dc || vc || yc || !mc || !bc ? !lc && wc && wc.resolve ? ((nc = wc.resolve(void 0)).constructor = wc, oc = fc(nc.then, nc), tc = function() {
    oc(Sc);
  }) : vc ? tc = function() {
    gc.nextTick(Sc);
  } : (hc = fc(hc, uc), tc = function() {
    hc(Sc);
  }) : (ec = true, rc = bc.createTextNode(""), new mc(Sc).observe(rc, { characterData: true }), tc = function() {
    rc.data = ec = !ec;
  }), Tc = function(t2) {
    Oc.head || tc(), Oc.add(t2);
  };
}
var Oc;
var Sc;
var Pc = Tc;
var jc = function(t2) {
  try {
    return { error: false, value: t2() };
  } catch (t3) {
    return { error: true, value: t3 };
  }
};
var Ec = r.Promise;
var Ac = r;
var Ic = Ec;
var Uc = N;
var Rc = qn;
var xc = ar;
var Dc = ee;
var Cc = Bs;
var Bc = et;
Ic && Ic.prototype;
var kc = Dc("species");
var _c = false;
var Fc = Uc(Ac.PromiseRejectionEvent);
var Lc = Rc("Promise", (function() {
  var t2 = xc(Ic), e2 = t2 !== String(Ic);
  if (!e2 && 66 === Bc) return true;
  if (!Bc || Bc < 51 || !/native code/.test(t2)) {
    var r2 = new Ic((function(t3) {
      t3(1);
    })), n2 = function(t3) {
      t3((function() {
      }), (function() {
      }));
    };
    if ((r2.constructor = {})[kc] = n2, !(_c = r2.then((function() {
    })) instanceof n2)) return true;
  }
  return !(e2 || "BROWSER" !== Cc && "DENO" !== Cc || Fc);
}));
var Nc = { CONSTRUCTOR: Lc, REJECTION_EVENT: Fc, SUBCLASSING: _c };
var Mc = {};
var $c = mt;
var Hc = TypeError;
var Wc = function(t2) {
  var e2, r2;
  this.promise = new t2((function(t3, n2) {
    if (void 0 !== e2 || void 0 !== r2) throw new Hc("Bad Promise constructor");
    e2 = t3, r2 = n2;
  })), this.resolve = $c(e2), this.reject = $c(r2);
};
Mc.f = function(t2) {
  return new Wc(t2);
};
var qc;
var Gc;
var Vc;
var zc = Zn;
var Xc = ks;
var Jc = r;
var Yc = c;
var Kc = Yr;
var Zc = go;
var Qc = $a;
var tf = function(t2) {
  var e2 = Ls(t2);
  Ms && e2 && !e2[$s] && Ns(e2, $s, { configurable: true, get: function() {
    return this;
  } });
};
var ef = mt;
var rf = N;
var nf = $;
var of = function(t2, e2) {
  if (Hs(e2, t2)) return t2;
  throw new Ws("Incorrect invocation");
};
var af = lu;
var sf = Ju.set;
var uf = Pc;
var cf = function(t2, e2) {
  try {
    1 === arguments.length ? console.error(t2) : console.error(t2, e2);
  } catch (t3) {
  }
};
var ff = jc;
var hf = ic;
var pf = Ar;
var df = Ec;
var lf = Mc;
var yf = "Promise";
var vf = Nc.CONSTRUCTOR;
var mf = Nc.REJECTION_EVENT;
var bf = Nc.SUBCLASSING;
var gf = pf.getterFor(yf);
var wf = pf.set;
var Tf = df && df.prototype;
var Of = df;
var Sf = Tf;
var Pf = Jc.TypeError;
var jf = Jc.document;
var Ef = Jc.process;
var Af = lf.f;
var If = Af;
var Uf = !!(jf && jf.createEvent && Jc.dispatchEvent);
var Rf = "unhandledrejection";
var xf = function(t2) {
  var e2;
  return !(!nf(t2) || !rf(e2 = t2.then)) && e2;
};
var Df = function(t2, e2) {
  var r2, n2, o2, i2 = e2.value, a2 = 1 === e2.state, s2 = a2 ? t2.ok : t2.fail, u2 = t2.resolve, c2 = t2.reject, f2 = t2.domain;
  try {
    s2 ? (a2 || (2 === e2.rejection && Ff(e2), e2.rejection = 1), true === s2 ? r2 = i2 : (f2 && f2.enter(), r2 = s2(i2), f2 && (f2.exit(), o2 = true)), r2 === t2.promise ? c2(new Pf("Promise-chain cycle")) : (n2 = xf(r2)) ? Yc(n2, r2, u2, c2) : u2(r2)) : c2(i2);
  } catch (t3) {
    f2 && !o2 && f2.exit(), c2(t3);
  }
};
var Cf = function(t2, e2) {
  t2.notified || (t2.notified = true, uf((function() {
    for (var r2, n2 = t2.reactions; r2 = n2.get(); ) Df(r2, t2);
    t2.notified = false, e2 && !t2.rejection && kf(t2);
  })));
};
var Bf = function(t2, e2, r2) {
  var n2, o2;
  Uf ? ((n2 = jf.createEvent("Event")).promise = e2, n2.reason = r2, n2.initEvent(t2, false, true), Jc.dispatchEvent(n2)) : n2 = { promise: e2, reason: r2 }, !mf && (o2 = Jc["on" + t2]) ? o2(n2) : t2 === Rf && cf("Unhandled promise rejection", r2);
};
var kf = function(t2) {
  Yc(sf, Jc, (function() {
    var e2, r2 = t2.facade, n2 = t2.value;
    if (_f(t2) && (e2 = ff((function() {
      Xc ? Ef.emit("unhandledRejection", n2, r2) : Bf(Rf, r2, n2);
    })), t2.rejection = Xc || _f(t2) ? 2 : 1, e2.error)) throw e2.value;
  }));
};
var _f = function(t2) {
  return 1 !== t2.rejection && !t2.parent;
};
var Ff = function(t2) {
  Yc(sf, Jc, (function() {
    var e2 = t2.facade;
    Xc ? Ef.emit("rejectionHandled", e2) : Bf("rejectionhandled", e2, t2.value);
  }));
};
var Lf = function(t2, e2, r2) {
  return function(n2) {
    t2(e2, n2, r2);
  };
};
var Nf = function(t2, e2, r2) {
  t2.done || (t2.done = true, r2 && (t2 = r2), t2.value = e2, t2.state = 2, Cf(t2, true));
};
var Mf = function(t2, e2, r2) {
  if (!t2.done) {
    t2.done = true, r2 && (t2 = r2);
    try {
      if (t2.facade === e2) throw new Pf("Promise can't be resolved itself");
      var n2 = xf(e2);
      n2 ? uf((function() {
        var r3 = { done: false };
        try {
          Yc(n2, e2, Lf(Mf, r3, t2), Lf(Nf, r3, t2));
        } catch (e3) {
          Nf(r3, e3, t2);
        }
      })) : (t2.value = e2, t2.state = 1, Cf(t2, false));
    } catch (e3) {
      Nf({ done: false }, e3, t2);
    }
  }
};
if (vf && (Sf = (Of = function(t2) {
  of(this, Sf), ef(t2), Yc(qc, this);
  var e2 = gf(this);
  try {
    t2(Lf(Mf, e2), Lf(Nf, e2));
  } catch (t3) {
    Nf(e2, t3);
  }
}).prototype, (qc = function(t2) {
  wf(this, { type: yf, done: false, notified: false, parent: false, reactions: new hf(), rejection: false, state: 0, value: null });
}).prototype = Kc(Sf, "then", (function(t2, e2) {
  var r2 = gf(this), n2 = Af(af(this, Of));
  return r2.parent = true, n2.ok = !rf(t2) || t2, n2.fail = rf(e2) && e2, n2.domain = Xc ? Ef.domain : void 0, 0 === r2.state ? r2.reactions.add(n2) : uf((function() {
    Df(n2, r2);
  })), n2.promise;
})), Gc = function() {
  var t2 = new qc(), e2 = gf(t2);
  this.promise = t2, this.resolve = Lf(Mf, e2), this.reject = Lf(Nf, e2);
}, lf.f = Af = function(t2) {
  return t2 === Of || void 0 === t2 ? new Gc(t2) : If(t2);
}, rf(df) && Tf !== Object.prototype)) {
  Vc = Tf.then, bf || Kc(Tf, "then", (function(t2, e2) {
    var r2 = this;
    return new Of((function(t3, e3) {
      Yc(Vc, r2, t3, e3);
    })).then(t2, e2);
  }), { unsafe: true });
  try {
    delete Tf.constructor;
  } catch (t2) {
  }
  Zc && Zc(Tf, Sf);
}
zc({ global: true, constructor: true, wrap: true, forced: vf }, { Promise: Of }), Qc(Of, yf, false), tf(yf);
var $f = ee("iterator");
var Hf = false;
try {
  Wf = 0, qf = { next: function() {
    return { done: !!Wf++ };
  }, return: function() {
    Hf = true;
  } };
  qf[$f] = function() {
    return this;
  }, Array.from(qf, (function() {
    throw 2;
  }));
} catch (t2) {
}
var Wf;
var qf;
var Gf = Ec;
var Vf = function(t2, e2) {
  try {
    if (!e2 && !Hf) return false;
  } catch (t3) {
    return false;
  }
  var r2 = false;
  try {
    var n2 = {};
    n2[$f] = function() {
      return { next: function() {
        return { done: r2 = true };
      } };
    }, t2(n2);
  } catch (t3) {
  }
  return r2;
};
var zf = Nc.CONSTRUCTOR || !Vf((function(t2) {
  Gf.all(t2).then(void 0, (function() {
  }));
}));
var Xf = c;
var Jf = mt;
var Yf = Mc;
var Kf = jc;
var Zf = Qi;
Zn({ target: "Promise", stat: true, forced: zf }, { all: function(t2) {
  var e2 = this, r2 = Yf.f(e2), n2 = r2.resolve, o2 = r2.reject, i2 = Kf((function() {
    var r3 = Jf(e2.resolve), i3 = [], a2 = 0, s2 = 1;
    Zf(t2, (function(t3) {
      var u2 = a2++, c2 = false;
      s2++, Xf(r3, e2, t3).then((function(t4) {
        c2 || (c2 = true, i3[u2] = t4, --s2 || n2(i3));
      }), o2);
    })), --s2 || n2(i3);
  }));
  return i2.error && o2(i2.value), r2.promise;
} });
var Qf = Zn;
var th = Nc.CONSTRUCTOR;
var eh = Ec;
var rh = q;
var nh = N;
var oh = Yr;
var ih = eh && eh.prototype;
if (Qf({ target: "Promise", proto: true, forced: th, real: true }, { catch: function(t2) {
  return this.then(void 0, t2);
} }), nh(eh)) {
  ah = rh("Promise").prototype.catch;
  ih.catch !== ah && oh(ih, "catch", ah, { unsafe: true });
}
var ah;
var sh = c;
var uh = mt;
var ch = Mc;
var fh = jc;
var hh = Qi;
Zn({ target: "Promise", stat: true, forced: zf }, { race: function(t2) {
  var e2 = this, r2 = ch.f(e2), n2 = r2.reject, o2 = fh((function() {
    var o3 = uh(e2.resolve);
    hh(t2, (function(t3) {
      sh(o3, e2, t3).then(r2.resolve, n2);
    }));
  }));
  return o2.error && n2(o2.value), r2.promise;
} });
var ph = Mc;
Zn({ target: "Promise", stat: true, forced: Nc.CONSTRUCTOR }, { reject: function(t2) {
  var e2 = ph.f(this);
  return (0, e2.reject)(t2), e2.promise;
} });
var dh = De;
var lh = $;
var yh = Mc;
var vh = function(t2, e2) {
  if (dh(t2), lh(e2) && e2.constructor === t2) return e2;
  var r2 = yh.f(t2);
  return (0, r2.resolve)(e2), r2.promise;
};
var mh = Zn;
var bh = Nc.CONSTRUCTOR;
var gh = vh;
q("Promise"), mh({ target: "Promise", stat: true, forced: bh }, { resolve: function(t2) {
  return gh(this, t2);
} });
var wh = c;
var Th = mt;
var Oh = Mc;
var Sh = jc;
var Ph = Qi;
Zn({ target: "Promise", stat: true, forced: zf }, { allSettled: function(t2) {
  var e2 = this, r2 = Oh.f(e2), n2 = r2.resolve, o2 = r2.reject, i2 = Sh((function() {
    var r3 = Th(e2.resolve), o3 = [], i3 = 0, a2 = 1;
    Ph(t2, (function(t3) {
      var s2 = i3++, u2 = false;
      a2++, wh(r3, e2, t3).then((function(t4) {
        u2 || (u2 = true, o3[s2] = { status: "fulfilled", value: t4 }, --a2 || n2(o3));
      }), (function(t4) {
        u2 || (u2 = true, o3[s2] = { status: "rejected", reason: t4 }, --a2 || n2(o3));
      }));
    })), --a2 || n2(o3);
  }));
  return i2.error && o2(i2.value), r2.promise;
} });
var jh = c;
var Eh = mt;
var Ah = q;
var Ih = Mc;
var Uh = jc;
var Rh = Qi;
var xh = "No one promise resolved";
Zn({ target: "Promise", stat: true, forced: zf }, { any: function(t2) {
  var e2 = this, r2 = Ah("AggregateError"), n2 = Ih.f(e2), o2 = n2.resolve, i2 = n2.reject, a2 = Uh((function() {
    var n3 = Eh(e2.resolve), a3 = [], s2 = 0, u2 = 1, c2 = false;
    Rh(t2, (function(t3) {
      var f2 = s2++, h2 = false;
      u2++, jh(n3, e2, t3).then((function(t4) {
        h2 || c2 || (c2 = true, o2(t4));
      }), (function(t4) {
        h2 || c2 || (h2 = true, a3[f2] = t4, --u2 || i2(new r2(a3, xh)));
      }));
    })), --u2 || i2(new r2(a3, xh));
  }));
  return a2.error && i2(a2.value), n2.promise;
} });
var Dh = Mc;
Zn({ target: "Promise", stat: true }, { withResolvers: function() {
  var t2 = Dh.f(this);
  return { promise: t2.promise, resolve: t2.resolve, reject: t2.reject };
} });
var Ch = Zn;
var Bh = Ec;
var kh = o;
var _h = q;
var Fh = N;
var Lh = lu;
var Nh = vh;
var Mh = Yr;
var $h = Bh && Bh.prototype;
if (Ch({ target: "Promise", proto: true, real: true, forced: !!Bh && kh((function() {
  $h.finally.call({ then: function() {
  } }, (function() {
  }));
})) }, { finally: function(t2) {
  var e2 = Lh(this, _h("Promise")), r2 = Fh(t2);
  return this.then(r2 ? function(r3) {
    return Nh(e2, t2()).then((function() {
      return r3;
    }));
  } : t2, r2 ? function(r3) {
    return Nh(e2, t2()).then((function() {
      throw r3;
    }));
  } : t2);
} }), Fh(Bh)) {
  Hh = _h("Promise").prototype.finally;
  $h.finally !== Hh && Mh($h, "finally", Hh, { unsafe: true });
}
var Hh;
var Wh = T;
var qh = en;
var Gh = ra;
var Vh = B;
var zh = Wh("".charAt);
var Xh = Wh("".charCodeAt);
var Jh = Wh("".slice);
var Yh = function(t2) {
  return function(e2, r2) {
    var n2, o2, i2 = Gh(Vh(e2)), a2 = qh(r2), s2 = i2.length;
    return a2 < 0 || a2 >= s2 ? t2 ? "" : void 0 : (n2 = Xh(i2, a2)) < 55296 || n2 > 56319 || a2 + 1 === s2 || (o2 = Xh(i2, a2 + 1)) < 56320 || o2 > 57343 ? t2 ? zh(i2, a2) : n2 : t2 ? Jh(i2, a2, a2 + 2) : o2 - 56320 + (n2 - 55296 << 10) + 65536;
  };
};
var Kh = { codeAt: Yh(false), charAt: Yh(true) }.charAt;
var Zh = ra;
var Qh = Ar;
var tp = ds;
var ep = ls;
var rp = "String Iterator";
var np = Qh.set;
var op = Qh.getterFor(rp);
tp(String, "String", (function(t2) {
  np(this, { type: rp, string: Zh(t2), index: 0 });
}), (function() {
  var t2, e2 = op(this), r2 = e2.string, n2 = e2.index;
  return n2 >= r2.length ? ep(void 0, true) : (t2 = Kh(r2, n2), e2.index += t2.length, ep(t2, false));
})), r.Promise;
var ip = ye("span").classList;
var ap = ip && ip.constructor && ip.constructor.prototype;
var sp = ap === Object.prototype ? void 0 : ap;
var up = r;
var cp = { CSSRuleList: 0, CSSStyleDeclaration: 0, CSSValueList: 0, ClientRectList: 0, DOMRectList: 0, DOMStringList: 0, DOMTokenList: 1, DataTransferItemList: 0, FileList: 0, HTMLAllCollection: 0, HTMLCollection: 0, HTMLFormElement: 0, HTMLSelectElement: 0, MediaList: 0, MimeTypeArray: 0, NamedNodeMap: 0, NodeList: 1, PaintRequestList: 0, Plugin: 0, PluginArray: 0, SVGLengthList: 0, SVGNumberList: 0, SVGPathSegList: 0, SVGPointList: 0, SVGStringList: 0, SVGTransformList: 0, SourceBufferList: 0, StyleSheetList: 0, TextTrackCueList: 0, TextTrackList: 0, TouchList: 0 };
var fp = sp;
var hp = Es;
var pp = Ve;
var dp = $a;
var lp = ee("iterator");
var yp = hp.values;
var vp = function(t2, e2) {
  if (t2) {
    if (t2[lp] !== yp) try {
      pp(t2, lp, yp);
    } catch (e3) {
      t2[lp] = yp;
    }
    if (dp(t2, e2, true), cp[e2]) {
      for (var r2 in hp) if (t2[r2] !== hp[r2]) try {
        pp(t2, r2, hp[r2]);
      } catch (e3) {
        t2[r2] = hp[r2];
      }
    }
  }
};
for (mp in cp) vp(up[mp] && up[mp].prototype, mp);
var mp;
vp(fp, "DOMTokenList");
var bp = "undefined" != typeof globalThis && globalThis || "undefined" != typeof self && self || "undefined" != typeof global && global || {};
var gp = "URLSearchParams" in bp;
var wp = "Symbol" in bp && "iterator" in Symbol;
var Tp = "FileReader" in bp && "Blob" in bp && (function() {
  try {
    return new Blob(), true;
  } catch (t2) {
    return false;
  }
})();
var Op = "FormData" in bp;
var Sp = "ArrayBuffer" in bp;
if (Sp) Pp = ["[object Int8Array]", "[object Uint8Array]", "[object Uint8ClampedArray]", "[object Int16Array]", "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]", "[object Float32Array]", "[object Float64Array]"], jp = ArrayBuffer.isView || function(t2) {
  return t2 && Pp.indexOf(Object.prototype.toString.call(t2)) > -1;
};
var Pp;
var jp;
function Ep(t2) {
  if ("string" != typeof t2 && (t2 = String(t2)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(t2) || "" === t2) throw new TypeError('Invalid character in header field name: "' + t2 + '"');
  return t2.toLowerCase();
}
function Ap(t2) {
  return "string" != typeof t2 && (t2 = String(t2)), t2;
}
function Ip(t2) {
  var e2 = { next: function() {
    var e3 = t2.shift();
    return { done: void 0 === e3, value: e3 };
  } };
  return wp && (e2[Symbol.iterator] = function() {
    return e2;
  }), e2;
}
function Up(t2) {
  this.map = {}, t2 instanceof Up ? t2.forEach((function(t3, e2) {
    this.append(e2, t3);
  }), this) : Array.isArray(t2) ? t2.forEach((function(t3) {
    if (2 != t3.length) throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + t3.length);
    this.append(t3[0], t3[1]);
  }), this) : t2 && Object.getOwnPropertyNames(t2).forEach((function(e2) {
    this.append(e2, t2[e2]);
  }), this);
}
function Rp(t2) {
  if (!t2._noBody) return t2.bodyUsed ? Promise.reject(new TypeError("Already read")) : void (t2.bodyUsed = true);
}
function xp(t2) {
  return new Promise((function(e2, r2) {
    t2.onload = function() {
      e2(t2.result);
    }, t2.onerror = function() {
      r2(t2.error);
    };
  }));
}
function Dp(t2) {
  var e2 = new FileReader(), r2 = xp(e2);
  return e2.readAsArrayBuffer(t2), r2;
}
function Cp(t2) {
  if (t2.slice) return t2.slice(0);
  var e2 = new Uint8Array(t2.byteLength);
  return e2.set(new Uint8Array(t2)), e2.buffer;
}
function Bp() {
  return this.bodyUsed = false, this._initBody = function(t2) {
    var e2;
    this.bodyUsed = this.bodyUsed, this._bodyInit = t2, t2 ? "string" == typeof t2 ? this._bodyText = t2 : Tp && Blob.prototype.isPrototypeOf(t2) ? this._bodyBlob = t2 : Op && FormData.prototype.isPrototypeOf(t2) ? this._bodyFormData = t2 : gp && URLSearchParams.prototype.isPrototypeOf(t2) ? this._bodyText = t2.toString() : Sp && Tp && ((e2 = t2) && DataView.prototype.isPrototypeOf(e2)) ? (this._bodyArrayBuffer = Cp(t2.buffer), this._bodyInit = new Blob([this._bodyArrayBuffer])) : Sp && (ArrayBuffer.prototype.isPrototypeOf(t2) || jp(t2)) ? this._bodyArrayBuffer = Cp(t2) : this._bodyText = t2 = Object.prototype.toString.call(t2) : (this._noBody = true, this._bodyText = ""), this.headers.get("content-type") || ("string" == typeof t2 ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : gp && URLSearchParams.prototype.isPrototypeOf(t2) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
  }, Tp && (this.blob = function() {
    var t2 = Rp(this);
    if (t2) return t2;
    if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
    if (this._bodyArrayBuffer) return Promise.resolve(new Blob([this._bodyArrayBuffer]));
    if (this._bodyFormData) throw new Error("could not read FormData body as blob");
    return Promise.resolve(new Blob([this._bodyText]));
  }), this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var t2 = Rp(this);
      return t2 || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset, this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength)) : Promise.resolve(this._bodyArrayBuffer));
    }
    if (Tp) return this.blob().then(Dp);
    throw new Error("could not read as ArrayBuffer");
  }, this.text = function() {
    var t2 = Rp(this);
    if (t2) return t2;
    if (this._bodyBlob) return (function(t3) {
      var e2 = new FileReader(), r2 = xp(e2), n2 = /charset=([A-Za-z0-9_-]+)/.exec(t3.type), o2 = n2 ? n2[1] : "utf-8";
      return e2.readAsText(t3, o2), r2;
    })(this._bodyBlob);
    if (this._bodyArrayBuffer) return Promise.resolve((function(t3) {
      for (var e2 = new Uint8Array(t3), r2 = new Array(e2.length), n2 = 0; n2 < e2.length; n2++) r2[n2] = String.fromCharCode(e2[n2]);
      return r2.join("");
    })(this._bodyArrayBuffer));
    if (this._bodyFormData) throw new Error("could not read FormData body as text");
    return Promise.resolve(this._bodyText);
  }, Op && (this.formData = function() {
    return this.text().then(Fp);
  }), this.json = function() {
    return this.text().then(JSON.parse);
  }, this;
}
Up.prototype.append = function(t2, e2) {
  t2 = Ep(t2), e2 = Ap(e2);
  var r2 = this.map[t2];
  this.map[t2] = r2 ? r2 + ", " + e2 : e2;
}, Up.prototype.delete = function(t2) {
  delete this.map[Ep(t2)];
}, Up.prototype.get = function(t2) {
  return t2 = Ep(t2), this.has(t2) ? this.map[t2] : null;
}, Up.prototype.has = function(t2) {
  return this.map.hasOwnProperty(Ep(t2));
}, Up.prototype.set = function(t2, e2) {
  this.map[Ep(t2)] = Ap(e2);
}, Up.prototype.forEach = function(t2, e2) {
  for (var r2 in this.map) this.map.hasOwnProperty(r2) && t2.call(e2, this.map[r2], r2, this);
}, Up.prototype.keys = function() {
  var t2 = [];
  return this.forEach((function(e2, r2) {
    t2.push(r2);
  })), Ip(t2);
}, Up.prototype.values = function() {
  var t2 = [];
  return this.forEach((function(e2) {
    t2.push(e2);
  })), Ip(t2);
}, Up.prototype.entries = function() {
  var t2 = [];
  return this.forEach((function(e2, r2) {
    t2.push([r2, e2]);
  })), Ip(t2);
}, wp && (Up.prototype[Symbol.iterator] = Up.prototype.entries);
var kp = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
function _p(t2, e2) {
  if (!(this instanceof _p)) throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  var r2 = (e2 = e2 || {}).body;
  if (t2 instanceof _p) {
    if (t2.bodyUsed) throw new TypeError("Already read");
    this.url = t2.url, this.credentials = t2.credentials, e2.headers || (this.headers = new Up(t2.headers)), this.method = t2.method, this.mode = t2.mode, this.signal = t2.signal, r2 || null == t2._bodyInit || (r2 = t2._bodyInit, t2.bodyUsed = true);
  } else this.url = String(t2);
  if (this.credentials = e2.credentials || this.credentials || "same-origin", !e2.headers && this.headers || (this.headers = new Up(e2.headers)), this.method = (function(t3) {
    var e3 = t3.toUpperCase();
    return kp.indexOf(e3) > -1 ? e3 : t3;
  })(e2.method || this.method || "GET"), this.mode = e2.mode || this.mode || null, this.signal = e2.signal || this.signal || (function() {
    if ("AbortController" in bp) return new AbortController().signal;
  })(), this.referrer = null, ("GET" === this.method || "HEAD" === this.method) && r2) throw new TypeError("Body not allowed for GET or HEAD requests");
  if (this._initBody(r2), !("GET" !== this.method && "HEAD" !== this.method || "no-store" !== e2.cache && "no-cache" !== e2.cache)) {
    var n2 = /([?&])_=[^&]*/;
    if (n2.test(this.url)) this.url = this.url.replace(n2, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
    else {
      this.url += (/\?/.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
    }
  }
}
function Fp(t2) {
  var e2 = new FormData();
  return t2.trim().split("&").forEach((function(t3) {
    if (t3) {
      var r2 = t3.split("="), n2 = r2.shift().replace(/\+/g, " "), o2 = r2.join("=").replace(/\+/g, " ");
      e2.append(decodeURIComponent(n2), decodeURIComponent(o2));
    }
  })), e2;
}
function Lp(t2, e2) {
  if (!(this instanceof Lp)) throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  if (e2 || (e2 = {}), this.type = "default", this.status = void 0 === e2.status ? 200 : e2.status, this.status < 200 || this.status > 599) throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
  this.ok = this.status >= 200 && this.status < 300, this.statusText = void 0 === e2.statusText ? "" : "" + e2.statusText, this.headers = new Up(e2.headers), this.url = e2.url || "", this._initBody(t2);
}
_p.prototype.clone = function() {
  return new _p(this, { body: this._bodyInit });
}, Bp.call(_p.prototype), Bp.call(Lp.prototype), Lp.prototype.clone = function() {
  return new Lp(this._bodyInit, { status: this.status, statusText: this.statusText, headers: new Up(this.headers), url: this.url });
}, Lp.error = function() {
  var t2 = new Lp(null, { status: 200, statusText: "" });
  return t2.ok = false, t2.status = 0, t2.type = "error", t2;
};
var Np = [301, 302, 303, 307, 308];
Lp.redirect = function(t2, e2) {
  if (-1 === Np.indexOf(e2)) throw new RangeError("Invalid status code");
  return new Lp(null, { status: e2, headers: { location: t2 } });
};
var Mp = bp.DOMException;
try {
  new Mp();
} catch (t2) {
  (Mp = function(t3, e2) {
    this.message = t3, this.name = e2;
    var r2 = Error(t3);
    this.stack = r2.stack;
  }).prototype = Object.create(Error.prototype), Mp.prototype.constructor = Mp;
}
function $p(t2, e2) {
  return new Promise((function(r2, n2) {
    var o2 = new _p(t2, e2);
    if (o2.signal && o2.signal.aborted) return n2(new Mp("Aborted", "AbortError"));
    var i2 = new XMLHttpRequest();
    function a2() {
      i2.abort();
    }
    if (i2.onload = function() {
      var t3, e3, n3 = { statusText: i2.statusText, headers: (t3 = i2.getAllResponseHeaders() || "", e3 = new Up(), t3.replace(/\r?\n[\t ]+/g, " ").split("\r").map((function(t4) {
        return 0 === t4.indexOf("\n") ? t4.substr(1, t4.length) : t4;
      })).forEach((function(t4) {
        var r3 = t4.split(":"), n4 = r3.shift().trim();
        if (n4) {
          var o3 = r3.join(":").trim();
          try {
            e3.append(n4, o3);
          } catch (t5) {
            console.warn("Response " + t5.message);
          }
        }
      })), e3) };
      0 === o2.url.indexOf("file://") && (i2.status < 200 || i2.status > 599) ? n3.status = 200 : n3.status = i2.status, n3.url = "responseURL" in i2 ? i2.responseURL : n3.headers.get("X-Request-URL");
      var a3 = "response" in i2 ? i2.response : i2.responseText;
      setTimeout((function() {
        r2(new Lp(a3, n3));
      }), 0);
    }, i2.onerror = function() {
      setTimeout((function() {
        n2(new TypeError("Network request failed"));
      }), 0);
    }, i2.ontimeout = function() {
      setTimeout((function() {
        n2(new TypeError("Network request timed out"));
      }), 0);
    }, i2.onabort = function() {
      setTimeout((function() {
        n2(new Mp("Aborted", "AbortError"));
      }), 0);
    }, i2.open(o2.method, (function(t3) {
      try {
        return "" === t3 && bp.location.href ? bp.location.href : t3;
      } catch (e3) {
        return t3;
      }
    })(o2.url), true), "include" === o2.credentials ? i2.withCredentials = true : "omit" === o2.credentials && (i2.withCredentials = false), "responseType" in i2 && (Tp ? i2.responseType = "blob" : Sp && (i2.responseType = "arraybuffer")), e2 && "object" == typeof e2.headers && !(e2.headers instanceof Up || bp.Headers && e2.headers instanceof bp.Headers)) {
      var s2 = [];
      Object.getOwnPropertyNames(e2.headers).forEach((function(t3) {
        s2.push(Ep(t3)), i2.setRequestHeader(t3, Ap(e2.headers[t3]));
      })), o2.headers.forEach((function(t3, e3) {
        -1 === s2.indexOf(e3) && i2.setRequestHeader(e3, t3);
      }));
    } else o2.headers.forEach((function(t3, e3) {
      i2.setRequestHeader(e3, t3);
    }));
    o2.signal && (o2.signal.addEventListener("abort", a2), i2.onreadystatechange = function() {
      4 === i2.readyState && o2.signal.removeEventListener("abort", a2);
    }), i2.send(void 0 === o2._bodyInit ? null : o2._bodyInit);
  }));
}
$p.polyfill = true, bp.fetch || (bp.fetch = $p, bp.Headers = Up, bp.Request = _p, bp.Response = Lp);
var Hp = function(t2, e2) {
  return Hp = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t3, e3) {
    t3.__proto__ = e3;
  } || function(t3, e3) {
    for (var r2 in e3) Object.prototype.hasOwnProperty.call(e3, r2) && (t3[r2] = e3[r2]);
  }, Hp(t2, e2);
};
function Wp(t2, e2) {
  if ("function" != typeof e2 && null !== e2) throw new TypeError("Class extends value " + String(e2) + " is not a constructor or null");
  function r2() {
    this.constructor = t2;
  }
  Hp(t2, e2), t2.prototype = null === e2 ? Object.create(e2) : (r2.prototype = e2.prototype, new r2());
}
function qp(t2, e2, r2, n2) {
  return new (r2 || (r2 = Promise))((function(o2, i2) {
    function a2(t3) {
      try {
        u2(n2.next(t3));
      } catch (t4) {
        i2(t4);
      }
    }
    function s2(t3) {
      try {
        u2(n2.throw(t3));
      } catch (t4) {
        i2(t4);
      }
    }
    function u2(t3) {
      var e3;
      t3.done ? o2(t3.value) : (e3 = t3.value, e3 instanceof r2 ? e3 : new r2((function(t4) {
        t4(e3);
      }))).then(a2, s2);
    }
    u2((n2 = n2.apply(t2, e2 || [])).next());
  }));
}
function Gp(t2, e2) {
  var r2, n2, o2, i2, a2 = { label: 0, sent: function() {
    if (1 & o2[0]) throw o2[1];
    return o2[1];
  }, trys: [], ops: [] };
  return i2 = { next: s2(0), throw: s2(1), return: s2(2) }, "function" == typeof Symbol && (i2[Symbol.iterator] = function() {
    return this;
  }), i2;
  function s2(s3) {
    return function(u2) {
      return (function(s4) {
        if (r2) throw new TypeError("Generator is already executing.");
        for (; i2 && (i2 = 0, s4[0] && (a2 = 0)), a2; ) try {
          if (r2 = 1, n2 && (o2 = 2 & s4[0] ? n2.return : s4[0] ? n2.throw || ((o2 = n2.return) && o2.call(n2), 0) : n2.next) && !(o2 = o2.call(n2, s4[1])).done) return o2;
          switch (n2 = 0, o2 && (s4 = [2 & s4[0], o2.value]), s4[0]) {
            case 0:
            case 1:
              o2 = s4;
              break;
            case 4:
              return a2.label++, { value: s4[1], done: false };
            case 5:
              a2.label++, n2 = s4[1], s4 = [0];
              continue;
            case 7:
              s4 = a2.ops.pop(), a2.trys.pop();
              continue;
            default:
              if (!(o2 = a2.trys, (o2 = o2.length > 0 && o2[o2.length - 1]) || 6 !== s4[0] && 2 !== s4[0])) {
                a2 = 0;
                continue;
              }
              if (3 === s4[0] && (!o2 || s4[1] > o2[0] && s4[1] < o2[3])) {
                a2.label = s4[1];
                break;
              }
              if (6 === s4[0] && a2.label < o2[1]) {
                a2.label = o2[1], o2 = s4;
                break;
              }
              if (o2 && a2.label < o2[2]) {
                a2.label = o2[2], a2.ops.push(s4);
                break;
              }
              o2[2] && a2.ops.pop(), a2.trys.pop();
              continue;
          }
          s4 = e2.call(t2, a2);
        } catch (t3) {
          s4 = [6, t3], n2 = 0;
        } finally {
          r2 = o2 = 0;
        }
        if (5 & s4[0]) throw s4[1];
        return { value: s4[0] ? s4[1] : void 0, done: true };
      })([s3, u2]);
    };
  }
}
var Vp;
var zp = (function() {
  function t2() {
  }
  return t2.getIndexFromTimestamps = function(t3, e2) {
    var r2 = 1e3 * t3 * 90, n2 = -1;
    if (e2.length > 0 && r2 < e2[e2.length - 1]) for (var o2 = 0, i2 = e2; o2 < i2.length; o2++) {
      if (i2[o2] > r2) break;
      n2++;
    }
    return n2;
  }, t2;
})();
var Xp = (function() {
  function t2() {
    this.updateTimestamps = [], this.previousTimestampIndex = 0;
  }
  return t2.prototype.setUpdateTimestamps = function(t3) {
    this.updateTimestamps = t3, this.onTimestampsUpdated && this.onTimestampsUpdated();
  }, t2.prototype.renderAtTimestamp = function(t3) {
    var e2 = zp.getIndexFromTimestamps(t3, this.updateTimestamps);
    this.renderAtIndex(e2);
  }, t2.prototype.renderAtIndex = function(t3) {
    this.previousTimestampIndex !== t3 && (this.previousTimestampIndex = t3, this.render(t3));
  }, t2;
})();
var Jp = (function(t2) {
  function e2(e3) {
    var r2, n2 = t2.call(this) || this;
    n2.$onWorkerMessage = function(t3) {
      n2.onWorkerMessage(t3);
    };
    var o2 = null !== (r2 = e3.workerUrl) && void 0 !== r2 ? r2 : "libpgs.worker.js";
    return n2.worker = new Worker(o2), n2.worker.onmessage = n2.$onWorkerMessage, n2;
  }
  return Wp(e2, t2), e2.prototype.loadFromUrl = function(t3) {
    this.worker.postMessage({ op: "loadFromUrl", url: t3 });
  }, e2.prototype.loadFromBuffer = function(t3) {
    this.worker.postMessage({ op: "loadFromBuffer", buffer: t3 });
  }, e2.prototype.onWorkerMessage = function(t3) {
    if ("updateTimestamps" === t3.data.op) this.setUpdateTimestamps(t3.data.updateTimestamps);
  }, e2.prototype.dispose = function() {
    this.worker.terminate();
  }, e2;
})(Xp);
var Yp = (function(t2) {
  function e2(e3, r2) {
    var n2 = t2.call(this, e3) || this, o2 = r2.transferControlToOffscreen();
    return n2.worker.postMessage({ op: "init", canvas: o2 }, [o2]), n2;
  }
  return Wp(e2, t2), e2.prototype.render = function(t3) {
    this.worker.postMessage({ op: "render", index: t3 });
  }, e2;
})(Jp);
var Kp = (function() {
  function t2() {
    this.empty = true, this.x = 0, this.y = 0, this.width = 0, this.height = 0;
  }
  return t2.prototype.reset = function() {
    this.empty = true, this.x = 0, this.y = 0, this.width = 0, this.height = 0;
  }, t2.prototype.set = function(t3, e2, r2, n2) {
    void 0 === r2 && (r2 = 0), void 0 === n2 && (n2 = 0), this.empty = false, this.x = t3, this.y = e2, this.width = r2, this.height = n2;
  }, t2.prototype.union = function(t3, e2, r2, n2) {
    void 0 === r2 && (r2 = 0), void 0 === n2 && (n2 = 0), this.empty ? (this.empty = false, this.x = t3, this.y = e2, this.width = r2, this.height = n2) : (t3 < this.x && (this.width += this.x - t3, this.x = t3), e2 < this.y && (this.height += this.y - e2, this.y = e2), t3 + r2 > this.x + this.width && (this.width = t3 + r2 - this.x), e2 + n2 > this.y + this.height && (this.height = e2 + n2 - this.y));
  }, t2;
})();
var Zp = (function() {
  function t2(t3) {
    this.dirtyArea = new Kp(), this.canvas = t3, this.context = t3.getContext("2d");
  }
  return t2.prototype.draw = function(t3) {
    this.canvas && this.context && (this.dirtyArea.empty || (this.context.clearRect(this.dirtyArea.x, this.dirtyArea.y, this.dirtyArea.width, this.dirtyArea.height), this.dirtyArea.reset()), t3 && (this.canvas.width == t3.width && this.canvas.height == t3.height || (this.canvas.width = t3.width, this.canvas.height = t3.height), this.drawSubtitleData(t3, this.dirtyArea)));
  }, t2.prototype.drawSubtitleData = function(t3, e2) {
    for (var r2 = 0, n2 = t3.compositionData; r2 < n2.length; r2++) {
      var o2 = n2[r2];
      this.drawSubtitleCompositionData(o2, e2);
    }
  }, t2.prototype.drawSubtitleCompositionData = function(t3, e2) {
    var r2, n2, o2 = t3.compositionObject;
    o2.hasCropping ? (null === (r2 = this.context) || void 0 === r2 || r2.putImageData(t3.pixelData, o2.horizontalPosition, o2.verticalPosition, o2.croppingHorizontalPosition, o2.croppingVerticalPosition, o2.croppingWidth, o2.croppingHeight), null == e2 || e2.union(o2.horizontalPosition, o2.verticalPosition, o2.croppingWidth, o2.croppingHeight)) : (null === (n2 = this.context) || void 0 === n2 || n2.putImageData(t3.pixelData, o2.horizontalPosition, o2.verticalPosition), null == e2 || e2.union(o2.horizontalPosition, o2.verticalPosition, t3.pixelData.width, t3.pixelData.height));
  }, t2;
})();
var Qp = (function() {
  function t2(t3) {
    this.$position = 0, this.array = t3;
  }
  return Object.defineProperty(t2.prototype, "position", { get: function() {
    return this.$position;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "length", { get: function() {
    return this.array.length;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "eof", { get: function() {
    return this.position >= this.length;
  }, enumerable: false, configurable: true }), t2.prototype.readByte = function() {
    return this.array[this.$position++];
  }, t2.prototype.readBytes = function(t3) {
    var e2 = this.array.slice(this.$position, this.$position + t3);
    return this.$position += t3, e2;
  }, t2;
})();
var td = (function() {
  function t2(t3) {
    t3 instanceof Uint8Array ? this.baseReader = new Qp(t3) : this.baseReader = t3;
  }
  return Object.defineProperty(t2.prototype, "position", { get: function() {
    return this.baseReader.position;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "length", { get: function() {
    return this.baseReader.length;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "eof", { get: function() {
    return this.baseReader.eof;
  }, enumerable: false, configurable: true }), t2.prototype.readUInt8 = function() {
    return this.baseReader.readByte();
  }, t2.prototype.readUInt16 = function() {
    return (this.baseReader.readByte() << 8) + this.baseReader.readByte();
  }, t2.prototype.readUInt24 = function() {
    return (this.baseReader.readByte() << 16) + (this.baseReader.readByte() << 8) + this.baseReader.readByte();
  }, t2.prototype.readUInt32 = function() {
    return (this.baseReader.readByte() << 24) + (this.baseReader.readByte() << 16) + (this.baseReader.readByte() << 8) + this.baseReader.readByte();
  }, t2.prototype.readBytes = function(t3) {
    return this.baseReader.readBytes(t3);
  }, t2;
})();
!(function(t2) {
  t2[t2.paletteDefinition = 20] = "paletteDefinition", t2[t2.objectDefinition = 21] = "objectDefinition", t2[t2.presentationComposition = 22] = "presentationComposition", t2[t2.windowDefinition = 23] = "windowDefinition", t2[t2.end = 128] = "end";
})(Vp || (Vp = {}));
var ed;
var rd = (function() {
  function t2() {
    this.id = 0, this.windowId = 0, this.croppedFlag = 0, this.horizontalPosition = 0, this.verticalPosition = 0, this.croppingHorizontalPosition = 0, this.croppingVerticalPosition = 0, this.croppingWidth = 0, this.croppingHeight = 0;
  }
  return Object.defineProperty(t2.prototype, "hasCropping", { get: function() {
    return !!(128 & this.croppedFlag);
  }, enumerable: false, configurable: true }), t2;
})();
var nd = (function() {
  function t2() {
    this.width = 0, this.height = 0, this.frameRate = 0, this.compositionNumber = 0, this.compositionState = 0, this.paletteUpdateFlag = 0, this.paletteId = 0, this.compositionObjects = [];
  }
  return Object.defineProperty(t2.prototype, "segmentType", { get: function() {
    return Vp.presentationComposition;
  }, enumerable: false, configurable: true }), t2.prototype.read = function(t3, e2) {
    this.width = t3.readUInt16(), this.height = t3.readUInt16(), this.frameRate = t3.readUInt8(), this.compositionNumber = t3.readUInt16(), this.compositionState = t3.readUInt8(), this.paletteUpdateFlag = t3.readUInt8(), this.paletteId = t3.readUInt8();
    var r2 = t3.readUInt8();
    this.compositionObjects = [];
    for (var n2 = 0; n2 < r2; n2++) {
      var o2 = new rd();
      o2.id = t3.readUInt16(), o2.windowId = t3.readUInt8(), o2.croppedFlag = t3.readUInt8(), o2.horizontalPosition = t3.readUInt16(), o2.verticalPosition = t3.readUInt16(), o2.hasCropping && (o2.croppingHorizontalPosition = t3.readUInt16(), o2.croppingVerticalPosition = t3.readUInt16(), o2.croppingWidth = t3.readUInt16(), o2.croppingHeight = t3.readUInt16()), this.compositionObjects.push(o2);
    }
  }, t2;
})();
var od = (function() {
  function t2() {
    this.id = 0, this.versionNumber = 0, this.rgba = [];
  }
  return Object.defineProperty(t2.prototype, "segmentType", { get: function() {
    return Vp.paletteDefinition;
  }, enumerable: false, configurable: true }), t2.prototype.read = function(e2, r2) {
    this.id = e2.readUInt8(), this.versionNumber = e2.readUInt8();
    var n2 = (r2 - 2) / 5, o2 = new Uint32Array(1), i2 = new Uint8Array(o2.buffer);
    this.rgba = [];
    for (var a2 = 0; a2 < n2; a2++) {
      var s2 = e2.readUInt8(), u2 = e2.readUInt8(), c2 = e2.readUInt8() - 128, f2 = e2.readUInt8() - 128, h2 = e2.readUInt8(), p2 = t2.clamp(Math.round(u2 + 1.402 * c2), 0, 255), d2 = t2.clamp(Math.round(u2 - 0.34414 * f2 - 0.71414 * c2), 0, 255), l2 = t2.clamp(Math.round(u2 + 1.772 * f2), 0, 255);
      i2[0] = p2, i2[1] = d2, i2[2] = l2, i2[3] = h2, this.rgba[s2] = o2[0];
    }
  }, t2.clamp = function(t3, e2, r2) {
    return t3 < e2 ? e2 : t3 > r2 ? r2 : t3;
  }, t2;
})();
var id = (function() {
  function t2() {
    this.id = 0, this.versionNumber = 0, this.lastInSequenceFlag = 0, this.width = 0, this.height = 0, this.dataLength = 0;
  }
  return Object.defineProperty(t2.prototype, "isFirstInSequence", { get: function() {
    return !!(128 & this.lastInSequenceFlag);
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "isLastInSequence", { get: function() {
    return !!(64 & this.lastInSequenceFlag);
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "segmentType", { get: function() {
    return Vp.objectDefinition;
  }, enumerable: false, configurable: true }), t2.prototype.read = function(t3, e2) {
    this.id = t3.readUInt16(), this.versionNumber = t3.readUInt8(), this.lastInSequenceFlag = t3.readUInt8(), this.isFirstInSequence ? (this.dataLength = t3.readUInt24(), this.width = t3.readUInt16(), this.height = t3.readUInt16(), this.data = t3.readBytes(e2 - 11)) : this.data = t3.readBytes(e2 - 4);
  }, t2;
})();
var ad = function() {
  this.id = 0, this.horizontalPosition = 0, this.verticalPosition = 0, this.width = 0, this.height = 0;
};
var sd = (function() {
  function t2() {
    this.windows = [];
  }
  return Object.defineProperty(t2.prototype, "segmentType", { get: function() {
    return Vp.windowDefinition;
  }, enumerable: false, configurable: true }), t2.prototype.read = function(t3, e2) {
    var r2 = t3.readUInt8();
    this.windows = [];
    for (var n2 = 0; n2 < r2; n2++) {
      var o2 = new ad();
      o2.id = t3.readUInt8(), o2.horizontalPosition = t3.readUInt16(), o2.verticalPosition = t3.readUInt16(), o2.width = t3.readUInt16(), o2.height = t3.readUInt16(), this.windows.push(o2);
    }
  }, t2;
})();
var ud = (function() {
  function t2() {
    this.presentationTimestamp = 0, this.decodingTimestamp = 0, this.paletteDefinitions = [], this.objectDefinitions = [], this.windowDefinitions = [];
  }
  return t2.prototype.read = function(t3, e2) {
    return qp(this, void 0, void 0, (function() {
      var r2, n2, o2, i2, a2, s2, u2, c2, f2;
      return Gp(this, (function(h2) {
        switch (h2.label) {
          case 0:
            this.presentationTimestamp = 0, this.decodingTimestamp = 0, this.presentationComposition = void 0, this.paletteDefinitions = [], this.objectDefinitions = [], this.windowDefinitions = [], r2 = void 0, "requestData" in t3.baseReader && (r2 = t3.baseReader), h2.label = 1;
          case 1:
            return n2 = 0, o2 = 0, e2 ? [4, null == r2 ? void 0 : r2.requestData(10)] : [3, 3];
          case 2:
            if (h2.sent(), 20551 != t3.readUInt16()) throw new Error("Invalid magic number!");
            n2 = t3.readUInt32(), o2 = t3.readUInt32(), h2.label = 3;
          case 3:
            return [4, null == r2 ? void 0 : r2.requestData(3)];
          case 4:
            return h2.sent(), i2 = t3.readUInt8(), a2 = t3.readUInt16(), [4, null == r2 ? void 0 : r2.requestData(a2)];
          case 5:
            switch (h2.sent(), i2) {
              case Vp.paletteDefinition:
                (s2 = new od()).read(t3, a2), this.paletteDefinitions.push(s2);
                break;
              case Vp.objectDefinition:
                (u2 = new id()).read(t3, a2), this.objectDefinitions.push(u2);
                break;
              case Vp.presentationComposition:
                (c2 = new nd()).read(t3, a2), this.presentationComposition = c2, this.presentationTimestamp = n2, this.decodingTimestamp = o2;
                break;
              case Vp.windowDefinition:
                (f2 = new sd()).read(t3, a2), this.windowDefinitions.push(f2);
                break;
              case Vp.end:
                return [2];
              default:
                throw new Error("Unsupported segment type ".concat(i2));
            }
            return [3, 1];
          case 6:
            return [2];
        }
      }));
    }));
  }, t2;
})();
var cd = (function() {
  function t2(t3) {
    this.$position = 0, this.subReaderIndex = 0, this.subReaders = t3.map((function(t4) {
      return t4 instanceof Uint8Array ? new Qp(t4) : t4;
    }));
    for (var e2 = 0, r2 = 0, n2 = t3; r2 < n2.length; r2++) {
      e2 += n2[r2].length;
    }
    this.$length = e2;
  }
  return t2.prototype.push = function(t3) {
    t3 instanceof Uint8Array ? this.subReaders.push(new Qp(t3)) : this.subReaders.push(t3), this.$length += t3.length;
  }, Object.defineProperty(t2.prototype, "position", { get: function() {
    return this.$position;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "length", { get: function() {
    return this.$length;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "eof", { get: function() {
    return this.position >= this.length;
  }, enumerable: false, configurable: true }), t2.prototype.readByte = function() {
    for (; this.subReaders[this.subReaderIndex].position >= this.subReaders[this.subReaderIndex].length; ) this.subReaderIndex++;
    return this.$position++, this.subReaders[this.subReaderIndex].readByte();
  }, t2.prototype.readBytes = function(t3) {
    for (var e2 = new Uint8Array(t3), r2 = 0; r2 < t3; r2++) e2[r2] = this.readByte();
    return e2;
  }, t2;
})();
var fd = (function() {
  function t2(t3) {
    this.$eof = false, this.stream = t3, this.reader = new cd([]);
  }
  return Object.defineProperty(t2.prototype, "position", { get: function() {
    return this.reader.position;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "length", { get: function() {
    return this.reader.length;
  }, enumerable: false, configurable: true }), Object.defineProperty(t2.prototype, "eof", { get: function() {
    return this.$eof;
  }, enumerable: false, configurable: true }), t2.prototype.readByte = function() {
    return this.reader.readByte();
  }, t2.prototype.readBytes = function(t3) {
    return this.reader.readBytes(t3);
  }, t2.prototype.requestData = function() {
    return qp(this, arguments, void 0, (function(t3) {
      var e2, r2, n2;
      return void 0 === t3 && (t3 = 0), Gp(this, (function(o2) {
        switch (o2.label) {
          case 0:
            return this.reader.position + t3 + 1 > this.reader.length && !this.$eof ? [4, this.stream.read()] : [3, 2];
          case 1:
            return e2 = o2.sent(), r2 = e2.value, n2 = e2.done, r2 && this.reader.push(r2), n2 && (this.$eof = true), [3, 0];
          case 2:
            return [2, this.reader.position + t3 <= this.reader.length];
        }
      }));
    }));
  }, t2;
})();
var hd = function(t2, e2, r2) {
  this.width = t2, this.height = e2, this.compositionData = r2;
};
var pd = function(t2, e2, r2) {
  this.compositionObject = t2, this.window = e2, this.pixelData = r2;
};
var dd = (function() {
  function t2() {
  }
  return t2.decode = function(t3, e2, r2) {
    t3 instanceof Uint8Array && (t3 = new Qp(t3));
    for (var n2 = 0; t3.position < t3.length; ) {
      var o2 = t3.readByte();
      if (0 == o2) {
        var i2 = t3.readByte();
        if (0 != i2) {
          var a2 = !!(128 & i2), s2 = 63 & i2;
          !!(64 & i2) && (s2 = (s2 << 8) + t3.readByte());
          for (var u2 = a2 ? t3.readByte() : 0, c2 = 0; c2 < s2; c2++) r2[n2++] = e2[u2];
        }
      } else r2[n2++] = e2[o2];
    }
    return n2;
  }, t2;
})();
var ld = (function() {
  function t2() {
    this.displaySets = [], this.updateTimestamps = [];
  }
  return t2.prototype.loadFromUrl = function(t3, e2) {
    return qp(this, void 0, void 0, (function() {
      var r2, n2, o2, i2, a2;
      return Gp(this, (function(s2) {
        switch (s2.label) {
          case 0:
            return [4, fetch(t3)];
          case 1:
            if (!(r2 = s2.sent()).ok) throw new Error("HTTP error: ".concat(r2.status));
            return (n2 = null === (a2 = r2.body) || void 0 === a2 ? void 0 : a2.getReader()) ? (o2 = new fd(n2), [3, 4]) : [3, 2];
          case 2:
            return [4, r2.arrayBuffer()];
          case 3:
            i2 = s2.sent(), o2 = new Qp(new Uint8Array(i2)), s2.label = 4;
          case 4:
            return [4, this.loadFromReader(o2, e2)];
          case 5:
            return s2.sent(), [2];
        }
      }));
    }));
  }, t2.prototype.loadFromBuffer = function(t3, e2) {
    return qp(this, void 0, void 0, (function() {
      return Gp(this, (function(r2) {
        switch (r2.label) {
          case 0:
            return [4, this.loadFromReader(new Qp(new Uint8Array(t3)), e2)];
          case 1:
            return r2.sent(), [2];
        }
      }));
    }));
  }, t2.prototype.loadFromReader = function(t3, e2) {
    return qp(this, void 0, void 0, (function() {
      var r2, n2, o2, i2;
      return Gp(this, (function(a2) {
        switch (a2.label) {
          case 0:
            this.displaySets = [], this.updateTimestamps = [], this.cachedSubtitleData = void 0, r2 = performance.now(), n2 = new td(t3), a2.label = 1;
          case 1:
            return t3.eof ? [3, 3] : [4, (o2 = new ud()).read(n2, true)];
          case 2:
            return a2.sent(), this.displaySets.push(o2), this.updateTimestamps.push(o2.presentationTimestamp), (null == e2 ? void 0 : e2.onProgress) && (i2 = performance.now()) > r2 + 1e3 && (r2 = i2, e2.onProgress()), [3, 1];
          case 3:
            return (null == e2 ? void 0 : e2.onProgress) && e2.onProgress(), [2];
        }
      }));
    }));
  }, t2.prototype.cacheSubtitleAtIndex = function(t3) {
    var e2 = this.getSubtitleAtIndex(t3);
    this.cachedSubtitleData = { index: t3, data: e2 };
  }, t2.prototype.getSubtitleAtTimestamp = function(t3) {
    var e2 = zp.getIndexFromTimestamps(t3, this.updateTimestamps);
    return this.getSubtitleAtIndex(e2);
  }, t2.prototype.getSubtitleAtIndex = function(t3) {
    var e2;
    if (this.cachedSubtitleData && this.cachedSubtitleData.index === t3) return this.cachedSubtitleData.data;
    if (!(t3 < 0 || t3 >= this.displaySets.length)) {
      var r2 = this.displaySets[t3];
      if (r2.presentationComposition) {
        for (var n2 = [], o2 = [], i2 = [], a2 = t3; a2 >= 0; ) {
          var s2 = this.displaySets[a2];
          n2.unshift.apply(n2, s2.objectDefinitions), o2.unshift.apply(o2, s2.paletteDefinitions);
          for (var u2 = 0, c2 = s2.windowDefinitions; u2 < c2.length; u2++) {
            var f2 = c2[u2];
            i2.unshift.apply(i2, f2.windows);
          }
          if (0 !== (null === (e2 = this.displaySets[a2].presentationComposition) || void 0 === e2 ? void 0 : e2.compositionState)) break;
          a2--;
        }
        var h2 = o2.find((function(t4) {
          var e3;
          return t4.id === (null === (e3 = r2.presentationComposition) || void 0 === e3 ? void 0 : e3.paletteId);
        }));
        if (h2) {
          for (var p2 = [], d2 = function(t4) {
            var e3 = i2.find((function(e4) {
              return e4.id === t4.windowId;
            }));
            if (!e3) return "continue";
            var r3 = l2.getPixelDataFromComposition(t4, h2, n2);
            r3 && p2.push(new pd(t4, e3, r3));
          }, l2 = this, y2 = 0, v2 = r2.presentationComposition.compositionObjects; y2 < v2.length; y2++) {
            d2(v2[y2]);
          }
          if (0 !== p2.length) return new hd(r2.presentationComposition.width, r2.presentationComposition.height, p2);
        }
      }
    }
  }, t2.prototype.getPixelDataFromComposition = function(t3, e2, r2) {
    for (var n2 = 0, o2 = 0, i2 = [], a2 = 0, s2 = r2; a2 < s2.length; a2++) {
      var u2 = s2[a2];
      u2.id == t3.id && (u2.isFirstInSequence && (n2 = u2.width, o2 = u2.height), u2.data && i2.push(u2.data));
    }
    if (0 != i2.length) {
      var c2 = new cd(i2);
      if ("undefined" != typeof document) {
        var f2 = document.createElement("canvas").getContext("2d").createImageData(n2, o2), h2 = new Uint32Array(f2.data.buffer);
        return dd.decode(c2, e2.rgba, h2), f2;
      }
      h2 = new Uint32Array(n2 * o2);
      return dd.decode(c2, e2.rgba, h2), new ImageData(new Uint8ClampedArray(h2.buffer), n2, o2);
    }
  }, t2;
})();
var yd = (function(t2) {
  function e2(e3, r2) {
    var n2 = t2.call(this) || this;
    return n2.pgs = new ld(), n2.renderer = new Zp(r2), n2;
  }
  return Wp(e2, t2), e2.prototype.render = function(t3) {
    var e3 = this, r2 = this.pgs.getSubtitleAtIndex(t3);
    requestAnimationFrame((function() {
      e3.renderer.draw(r2);
    })), this.pgs.cacheSubtitleAtIndex(t3 + 1);
  }, e2.prototype.loadFromUrl = function(t3) {
    var e3 = this;
    this.pgs.loadFromUrl(t3, { onProgress: function() {
      e3.invokeTimestampsUpdate();
    } }).then((function() {
      e3.invokeTimestampsUpdate();
    }));
  }, e2.prototype.loadFromBuffer = function(t3) {
    var e3 = this;
    this.pgs.loadFromBuffer(t3).then((function() {
      e3.invokeTimestampsUpdate();
    }));
  }, e2.prototype.invokeTimestampsUpdate = function() {
    this.setUpdateTimestamps(this.pgs.updateTimestamps);
  }, e2.prototype.dispose = function() {
  }, e2;
})(Xp);
var vd = (function(t2) {
  function e2(e3, r2) {
    var n2 = t2.call(this, e3) || this;
    return n2.renderer = new Zp(r2), n2.worker.postMessage({ op: "init" }), n2;
  }
  return Wp(e2, t2), e2.prototype.render = function(t3) {
    this.worker.postMessage({ op: "requestSubtitleData", index: t3 });
  }, e2.prototype.onWorkerMessage = function(e3) {
    if ("subtitleData" === e3.data.op) {
      var r2 = e3.data.subtitleData;
      this.renderer && this.renderer.draw(r2);
    } else t2.prototype.onWorkerMessage.call(this, e3);
  }, e2;
})(Jp);
!(function(t2) {
  t2.worker = "worker", t2.workerWithoutOffscreenCanvas = "workerWithoutOffscreenCanvas", t2.mainThread = "mainThread";
})(ed || (ed = {}));
var md = (function() {
  function t2() {
  }
  return t2.isWorkerSupported = function() {
    return !!Worker;
  }, t2.isOffscreenCanvasSupported = function() {
    return !!HTMLCanvasElement.prototype.transferControlToOffscreen;
  }, t2.getRendererModeByPlatform = function() {
    var t3 = navigator.userAgent, e2 = /Chrome\/(\d+)/.exec(t3), r2 = e2 ? parseInt(e2[1]) : void 0, n2 = /Firefox\/(\d+)/.exec(t3), o2 = n2 ? parseInt(n2[1]) : void 0, i2 = navigator.userAgent.indexOf("Web0S") >= 0;
    if (r2 && r2 < 36) return ed.mainThread;
    if (o2 && o2 < 25) return ed.mainThread;
    if (i2 && void 0 === r2) return ed.mainThread;
    if (i2 && r2 && r2 <= 68) return ed.mainThread;
    var a2 = this.isWorkerSupported(), s2 = this.isOffscreenCanvasSupported();
    return a2 ? s2 ? ed.worker : ed.workerWithoutOffscreenCanvas : ed.mainThread;
  }, t2;
})();
var bd = (function() {
  function t2(t3) {
    var e2, r2 = this;
    if (this.$timeOffset = 0, this.onTimeUpdate = function() {
      r2.renderAtVideoTimestamp();
    }, this.$aspectRatio = "contain", t3.video && (this.video = t3.video), t3.canvas) this.canvas = t3.canvas, this.canvasOwner = false;
    else {
      if (!this.video) throw new Error("No canvas or video element was provided!");
      this.canvas = this.createCanvasElement(), this.canvasOwner = true, this.video.parentElement.appendChild(this.canvas);
    }
    this.implementation = this.createPgsRenderer(t3), this.implementation.onTimestampsUpdated = function() {
      r2.renderAtVideoTimestamp();
    }, this.$timeOffset = null !== (e2 = t3.timeOffset) && void 0 !== e2 ? e2 : 0, t3.aspectRatio && (this.aspectRatio = t3.aspectRatio), t3.subUrl && this.loadFromUrl(t3.subUrl), this.registerVideoEvents();
  }
  return t2.prototype.createPgsRenderer = function(t3) {
    var e2;
    switch (null !== (e2 = t3.mode) && void 0 !== e2 ? e2 : md.getRendererModeByPlatform()) {
      case ed.worker:
        return new Yp(t3, this.canvas);
      case ed.workerWithoutOffscreenCanvas:
        return new vd(t3, this.canvas);
      case ed.mainThread:
        return new yd(t3, this.canvas);
    }
  }, t2.prototype.loadFromUrl = function(t3) {
    this.implementation.loadFromUrl(t3);
  }, t2.prototype.loadFromBuffer = function(t3) {
    this.implementation.loadFromBuffer(t3);
  }, t2.prototype.renderAtTimestamp = function(t3) {
    this.implementation.renderAtTimestamp(t3);
  }, Object.defineProperty(t2.prototype, "timeOffset", { get: function() {
    return this.$timeOffset;
  }, set: function(t3) {
    this.$timeOffset !== t3 && (this.$timeOffset = t3, this.renderAtVideoTimestamp());
  }, enumerable: false, configurable: true }), t2.prototype.registerVideoEvents = function() {
    var t3;
    null === (t3 = this.video) || void 0 === t3 || t3.addEventListener("timeupdate", this.onTimeUpdate);
  }, t2.prototype.unregisterVideoEvents = function() {
    var t3;
    null === (t3 = this.video) || void 0 === t3 || t3.removeEventListener("timeupdate", this.onTimeUpdate);
  }, t2.prototype.renderAtVideoTimestamp = function() {
    this.video && this.renderAtTimestamp(this.video.currentTime + this.$timeOffset);
  }, t2.prototype.createCanvasElement = function() {
    var t3 = document.createElement("canvas");
    return t3.style.position = "absolute", t3.style.top = "0", t3.style.left = "0", t3.style.right = "0", t3.style.bottom = "0", t3.style.pointerEvents = "none", t3.style.objectFit = this.$aspectRatio, t3.style.width = "100%", t3.style.height = "100%", t3;
  }, t2.prototype.destroyCanvasElement = function() {
    this.canvas.remove();
  }, Object.defineProperty(t2.prototype, "aspectRatio", { get: function() {
    return this.$aspectRatio;
  }, set: function(t3) {
    this.$aspectRatio = t3, this.canvas.style.objectFit = this.$aspectRatio;
  }, enumerable: false, configurable: true }), t2.prototype.dispose = function() {
    this.implementation.dispose(), this.unregisterVideoEvents(), this.canvasOwner && this.destroyCanvasElement();
  }, t2;
})();
export {
  bd as PgsRenderer
};
