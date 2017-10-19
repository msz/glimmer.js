import { BundleCompiler, BundleCompilerOptions } from '@glimmer/bundle-compiler';
import { ModuleUnificationCompilerDelegate, BundleCompilerDelegate } from '@glimmer/compiler-delegates';
/* tslint:disable */
export const BroccoliPlugin: BroccoliPlugin.Static = require("broccoli-plugin");
/* tslint:enable */
import walkSync from 'walk-sync';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { Option } from '@glimmer/interfaces';

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
  dataSegment: Option<string>;
  heapFile: Option<string>;
}

export type CompilerMode = 'module-unification' | 'basic';

export interface BundleCompilerDelegateConstructor {
  new(): BundleCompilerDelegate;
}

export interface GlimmerBundleCompilerOptions {
  projectPath: string;
  bundleCompiler: BundleCompilerOptions;
  outputFiles?: OutputFiles;
  delegate?: BundleCompilerDelegateConstructor;
  mode?: CompilerMode;
}

export default class GlimmerBundleCompiler extends BroccoliPlugin {
  options: GlimmerBundleCompilerOptions;
  compiler: BundleCompiler;
  private delegate: BundleCompilerDelegate;
  constructor(inputNode, options) {
    super([inputNode], { persistentOutput: true }); // TODO: enable persistent output
    this.options = this.defaultOptions(options);
  }

  private defaultOptions(options: GlimmerBundleCompilerOptions) {
    if (!options.projectPath) {
      throw new Error('Must supply a projectPath');
    }

    if (!options.mode && !options.delegate) {
      throw new Error('Must pass a bundle compiler mode or pass a custom compiler delegate.');
    }

    return Object.assign({
      outputFiles: {
        heapFile: 'src/templates.gbx',
        dataSegment: 'src/data-segment.js'
      }
    }, options);
  }

  listEntries() {
    let [srcPath] = this.inputPaths;
    return walkSync.entries(srcPath);
  }

  _readFile(file) {
    return readFileSync(join(this.inputPaths[0], file), 'UTF-8');
  }

  createBundleCompiler() {
    let delegate;
    let { options } = this;
    let [inputPath] = this.inputPaths;
    if (options.mode && options.mode === 'module-unification') {
      delegate = this.delegate = new ModuleUnificationCompilerDelegate(join(inputPath, options.projectPath));
    } else if (options.delegate) {
      delegate = this.delegate = new options.delegate();
    }

    this.compiler = new BundleCompiler(delegate, options.bundleCompiler = {});
  }

  build() {
    if (!this.compiler && !this.delegate) {
      this.createBundleCompiler();
    }

    let [ srcPath ] = this.inputPaths;
    let { outputPath } = this;

    this.listEntries().forEach(entry => {
      let { relativePath } = entry;
      if (entry.isDirectory()) {
        mkdirSync(join(outputPath, relativePath));
      } else {
        let content = this._readFile(relativePath);
        if (extname(relativePath) === '.hbs') {
          let normalizedPath = this.delegate.normalizePath(join(srcPath, relativePath));
          let specifier = this.delegate.specifierFor(normalizedPath);
          this.compiler.add(specifier, content);
        } else {
          writeFileSync(join(outputPath, relativePath), content);
        }
      }
    });

    let { heap, pool } = this.compiler.compile();
    let map = this.compiler.getSpecifierMap();
    let { compiledBlocks } = this.compiler;
    let dataSegment = this.delegate.generateDataSegment(map, pool, heap.table, heap.handle, compiledBlocks);

    let { outputFiles, projectPath } = this.options;

    writeFileSync(join(join(outputPath, projectPath), outputFiles.dataSegment), dataSegment);
    writeFileSync(join(join(outputPath, projectPath), outputFiles.heapFile), new Buffer(heap.buffer));
  }
}
