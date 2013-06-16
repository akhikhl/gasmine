(function(global) {
  
  jX.fn.toXML = function(writer, options) {
    
    let handler = extend({}, options, new function() {
    });
    
    return this.walk(handler);
  };
  
  global.toXML = function(obj) {
    return global.jX(obj).toXML().get();
  };
  
})(this);