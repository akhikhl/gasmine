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
      
      def result = gino.Runner.run("gasmine/testRunner.js", [ scriptDirectory ] as Object[], classLoader, logger)
    
      if(result != 0)
        // assuming that test reporting tool already explained the reason of failure.
        throw new GradleException("Build interrupted because of test errors");
    }
  }
}
