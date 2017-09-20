import { serializeBuilder } from '@glimmer/node';
import { Renderer } from '@glimmer/application';
import { ElementBuilder, TemplateIterator, templateFactory, RenderLayoutOptions } from '@glimmer/runtime';
import mainTemplate from './templates/main';

export class SerializationRenderer extends Renderer {
  layoutBuilder(cursor: { element: Element; nextSibling: Node; }): ElementBuilder {
    return serializeBuilder(this.env, cursor);
  }

  mainLayout(options: RenderLayoutOptions): TemplateIterator {
    let template = templateFactory(mainTemplate).create(this.env.compileOptions);
    return template.renderLayout(options);
  }
}
