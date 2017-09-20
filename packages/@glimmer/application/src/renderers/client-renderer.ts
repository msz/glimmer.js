import Renderer, { Cursor } from '../renderer';
import mainTemplate from '../templates/main';
import { templateFactory, ElementBuilder, clientBuilder, TemplateIterator } from '@glimmer/runtime';
import { UpdatableReference } from '@glimmer/object-reference';
import DynamicScope from '../dynamic-scope';
import Environment from '../environment';

export class ClientRenderer extends Renderer {
  layoutBuilder(cursor: Cursor): ElementBuilder {
    return clientBuilder(this.env, cursor);
  }

  constructor(env: Environment) {
    super();
    this.env = env;
  }

  mainLayout(context: Object, cursor: Cursor): TemplateIterator {
    let { env } = this;
    let builder = this.layoutBuilder(cursor);
    let template = templateFactory(mainTemplate).create(this.env.compileOptions);

    // Create the template context for the root `main` template, which just
    // contains the array of component roots. Any property references in that
    // template will be looked up from this object.
    let self = new UpdatableReference(context);

    // Create an empty root scope.
    let dynamicScope = new DynamicScope();

    return template.asLayout({
      env,
      self,
      dynamicScope,
      builder
    })
  }

}
