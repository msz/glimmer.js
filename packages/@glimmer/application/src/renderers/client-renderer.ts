import Renderer, { Cursor } from '../renderer';
import mainTemplate from '../templates/main';
import { templateFactory, ElementBuilder, clientBuilder, TemplateIterator, RenderLayoutOptions } from '@glimmer/runtime';

export class ClientRenderer extends Renderer {
  layoutBuilder(cursor: Cursor): ElementBuilder {
    return clientBuilder(this.env, cursor);
  }

  mainLayout(options: RenderLayoutOptions): TemplateIterator {
    let template = templateFactory(mainTemplate).create(this.env.compileOptions);
    return template.renderLayout(options);
  }
}
