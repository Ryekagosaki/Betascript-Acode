importScripts('lib/Lexer.js');
importScripts('lib/Token.js');
importScripts('lib/Position.js');
importScripts('lib/BetaError.js');
importScripts('lib/Parser.js');
importScripts('lib/AST.js');
importScripts('lib/JavaScriptEmitter.js');
importScripts('lib/SemanticAnalyzer.js');

function compile(source) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  const parser = new Parser(source);
  const ast = parser.parse(tokens);

  const analyzer = new SemanticAnalyzer();
  analyzer.analyze(ast);

  const emitter = new JavaScriptEmitter();
  const code = emitter.emit(ast);

  return { ok: true, code };
}

function run(code) {
  try {
    console.clear();
    console.log('// Starting BetaScript...\n');
    const fn = new Function(code);
    fn();
  } catch (err) {
    console.log(`\nRuntime Error: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
  }
}

self.addEventListener('message', (event) => {
  const { type, source, code } = event.data;

  if (type === 'compile') {
    try {
      const result = compile(source);
      self.postMessage({ type: 'compiled', code: result.code });
    } catch (err) {
      const message = err.message ? err.message.replace(/\[.*?\]\s*$/g, '').trim() : 'Unknown error';
      self.postMessage({ type: 'error', message });
    }
  } else if (type === 'run') {
    try {
      run(code);
    } catch (err) {
      console.log(`Worker error: ${err.message}`);
    }
  } else if (type === 'compileAndRun') {
    try {
      const result = compile(source);
      run(result.code);
    } catch (err) {
      const message = err.message ? err.message.replace(/\[.*?\]\s*$/g, '').trim() : 'Unknown error';
      console.log(`\nCompile Error: ${message}`);
    }
  }
});
