import { Option, Dict, Opaque, Maybe, ProgramSymbolTable, VMHandle, Recast } from '@glimmer/interfaces';
import { ComponentDefinition, ComponentFactory } from '@glimmer/component';
import { expect, unwrap } from '@glimmer/util';
import { Owner } from '@glimmer/di';
import Component, { ComponentManager } from '@glimmer/component';
import { TypedRegistry } from '../../utils/typed-registry';
import { Invocation, ModifierManager, Helper } from '@glimmer/runtime';
import { Specifier, LookupType, GlimmerResolver } from '../interfaces';

export default class RuntimeResolver implements GlimmerResolver {
  constructor(
    private specifierMap: Dict<number>,
    private symbolTables: Dict<ProgramSymbolTable>,
    private externalModuleTable: Opaque[],
    private owner: Owner
  ) {}

  private cache = {
    component: new TypedRegistry<ComponentDefinition>(),
    helper: new TypedRegistry<Helper>(),
    manager: new TypedRegistry<ComponentManager>(),
    modifier: new TypedRegistry<ModifierManager>()
  };

  private identifyComponent(name: string, meta: Specifier): Maybe<string> {
    let owner: Owner = this.owner;
    let relSpecifier = `template:${name}`;
    let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, referrer);

    if (specifier === undefined && owner.identify(`component:${name}`, referrer)) {
      throw new Error(`The component '${name}' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.`);
    }

    return specifier;
  }

  compileTemplate(name: string): Invocation {
    let specifier = this.owner.identify(`template:${name}`);
    return this.getInvocation({ specifier });
  }

  lookup(type: LookupType, name: string, referrer?: Specifier): Option<number> {
    if (this.cache[type].hasName(name)) {
      return this.cache[type].getHandle(name);
    } else {
      return null;
    }
  }

  lookupComponent(name: string, meta: Specifier): ComponentDefinition {
    let handle: number;
    if (!this.cache.component.hasName(name)) {
      let specifier = unwrap(this.identifyComponent(name, meta));

      let componentSpecifier = this.owner.identify('component', specifier);
      let componentFactory: ComponentFactory = null;

      if (componentSpecifier !== undefined) {
        componentFactory = this.owner.factoryFor(componentSpecifier);
      } else {
        componentFactory = {
          create(injections) {
            return Component.create(injections);
          }
        };
      }

      handle = this.specifierMap[specifier];
    } else {
      handle = this.lookup('component', name, meta);
    }

    let ComponentClass = this.resolve<ComponentFactory>(handle);
    let manager = this.owner.lookup('component-manager:/my-app/component-managers/main');
    return new ComponentDefinition(name, manager, ComponentClass, null);
  }

  getInvocation(meta: Specifier): Invocation {
    let handle = this.specifierMap[meta.specifier] as Recast<number, VMHandle>;
    let symbolTable = expect(this.symbolTables[meta.specifier], `Should have a handle for a symbol table`);
    return { symbolTable, handle };
  }

  lookupPartial(): never {
    throw new Error('Partials are not implimented in Glimmer.js');
  }

  resolve<U>(specifier: number): U {
    return this.externalModuleTable[specifier] as U;
  }

}
