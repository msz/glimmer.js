import { ModifierManager, Invocation, Helper } from "@glimmer/runtime";
import { ComponentDefinition, ComponentManager, RuntimeResolver } from "@glimmer/interfaces";
import { SerializedTemplateWithLazyBlock } from "@glimmer/wire-format";
import { TemplateOptions } from "@glimmer/opcode-compiler";

export type LookupType = keyof Lookup;

export interface Specifier {
  specifier: string;
  managerId?: string;
};

export interface Lookup {
  helper: Helper;
  modifier: ModifierManager;
  component: ComponentDefinition;
  manager: ComponentManager;
  compiledTemplate: Invocation;
  template?: SerializedTemplateWithLazyBlock<Specifier>;
}

export interface GlimmerResolver extends RuntimeResolver<Specifier> {
  lookupHelper?(name: string, referrer: Specifier): number;
  lookupModifier?(name: string, referrer: Specifier): number;
  lookupComponentHandle?(name: string, referrer: Specifier): number;
  setCompileOptions?(options: TemplateOptions<Specifier>): void;
}
