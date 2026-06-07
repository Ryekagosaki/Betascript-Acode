importScripts('compiler.bundle.js');

function compile(source) {
  if (!self.BetaScriptCompiler || typeof self.BetaScriptCompiler.compile !== 'function') {
    throw new Error('Compiler BetaScript belum bisa dimuat.');
  }

  const code = self.BetaScriptCompiler.compile(source);

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
      self.postMessage({ type: 'compiled', payload: { code: result.code } });
    } catch (err) {
      const message = err.message ? err.message.replace(/\[.*?\]\s*$/g, '').trim() : 'Unknown error';
      self.postMessage({ type: 'error', payload: { message } });
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
