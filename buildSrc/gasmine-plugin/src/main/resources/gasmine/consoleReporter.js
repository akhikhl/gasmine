// ConsoleReporter to be used with jasmine

function ConsoleReporter(logger) {
  
  let completed = false;
  let failCount = 0;
  
  this.getCompleted = function() {
    return sync(this, function() {
      return completed;
    });
  };
  
  this.getFailCount = function() {
    return failCount;
  };
  
  this.reportRunnerResults = function(runner) {
    let results = runner.results();
    if(results.failedCount == 0)
      logger.warn("RESULTS: {} total, {} passed.", results.totalCount.toFixed(), results.passedCount.toFixed());
    else
      logger.error("RESULTS: {} total, {} passed, {} FAILED.", toJavaArray([ results.totalCount.toFixed(), results.passedCount.toFixed(), results.failedCount.toFixed() ]));
    failCount = results.failedCount;
    sync(this, function() {
      completed = true;
    });
  };
  
  this.reportSpecResults = function(spec) {
    let results = spec.results();
    if(results.failedCount != 0) {
      logger.error("\nFAILED: {}", results.description);
      for each(let item in results.items_)
        if(!item.passed_)
          logger.error("  {}", item.message);
    }
  };
}