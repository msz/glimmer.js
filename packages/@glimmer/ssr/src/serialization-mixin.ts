import { serializeBuilder } from '@glimmer/node';
function mixinSerialization(App: Application) {
  return class extends App {
    layoutBuilder() {
      return serializeBuilder(this.env, cursor);
    }
  };
}
