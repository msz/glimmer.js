import Application from "@glimmer/application";
import { SerializationRenderer } from './serialization-renderer';
import * as SimpleDOM from 'simple-dom';

export function renderComponent(app: Application, componentName: string) {
  app.registerInitializer({
    initialize(registry) {
      registry.register(`renderer:/${app.rootName}/main/main`, SerializationRenderer);
    }
  });

  app.initialize();
  let serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

  return (context?: Object) => {
    app.renderComponentSSR(componentName, context);
    return serializer.serializeChildren(app.document.body);
  };
}
