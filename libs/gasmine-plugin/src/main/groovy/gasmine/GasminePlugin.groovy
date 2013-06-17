package gasmine

import org.gradle.api.*
import org.gradle.api.plugins.*
import org.gradle.api.tasks.*

class GasminePlugin implements Plugin<Project> {

  void apply(final Project project) {

    project.dependencies {
      testCompile "ch.qos.logback:logback-classic:1.0.6"
      testCompile "junit:junit:4.10"
    }

    project.task("testScripts") { task ->
      doLast {
        File scriptDirectory = project.file("src/test/resources")

        def urls = [
          new File(project.buildDir, "classes/main").toURI().toURL(),
          new File(project.buildDir, "classes/test").toURI().toURL(),
          new File(project.buildDir, "resources/main").toURI().toURL(),
          new File(project.buildDir, "resources/test").toURI().toURL()
        ]
        urls += project.configurations["runtime"].collect { dep -> dep.toURI().toURL() }
        URLClassLoader classLoader = new URLClassLoader(urls as URL[], GasminePlugin.class.classLoader)

        def result = gino.Runner.run("gasmine/testRunner.js", [scriptDirectory ] as Object[], classLoader, logger, true, project.projectDir.absolutePath)

        if(result != 0)
        // assuming that test reporting tool already explained the reason of failure.
        throw new GradleException("Build interrupted because of test errors")
      }

      task.dependsOn project.tasks.test
      project.tasks.check.dependsOn task
    }
  }
}
