
let serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

function renderToString(app: Application, componentName: string) {
  let document = new SimpleDOM.Document();
  let div = document.createElement('div');
  app.renderComponentToString(componentName, div);
  return serializer.serializeChildren(div);
}
