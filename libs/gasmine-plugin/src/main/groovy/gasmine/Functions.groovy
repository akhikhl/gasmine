package gasmine

import gino.Runner

import org.mozilla.javascript.Context
import org.mozilla.javascript.Function
import org.mozilla.javascript.Scriptable
import org.mozilla.javascript.ScriptableObject
import org.slf4j.Logger
import org.slf4j.LoggerFactory

public final class Functions {

  private static Logger logger = LoggerFactory.getLogger(Functions.class)

  // this is workaround for a bug with Mozilla Rhino 1.7R4 and java.util.TimerTask:
  // attempt to extend it in javascript produces NuSuchMethod exception.

  private static class DelegatedTimerTask extends java.util.TimerTask {

    private final ClassLoader classLoader
    private final Scriptable scope
    private final Function function

    DelegatedTimerTask(ClassLoader classLoader, Scriptable scope, Function function) {
      this.classLoader = classLoader
      this.scope = scope
      this.function = function
    }

    @Override
    public void run() {
      Thread.currentThread().setContextClassLoader(classLoader)
      Context cx = Runner.enterContext(classLoader)
      try {
        function.call cx, scope, scope, [] as Object[]
      } finally {
        Runner.exitContext()
      }
    }
  }

  public static void defineFunctions(ScriptableObject scope) {
    scope.defineFunctionProperties([
      "createTimerTask"
    ] as String[], Functions.class, 0)
  }

  public static Object createTimerTask(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
    if (args == null || args.length != 1) {
      logInvalidArgs("createTimerTask")
      return Context.getUndefinedValue()
    }
    return Context.toObject(new DelegatedTimerTask(cx.getApplicationClassLoader(), thisObj, args[0]), thisObj)
  }

  private static void logInvalidArgs(String functionName) {
    logger.warn("Called '{}' with incorrect arguments", functionName)
  }
}
