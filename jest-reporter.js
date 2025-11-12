// Minimal Jest reporter to avoid strip-ansi issues
class SimpleReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunStart(results, options) {
    console.log('\nRunning tests...\n');
  }

  onTestResult(test, testResult, aggregatedResult) {
    const { testResults } = testResult;
    testResults.forEach((result) => {
      if (result.status === 'passed') {
        process.stdout.write('.');
      } else if (result.status === 'failed') {
        process.stdout.write('F');
      } else {
        process.stdout.write('S');
      }
    });
  }

  onRunComplete(contexts, results) {
    console.log('\n');
    console.log(`Tests: ${results.numPassedTests} passed, ${results.numFailedTests} failed, ${results.numTotalTests} total`);
    if (results.numFailedTests > 0) {
      console.log('\nFailed tests:');
      results.testResults.forEach((suite) => {
        suite.testResults.forEach((test) => {
          if (test.status === 'failed') {
            console.log(`  - ${suite.testFilePath}: ${test.fullName}`);
            console.log(`    ${test.failureMessages.join('\n    ')}`);
          }
        });
      });
    }
  }
}

module.exports = SimpleReporter;

