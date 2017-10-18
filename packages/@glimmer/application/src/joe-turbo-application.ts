import Application, { ApplicationOptions } from './application';
import { TemplateIterator, LowLevelVM, clientBuilder } from '@glimmer/runtime';
import { RuntimeProgram, RuntimeConstants, ConstantPool, Heap } from '@glimmer/program';
import { SymbolTable, Dict, VMHandle } from '@glimmer/interfaces';
import DynamicScope from './dynamic-scope';
import { UpdatableReference } from '@glimmer/object-reference';

export interface DataSegment {
  moduleTable: Function[];
  heapTable: number[];
  pool: ConstantPool;
  specifierMap: Dict<VMHandle>;
  symbolTables: Dict<SymbolTable>;
  nextFreeHandle: number;
}

export interface JoeTurboOptions extends ApplicationOptions {
  templates: () => Promise<ArrayBuffer>;
  dataSegment: DataSegment;
}

/*
import * as dataSegment from './data-segment';
import { JoeTurboApplication } from '@glimmer/application';
import resolverConfiguration from '../config/resolver-configuration';
import moduleMap from '../config/module-map';

let app = new JoeTurboApplication({
  rootName: 'my-app',
  resolver: new Resolver(resolverConfiguration, moduleRegistry),
  dataSegment,
  templates: async function() {
    let req = await fetch('/templates.gbx', { credentials: true });
    return await req.arrayBuffer();
  }
});

app.renderComponent('MyApp', document.body);
app.boot();
*/

export default class JoeTurboApplication extends Application {
  gbx: Promise<ArrayBuffer>;
  programBuffer: ArrayBuffer;
  dataSegment: DataSegment;
  constructor(options: JoeTurboOptions) {
    super(options);
    this.dataSegment = options.dataSegment;
    // Start fetching as soon as we create the app
    this.gbx = options.templates();
  }

  protected get templateIterator(): TemplateIterator {
    let { env } = this;

    // Create the template context for the root `main` template, which just
    // contains the array of component roots. Any property references in that
    // template will be looked up from this object.
    let self = new UpdatableReference({ roots: this._roots });

    // Create an empty root scope.
    let dynamicScope = new DynamicScope();

    // The cursor tells the template which element to render into.
    let cursor = {
      element: (this.document as Document).body,
      nextSibling: null
    };

    let { pool, heapTable, nextFreeHandle, specifierMap, symbolTables } = this.dataSegment;
    let { programBuffer } = this;
    let runtimeHeap = new Heap({
      buffer: programBuffer,
      table: heapTable,
      handle: nextFreeHandle
    });
    let resolver;
    let runtimeProgram = new RuntimeProgram(new RuntimeConstants(resolver, pool), runtimeHeap);
    let handle = specifierMap['ui/components/main'];
    let vm = LowLevelVM.initial(runtimeProgram, env, self, null, dynamicScope, clientBuilder(env, cursor), handle);

    return new TemplateIterator(vm);
  }

  boot() {
    this.initialize();
    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    this.gbx.then(arrayBuffer => {
      this.programBuffer = arrayBuffer;
      this._render();
    }).catch((e) => { throw new Error(e); });
  }
}
