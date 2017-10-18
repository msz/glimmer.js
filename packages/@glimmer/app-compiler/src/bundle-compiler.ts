import { BundleCompiler, BundleCompilerOptions } from '@glimmer/bundle-compiler';
import { ModuleUnificationCompilerDelegate, BundleCompilerDelegate } from '@glimmer/compiler-delegates';
/* tslint:disable */
export const BroccoliPlugin: BroccoliPlugin.Static = require("broccoli-plugin");
/* tslint:enable */
import walkSync from 'walk-sync';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export namespace BroccoliPlugin {
  export interface PluginOptions {
    name?: string;
    annotation?: string;
    persistentOutput?: boolean;
  }

  export interface Plugin {
    inputPaths: string[];
    outputPath: string;
    cachePath: string;
  }

  export interface Static {
    new (inputNodes: any[], options?: any): Plugin;
  }
}

export interface OutputFiles {
  dataSegment: string;
  programFile: string;
}

export type CompilerMode = 'module-unification' | 'basic';

export interface GlimmerBundleCompilerOptions {
  bundleCompiler: BundleCompilerOptions;
  outputFiles: OutputFiles;
  delegate?: BundleCompilerDelegate;
  mode?: CompilerMode;
}

export default class GlimmerBundleCompiler extends BroccoliPlugin {
  options: GlimmerBundleCompilerOptions;
  compiler: BundleCompiler;
  private delegate: ModuleUnificationCompilerDelegate;
  constructor(inputNode, options) {
    super([inputNode], { persistentOutput: true }); // TODO: enable persistent output
    this.options = options;

    if (!options.mode && !options.delegate) {
      throw new Error('Must pass a bundle compiler mode or pass a custom compiler delegate.');
    }

    let delegate;
    if (options.mode && options.mode === 'module-unification') {
      delegate = this.delegate = new ModuleUnificationCompilerDelegate(options.projectPath);
    } else if (options.delegate) {
      delegate = this.delegate = new options.delegate(options.projectPath);
    }

    this.compiler = new BundleCompiler(delegate, options.bundleCompiler = {});
  }

  listEntries() {
    let [srcPath] = this.inputPaths;
    return walkSync.entries(srcPath).filter(entry => !entry.isDirectory());
  }

  _readFile(file) {
    return readFileSync(join(this.inputPaths[0], file), 'UTF-8');
  }

  build() {
    let [ srcPath ] = this.inputPaths;

    this.listEntries().forEach(entries => {
      let { relativePath } = entries;
      let content = this._readFile(relativePath);
      let normalizedPath = this.delegate.normalizePath(join(srcPath, relativePath));
      let specifier = this.delegate.specifierFor(normalizedPath);
      this.compiler.add(specifier, content);
    });

    let { heap, pool } = this.compiler.compile();
    let map = this.compiler.getSpecifierMap();
    let { compiledBlocks } = this.compiler;
    let dataSegment = this.delegate.generateDataSegment(map, pool, heap.table, heap.handle, compiledBlocks);

    let { outputFiles } = this.options;

    writeFileSync(outputFiles.dataSegment, dataSegment);
    writeFileSync(outputFiles.programFile, heap.buffer);
  }
}
