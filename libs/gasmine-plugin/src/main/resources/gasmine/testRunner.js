load("gasmine/settimeout.js");
load("jasmine/jasmine.js");
load("gasmine/consoleReporter.js");
importClass(java.io.FileFilter);
importClass(org.apache.commons.io.FilenameUtils);

(function(global) {
  
  function loadTestScripts(folder) {
    let subFolders = folder.listFiles(FileFilter({ accept: function(f) { return f.isDirectory(); } }));
    if(subFolders != null)
      for each(let subFolder in subFolders)
        loadTestScripts(subFolder);
    let files = folder.listFiles(FileFilter({ accept: function(f) { 
      if(!f.isFile())
        return false;
      let fname = f.getName();
      let fbaseName = FilenameUtils.getBaseName(fname);
      return fname.endsWith(".js") && (fbaseName.startsWith("Test") || fbaseName.endsWith("Test"));
    } }));
    if(files != null)
      for each(let f in files) {
        logger.trace("Loading test script: {}", f.getName());
        load(f);
      }
  }
  
  return new function() {
    
    let env, reporter;
    
    this.beforeMain = function(args) {      
      Packages.gasmine.Functions.defineFunctions(global);
      env = global.jasmine.getEnv();
      reporter = new global.ConsoleReporter(logger);  
      env.addReporter(reporter);
      loadTestScripts(args[0]);
    };
    
    this.main = function(args) {
      try {
        env.execute();
        while(!reporter.getCompleted())
          java.lang.Thread.sleep(100);
      } finally {
        global.clearAllTimeouts();
      }
      return reporter.getFailCount();
    };
  };
})(this);
