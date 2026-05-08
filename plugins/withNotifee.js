const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Adds the notifee local Maven repo into allprojects.repositories in build.gradle
 * so Gradle can resolve app.notifee:core, bundled in the package's android/libs.
 */
module.exports = function withNotifee(config) {
  return withProjectBuildGradle(config, (mod) => {
    const tag = "// notifee-maven";
    if (mod.modResults.contents.includes(tag)) return mod;

    mod.modResults.contents = mod.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      `allprojects {\n  repositories {\n    ${tag}\n    maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`
    );

    return mod;
  });
};
