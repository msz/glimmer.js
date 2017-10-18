import { RuntimeResolver as IRuntimeResolver } from "@glimmer/interfaces";
import { TypedRegistry } from "./typed-registry";
import { ModifierManager, Invocation, Helper } from '@glimmer/runtime';

export interface Specifier {
  specifier: string;
  managerId?: string;
};

export class RuntimeResolver {
  private cache = {
    component: new TypedRegistry<ComponentDefinition>(),
    template: new TypedRegistry<SerializedTemplateWithLazyBlock<Specifier>>(),
    compiledTemplate: new TypedRegistry<Invocation>(),
    helper: new TypedRegistry<Helper>(),
    manager: new TypedRegistry<ComponentManager>(),
    modifier: new TypedRegistry<ModifierManager>()
  };

}
