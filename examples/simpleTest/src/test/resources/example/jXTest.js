describe("jX monad", function() {
  it("should wrap/unwrap null", function() {
    expect(jX(null).get()).toBeNull();
  });
  it("should wrap/unwrap number", function() {
    var x = 123;
    expect(jX(x).get()).toBe(x);
  });
  it("should wrap/unwrap string", function() {
    var x = "hello";
    expect(jX(x).get()).toBe(x);
  });
  it("should wrap/unwrap array", function() {
    var x = [ 123, "hello" ];
    expect(jX(x).get()).toBe(x);
  });
  it("should wrap/unwrap object", function() {
    var x = { color: "red", name: "apple" };
    expect(jX(x).get()).toBe(x);
  });
  it("should double wrap", function() {
    var x = { color: "red", name: "apple" };
    var w = jX(x);
    expect(jX(w)).toBe(w);
  });
});

// jX.fn.reverse is not very useful; here we just test walk feature.
describe("jX reverse", function() {

  beforeEach(function() {
    if(!jX.fn.reverse)
      jX.fn.reverse = function() {
        return this.walk(new function() {
          let containerStack = [];
          this.beforeArray = function() {
            containerStack.push([]);
          };
          this.beforeObject = function() {
            containerStack.push({});
          };
          this.gotArray = function() {
            let result = containerStack.pop();
            result.reverse();
            return result;
          };
          this.gotObject = function() {
            return containerStack.pop();
          };
          this.gotArrayElement = function(arr, i, elem) {
            containerStack[containerStack.length - 1].push(elem);
          };
          this.gotMapElement = function(arr, key, i, val) {
            containerStack[containerStack.length - 1][key] = val;
          };
          this.gotString = function(s) {
            var o = '';
            for (var i = s.length - 1; i >= 0; i--)
              o += s[i];
            return o;
          };
        });
      };
  });
  
  it("should reverse an array", function() {
    expect(jX(["a", "b", "c"]).reverse().get()).toEqual(["c", "b", "a"]);
  });
  it("should reverse a string", function() {
    expect(jX("abc").reverse().get()).toEqual("cba");
  });
  it("should reverse arrays within object", function() {
    expect(jX({ one: ["a", "b"], two: ["c", "d"] }).reverse().get()).toEqual({ one: ["b", "a"], two: ["d", "c"] });
  });
  it("should reverse strings and arrays within object", function() {
    expect(jX({ one: ["abc", "def"] }).reverse().get()).toEqual({ one: ["fed", "cba"] });
  });
});

describe("jX toJS", function() {
  
  it("should retain intact JS-string", function() {
    expect(jX("abc").toJS().get()).toEqual("abc");
  });
  it("should convert Java-string to JS-string", function() {
    expect(jX(new java.lang.String("abc")).toJS().get()).toEqual("abc");
  });
  it("should retain intact JS-number", function() {
    expect(jX(123).toJS().get()).toEqual(123);
  });
  it("should convert Java-integer to JS-number", function() {
    expect(jX(new java.lang.Integer(123)).toJS().get()).toEqual(123);
  });
  it("should convert Java-double to JS-number", function() {
    expect(jX(new java.lang.Double(123.5)).toJS().get()).toEqual(123.5);
  });
  it("should retain intact JS-boolean-true", function() {
    expect(jX(true).toJS().get()).toBe(true);
  });
  it("should retain intact JS-boolean-false", function() {
    expect(jX(false).toJS().get()).toBe(false);
  });
  it("should convert Java-boolean-true to JS-boolean-true", function() {
    expect(jX(java.lang.Boolean.TRUE).toJS().get()).toBe(true);
  });
  it("should convert Java-boolean-false to JS-boolean-false", function() {
    expect(jX(java.lang.Boolean.FALSE).toJS().get()).toBe(false);
  });
  it("should convert Java-char to JS-string", function() {
    expect(jX(new java.lang.Character(new java.lang.String("a").charAt(0))).toJS().get()).toEqual("a");
  });
  it("should retain intact JS-array", function() {
    expect(jX(["a", "b"]).toJS().get()).toEqual(["a", "b"]);
  });
  it("should convert Java-array to JS-array", function() {
    expect(jX(toJavaArray(["aaa", "bbb"])).toJS().get()).toEqual(["aaa", "bbb"]);
  });
  it("should convert Java-Collection to JS-array", function() {
    let list = new java.util.LinkedList();
    list.add("aaa");
    list.add("bbb");
    expect(jX(list).toJS().get()).toEqual(["aaa", "bbb"]);
  });
  it("should retain intact JS-object", function() {
    expect(jX({ type: "apple", color: "red" }).toJS().get()).toEqual({ type: "apple", color: "red" });
  });
  it("should convert Java-Map to JS-object", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    expect(jX(map).toJS().get()).toEqual({ type: "apple", color: "red" });
  });
  it("should convert nested Java structures to JS equivalent", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    let list = new java.util.LinkedList();
    list.add("big");
    list.add(new java.lang.String("small"));
    map.put("sizes", list);
    expect(jX(map).toJS().get()).toEqual({ type: "apple", color: "red", sizes: ["big", "small"] });
  });
});

describe("jX toJSONString", function() {

  it("should convert null to JSON", function() {
    expect(jX(null).toJSONString().get()).toEqual('null');
  });
  it("should convert undefined to JSON", function() {
    expect(jX(undefined).toJSONString().get()).toEqual('undefined');
  });
  it("should convert JS-string to JSON", function() {
    expect(jX('ab"c').toJSONString().get()).toEqual('"ab\\"c"');
  });
  it("should convert Java-string to JSON", function() {
    expect(jX(new java.lang.String('ab"c')).toJSONString().get()).toEqual('"ab\\"c"');
  });
  it("should convert JS-integer to JSON", function() {
    expect(jX(123).toJSONString().get()).toEqual('123');
  });
  it("should convert JS-number to JSON", function() {
    expect(jX(123.5).toJSONString().get()).toEqual('123.5');
  });
  it("should convert Java-integer to JSON", function() {
    expect(jX(new java.lang.Integer(123)).toJSONString().get()).toEqual('123');
  });
  it("should convert Java-double to JSON", function() {
    expect(jX(new java.lang.Double(123.5)).toJSONString().get()).toEqual('123.5');
  });
  it("should convert JS-boolean-true to JSON", function() {
    expect(jX(true).toJSONString().get()).toEqual('true');
  });
  it("should convert JS-boolean-false to JSON", function() {
    expect(jX(false).toJSONString().get()).toEqual('false');
  });
  it("should convert Java-boolean-true to JSON", function() {
    expect(jX(java.lang.Boolean.TRUE).toJSONString().get()).toEqual('true');
  });
  it("should convert Java-boolean-false to JSON", function() {
    expect(jX(java.lang.Boolean.FALSE).toJSONString().get()).toEqual('false');
  });
  it("should convert Java-char to JSON", function() {
    expect(jX(new java.lang.Character(new java.lang.String("a").charAt(0))).toJSONString().get()).toEqual('"a"');
  });
  it("should convert empty JS-array to JSON", function() {
    expect(jX([]).toJSONString().get()).toEqual('[]');
  });
  it("should convert JS-array to JSON", function() {
    expect(jX(["a", "b", 123]).toJSONString().get()).toEqual('[ "a", "b", 123 ]');
  });
  it("should convert Java-array to JSON", function() {
    expect(jX(toJavaArray(["aaa", "bbb"])).toJSONString().get()).toEqual('[ "aaa", "bbb" ]');
  });
  it("should convert Java-Collection to JSON", function() {
    let list = new java.util.LinkedList();
    list.add("aaa");
    list.add("bbb");
    expect(jX(list).toJSONString().get()).toEqual('[ "aaa", "bbb" ]');
  });
  it("should convert JS-object to JSON", function() {
    expect(jX({ type: "apple", color: "red" }).toJSONString().get()).toEqual('{ "type": "apple", "color": "red" }');
  });
  it("should convert empty JS-object to JSON", function() {
    expect(jX({}).toJSONString().get()).toEqual('{}');
  });
  it("should convert JS-object with non-ident-keys to JSON", function() {
    expect(jX({ type: "apple", "color-value": "red" }).toJSONString().get()).toEqual('{ "type": "apple", "color-value": "red" }');
  });
  it("should convert complex JS-object to JSON", function() {
    expect(jX({ type: "apple", color: "red", sizes: [ "big", "small" ] }).toJSONString().get())
      .toEqual('{ "type": "apple", "color": "red", "sizes": [ "big", "small" ] }');
  });
  it("should convert Java-Map to JSON", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    expect(jX(map).toJSONString().get()).toEqual('{ "type": "apple", "color": "red" }');
  });
  it("should convert nested Java structures to JSON", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    let list = new java.util.LinkedList();
    list.add("big");
    list.add(new java.lang.String("small"));
    map.put("sizes", list);
    expect(jX(map).toJSONString().get()).toEqual('{ "type": "apple", "color": "red", "sizes": [ "big", "small" ] }');
  });
  it("should convert nulls within JS-object to JSON", function() {
    expect(jX({ type: "apple", color: null }).toJSONString().get()).toEqual('{ "type": "apple", "color": null }');
  });
  it("should convert undefined within JS-object to JSON", function() {
    expect(jX({ type: "apple", color: undefined }).toJSONString().get()).toEqual('{ "type": "apple" }');
  });
  it("should convert complex JS-object with exclusions to JSON", function() {
    expect(jX({ type: "apple", color: "red", sizes: [ "big", "small" ] }).toJSONString({ excludeKeys: [ "sizes" ] }).get())
      .toEqual('{ "type": "apple", "color": "red" }');
  });
  it("should convert function to JSON", function() {
    expect(jX(function(x, y) { return x + y; }).toJSONString().get()).toEqual('\nfunction (x, y) {\n    return x + y;\n}\n');
  });
});
