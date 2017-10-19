import { module, test } from 'qunitjs';
import { GlimmerBundleCompiler } from '@glimmer/app-compiler';
import { createTempDir, buildOutput } from 'broccoli-test-helper';
import co from 'co';

module('Broccol Glimmer Bundle Compiler', function(hooks) {
  let input = null;

  hooks.beforeEach(() => createTempDir().then(tempDir => (input = tempDir)));

  hooks.afterEach(() => {
    input.dispose();
  });

  test('requires a mode or delegate', function (assert) {
    assert.throws(() => {
      new GlimmerBundleCompiler(input.path(), { projectPath: 'src' });
    }, /Must pass a bundle compiler mode or pass a custom compiler delegate\./);
  });

  test('requires a project path', function (assert) {
    assert.throws(() => {
      new GlimmerBundleCompiler(input.path(), {
        mode: 'module-unification'
      });
    }, /Must supply a projectPath/);
  });

  test('[MU] compiles the gbx and data segment', co.wrap(function *(assert) {
    input.write({
      'my-app': {
        'package.json': JSON.stringify({name: 'my-app'}),
        src: {
          ui: {
            components: {
              A: {
                'template.hbs': '<div>Hello</div>'
              },

              B: {
                'template.hbs': 'From B: <A @foo={{bar}} /> {{@bar}}'
              },

              C: {
                'template.hbs': 'From C'
              },

              D: {
                'template.hbs': '{{component C}}'
              }
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      projectPath: 'my-app',
      mode: 'module-unification'
    });

    let output = yield buildOutput(compiler);
    let files = output.read();

    assert.ok(files['templates.gbx']);
    assert.ok(files['data-segment.js']);
  }));
});
