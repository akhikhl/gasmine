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

// jX.fn.reverse is of no practical use; here we just test transform itself.
describe("jX reverse", function() {

  beforeEach(function() {
    if(!jX.fn.reverse)
      jX.fn.reverse = function() {
        return this.transform({
          transformArray: function(arr) {
            return arr.reverse();
          },
          transformString: function(s) {
            var o = '';
            for (var i = s.length - 1; i >= 0; i--)
              o += s[i];
            return o;        
          }
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

describe("jX toJSON", function() {

  beforeEach(function() {
    if(!jX.fn.toJSON)
      jX.fn.toJSON = function() {
      
        let walker = new function() {
          
          let buffer = new java.lang.StringBuilder();
          let elemCountStack = [];
          
          function appendQuoted(s) {
            buffer.append("\"");
            for(let i = 0; i < s.length; i++) {
              let c = s.charAt(i);
              if(c == "\"" || c == "\\")
                buffer.append("\\");
              buffer.append(c);
            }
            buffer.append("\"");
          }
          
          this.enterArray = this.enterJavaArray = this.enterJavaCollection = function() {
            buffer.append("[");
            elemCountStack.push(0);
          };
          
          this.enterObject = this.enterJavaMap = function() {
            buffer.append("{");
            elemCountStack.push(0);
          };
          
          this.exitArray = this.exitJavaArray = this.exitJavaCollection = function() {
            if(elemCountStack[elemCountStack.length - 1] != 0)
              buffer.append(" ");
            buffer.append("]");
            elemCountStack.pop();
          };
          
          this.exitObject = this.exitJavaMap = function() {
            if(elemCountStack[elemCountStack.length - 1] != 0)
              buffer.append(" ");
            buffer.append("}");
            elemCountStack.pop();
          };
          
          this.gotArrayElement = function(obj, i, elem) {
            if(elemCountStack[elemCountStack.length - 1] != 0)
              buffer.append(",");
            buffer.append(" ");
            ++(elemCountStack[elemCountStack.length - 1]);
          };
          
          this.gotBoolean = function(b) {
            buffer.append(b ? "true" : "false");
          };
          
          this.gotJavaBoolean = function(b) {
            buffer.append(b == java.lang.Boolean.TRUE ? "true" : "false");
          };
          
          this.gotJavaChar = function(c) {
            this.gotString(String(java.lang.String.valueOf(c)));
          };
          
          this.gotJavaNumber = function(n) {
            n = Number(n);
            buffer.append(n % 1 == 0 ? n.toFixed() : n);
          };
          
          this.gotJavaString = function(s) {
            appendQuoted(String(s));
          };
          
          this.gotMapElement = function(obj, key, elem) {
            if(elemCountStack[elemCountStack.length - 1] != 0)
              buffer.append(",");
            buffer.append(" ");
            ++(elemCountStack[elemCountStack.length - 1]);
            key = String(key);
            let validIdent = false;
            if(key.length != 0 && java.lang.Character.isJavaIdentifierStart(key[0])) {
              validIdent = true;
              for (let i = 1; i < key.length; i++)
                 if(!java.lang.Character.isJavaIdentifierPart(key[i])) {
                   validIdent = false;
                   break;
                 }
            }
            if(validIdent)
              buffer.append(key);
            else
              appendQuoted(key)
            buffer.append(": ");
          };
          
          this.gotNull = function() {
            buffer.append("null");
          };
          
          this.gotNumber = function(n) {
            buffer.append(n % 1 == 0 ? n.toFixed() : n);
          };
          
          this.gotOther = function(x) {
            buffer.append(String(x));
          };
          
          this.gotString = function(s) {
            appendQuoted(s);
          };
          
          this.gotUndefined = function() {
            buffer.append("undefined");
          };
          
          this.result = function() {
            return String(buffer.toString());
          };
        };
        
        return this.walk(walker);
      };
  });
  
  it("should convert null to JSON", function() {
    expect(jX(null).toJSON().get()).toEqual("null");
  });
  it("should convert undefined to JSON", function() {
    expect(jX(undefined).toJSON().get()).toEqual("undefined");
  });
  it("should convert JS-string to JSON", function() {
    expect(jX("ab\"c").toJSON().get()).toEqual("\"ab\\\"c\"");
  });
  it("should convert Java-string to JSON", function() {
    expect(jX(new java.lang.String("ab\"c")).toJSON().get()).toEqual("\"ab\\\"c\"");
  });
  it("should convert JS-integer to JSON", function() {
    expect(jX(123).toJSON().get()).toEqual("123");
  });
  it("should convert JS-number to JSON", function() {
    expect(jX(123.5).toJSON().get()).toEqual("123.5");
  });
  it("should convert Java-integer to JSON", function() {
    expect(jX(new java.lang.Integer(123)).toJSON().get()).toEqual("123");
  });
  it("should convert Java-double to JSON", function() {
    expect(jX(new java.lang.Double(123.5)).toJSON().get()).toEqual("123.5");
  });
  it("should convert JS-boolean-true to JSON", function() {
    expect(jX(true).toJSON().get()).toEqual("true");
  });
  it("should convert JS-boolean-false to JSON", function() {
    expect(jX(false).toJSON().get()).toEqual("false");
  });
  it("should convert Java-boolean-true to JSON", function() {
    expect(jX(java.lang.Boolean.TRUE).toJSON().get()).toEqual("true");
  });
  it("should convert Java-boolean-false to JSON", function() {
    expect(jX(java.lang.Boolean.FALSE).toJSON().get()).toEqual("false");
  });
  it("should convert Java-char to JSON", function() {
    expect(jX(new java.lang.Character(new java.lang.String("a").charAt(0))).toJSON().get()).toEqual("\"a\"");
  });
  it("should convert empty JS-array to JSON", function() {
    expect(jX([]).toJSON().get()).toEqual("[]");
  });
  it("should convert JS-array to JSON", function() {
    expect(jX(["a", "b", 123]).toJSON().get()).toEqual("[ \"a\", \"b\", 123 ]");
  });
  it("should convert Java-array to JSON", function() {
    expect(jX(toJavaArray(["aaa", "bbb"])).toJSON().get()).toEqual("[ \"aaa\", \"bbb\" ]");
  });
  it("should convert Java-Collection to JSON", function() {
    let list = new java.util.LinkedList();
    list.add("aaa");
    list.add("bbb");
    expect(jX(list).toJSON().get()).toEqual("[ \"aaa\", \"bbb\" ]");
  });
  it("should convert JS-object to JSON", function() {
    expect(jX({ type: "apple", color: "red" }).toJSON().get()).toEqual("{ type: \"apple\", color: \"red\" }");
  });
  it("should convert empty JS-object to JSON", function() {
    expect(jX({}).toJSON().get()).toEqual("{}");
  });
  it("should convert JS-object with non-ident-keys to JSON", function() {
    expect(jX({ type: "apple", "color-value": "red" }).toJSON().get()).toEqual("{ type: \"apple\", \"color-value\": \"red\" }");
  });
  it("should convert Java-Map to JSON", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    expect(jX(map).toJSON().get()).toEqual("{ type: \"apple\", color: \"red\" }");
  });
  it("should convert nested Java structures to JSON", function() {
    let map = new java.util.LinkedHashMap();
    map.put("type", "apple");
    map.put("color", "red");
    let list = new java.util.LinkedList();
    list.add("big");
    list.add(new java.lang.String("small"));
    map.put("sizes", list);
    expect(jX(map).toJSON().get()).toEqual("{ type: \"apple\", color: \"red\", sizes: [ \"big\", \"small\" ] }");
  });
  it("should convert nulls within JS-object to JSON", function() {
    expect(jX({ type: "apple", color: null }).toJSON().get()).toEqual("{ type: \"apple\", color: null }");
  });
  it("should convert undefined within JS-object to JSON", function() {
    expect(jX({ type: "apple", color: undefined }).toJSON().get()).toEqual("{ type: \"apple\" }");
  });
});
