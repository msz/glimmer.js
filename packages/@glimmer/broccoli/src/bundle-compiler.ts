import { BundleCompiler, BundleCompilerOptions } from '@glimmer/bundle-compiler';
import { ModuleUnificationCompilerDelegate } from '@glimmer/compiler-delegates';
/* tslint:disable */
export const BroccoliPlugin: BroccoliPlugin.Static = require("broccoli-plugin");
/* tslint:enable */
import walkSync from 'walk-sync';
import FSTree from 'fs-tree-diff';
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

export interface GlimmerBundleCompilerOptions {
  bundleCompiler: BundleCompilerOptions;
  outputFiles: OutputFiles;
}

export default class GlimmerBundleCompiler extends BroccoliPlugin {
  options: GlimmerBundleCompilerOptions;
  compiler: BundleCompiler;
  private delegate: ModuleUnificationCompilerDelegate;
  private lastTree: Array<Object>;
  constructor(inputNode, options) {
    super([inputNode], { persistentOutput: true }); // TODO: enable persistent output
    this.options = options;
    let delegate = this.delegate = new ModuleUnificationCompilerDelegate(options.projectPath);
    this.compiler = new BundleCompiler(delegate, options.bundleCompiler = {});
    this.lastTree = FSTree.fromEntries([]);
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
    let dataSegment = this.delegate.generateDataSegment(map, pool, heap.table, compiledBlocks);

    let { outputFiles } = this.options;

    writeFileSync(outputFiles.dataSegment, dataSegment);
    writeFileSync(outputFiles.programFile, heap.buffer);
  }
}
