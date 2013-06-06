package gasmine

import org.apache.commons.io.IOUtils
import org.gradle.api.*
import org.gradle.api.plugins.*
import org.gradle.api.tasks.*
import org.mozilla.javascript.Context
import org.mozilla.javascript.ContextFactory
import org.mozilla.javascript.Function
import org.mozilla.javascript.ImporterTopLevel
import org.mozilla.javascript.Scriptable
import org.mozilla.javascript.ScriptableObject
import java.text.MessageFormat

class GasminePlugin implements Plugin<Project> {

  void apply(final Project project) {

    project.dependencies {
      testCompile "ch.qos.logback:logback-classic:1.0.6"
      testCompile "junit:junit:4.10"
    }

    project.task("testScripts")
    
    project.tasks.testScripts.dependsOn(project.tasks.test)
    project.tasks.check.dependsOn(project.tasks.testScripts)

    project.tasks.testScripts.doLast {
    
      File scriptDirectory = project.file("src/test/resources")
    
      def urls = [ 
        new File(project.buildDir, "classes/main").toURI().toURL(),
        new File(project.buildDir, "classes/test").toURI().toURL(),
        new File(project.buildDir, "resources/main").toURI().toURL(),
        new File(project.buildDir, "resources/test").toURI().toURL() 
      ]
      urls += project.configurations["runtime"].collect { dep -> dep.toURI().toURL() }
      URLClassLoader classLoader = new URLClassLoader(urls as URL[], GasminePlugin.class.classLoader)
      
      Object result
      Context cx = ContextFactory.getGlobal().enterContext()
      try {
        cx.setLanguageVersion(Context.VERSION_1_8)
        cx.setApplicationClassLoader(classLoader)
        ScriptableObject scope = new ImporterTopLevel(cx)
        scope.defineFunctionProperties([ 
          "__load" 
        ] as String[], GasminePlugin.class, 0);
        scope.put("logger", scope, Context.javaToJS(logger, scope));
        Object testRunner = loadScript(cx, scope, "gasmine/testRunner.js")
        if (!(testRunner instanceof Function))
          throw new Exception("result of testRunner script is expected to be a function")
        Function func = testRunner
        result = func.call(
          cx, 
          scope, 
          null, 
          [ Context.javaToJS(scriptDirectory, scope), Context.javaToJS(logger, scope) ] as Object[]
        )
      } finally {
        Context.exit()
      }
    
      if(result != 0)
        // assuming that test reporting tool already explained the reason of failure.
        throw new GradleException("Build interrupted because of test errors");
    }
  }
  
  private static Object loadScript(Context cx, ScriptableObject scope, String scriptFileName) {
    String script;
    File file = new File(scriptFileName)
    if(file.exists())
      file.withInputStream { ins ->
        script = IOUtils.toString(ins, "UTF-8");
      }  
    else {
      def ins = cx.getApplicationClassLoader().getResourceAsStream(scriptFileName)
      if(ins == null)
        throw new Exception(MessageFormat.format("Script ''{0}'' not found", scriptFileName))
      script = IOUtils.toString(ins, "UTF-8")
    }
    return cx.evaluateString(scope, script, scriptFileName, 1, null)
  }

  public static Object __load(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
    if (args == null || args.length == 0) {
      logInvalidArgs(cx.get("logger"), "load");
      return Context.getUndefinedValue();
    }
    Object result = Context.getUndefinedValue();
    try {
      for (Object arg : args) {
        Scriptable thisScope = thisObj == null ? funObj : thisObj;
        result = loadScript(cx, thisScope, Context.toString(arg));
      }
    } catch (Throwable x) {
      Context.throwAsScriptRuntimeEx(x);
    }
    return result;
  }

  private static void logInvalidArgs(logger, functionName) {
    logger.warn("Called '{}' with incorrect arguments", functionName);
  }
}
