import { BundleCompiler, BundleCompilerOptions, specifierFor } from '@glimmer/bundle-compiler';
import { ModuleUnificationCompilerDelegate, BundleCompilerDelegate } from '@glimmer/compiler-delegates';
import Plugin from 'broccoli-plugin';
import walkSync from 'walk-sync';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { Option } from '@glimmer/interfaces';
import { mainLayout } from '@glimmer/application';
import { CompilableTemplate } from '@glimmer/opcode-compiler';

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

export default class GlimmerBundleCompiler extends Plugin {
  options: GlimmerBundleCompilerOptions;
  inputPaths: string[];
  outputPath: string;
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
    if (options.mode && options.mode === 'module-unification') {
      delegate = this.delegate = new ModuleUnificationCompilerDelegate(options.projectPath);
    } else if (options.delegate) {
      delegate = this.delegate = new options.delegate();
    }

    this.compiler = new BundleCompiler(delegate, options.bundleCompiler = {});
  }

  build() {
    if (!this.compiler && !this.delegate) {
      this.createBundleCompiler();
    }

    let { outputPath } = this;

    let specifier = specifierFor('__BUILTIN__', 'default');
    let compilable = CompilableTemplate.topLevel(JSON.parse(mainLayout.block), this.compiler.compileOptions(specifier));

    this.compiler.addCustom(specifier, compilable);

    this.listEntries().forEach(entry => {
      let { relativePath } = entry;
      if (entry.isDirectory()) {
        mkdirSync(join(outputPath, relativePath));
      } else {
        let content = this._readFile(relativePath);
        if (extname(relativePath) === '.hbs') {
          let normalizedPath = this.delegate.normalizePath(relativePath);
          let specifier = this.delegate.specifierFor(normalizedPath);
          this.compiler.add(specifier, content);
        }
        writeFileSync(join(outputPath, relativePath), content);

      }
    });

    let { heap, pool } = this.compiler.compile();
    let map = this.compiler.getSpecifierMap();
    let { compiledBlocks } = this.compiler;
    let dataSegment = this.delegate.generateDataSegment(map, pool, heap.table, heap.handle, compiledBlocks);

    let { outputFiles } = this.options;

    writeFileSync(join(outputPath, outputFiles.dataSegment), dataSegment);
    writeFileSync(join(outputPath, outputFiles.heapFile), new Buffer(heap.buffer));
  }
}