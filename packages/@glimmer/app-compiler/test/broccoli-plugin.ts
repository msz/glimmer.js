import { module, test } from 'qunitjs';
import { GlimmerBundleCompiler } from '../';
import { createTempDir, buildOutput } from 'broccoli-test-helper';
import co from 'co';

module('Broccol Glimmer Bundle Compiler', function(hooks) {
  let input = null;

  hooks.beforeEach(() => createTempDir().then(tempDir => (input = tempDir)));

  hooks.afterEach(() => {
    input.dispose();
  });

  test('it compiles', co.wrap(function *(assert) {
    let compiler = new GlimmerBundleCompiler(input.path(), {

    });

    console.log(compiler);
    let output = yield buildOutput(compiler);

    assert.ok(output);
  }));
});


