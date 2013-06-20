// simulating setTimeout and the likes for the use with jasmine

(function (global) {
    var timer = new java.util.Timer();
    var counter = 1; 
    var ids = {};

    global.setTimeout = function (fn,delay) {
      var id = counter++;
      ids[id] = createTimerTask(new java.lang.Runnable({ run: function() { fn(); } }));
      timer.schedule(ids[id], delay);
      return id;
    };

    global.clearTimeout = function (id) {
      ids[id].cancel();
      timer.purge();
      delete ids[id];
    };

    global.setInterval = function (fn,delay) {
      var id = counter++; 
      ids[id] = createTimerTask(new java.lang.Runnable({ run: function() { fn(); } }));
      timer.schedule(ids[id],delay,delay);
      return id;
    };

    global.clearInterval = function (id) {
      ids[id].cancel();
      timer.purge();
      delete ids[id];
    };

    global.clearAllTimeouts = function () {
      for(let [id, task] in ids)
        task.cancel();
      timer.purge();
      timer.cancel();
      ids = {};      
    };
    
})(this);