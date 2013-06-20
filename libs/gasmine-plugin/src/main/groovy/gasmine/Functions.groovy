package gasmine

import org.mozilla.javascript.Context
import org.mozilla.javascript.Function
import org.mozilla.javascript.NativeJavaObject
import org.mozilla.javascript.Scriptable
import org.mozilla.javascript.ScriptableObject
import org.slf4j.Logger
import org.slf4j.LoggerFactory

public final class Functions {

  private static Logger logger = LoggerFactory.getLogger(Functions.class)

  // this is workaround for a bug with Mozilla Rhino 1.7R4 and java.util.TimerTask:
  // attempt to extend it in javascript produces NuSuchMethod exception.

  private static class DelegatedTimerTask extends java.util.TimerTask {

    Runnable runnable

    DelegatedTimerTask(Runnable runnable) {
      this.runnable = runnable
    }

    @Override
    public void run() {
      runnable.run()
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
    return Context.toObject(new DelegatedTimerTask((Runnable) ((NativeJavaObject) args[0]).unwrap()), thisObj)
  }

  private static void logInvalidArgs(String functionName) {
    logger.warn("Called '{}' with incorrect arguments", functionName)
  }
}
