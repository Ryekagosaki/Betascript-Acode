var BetaScriptCompiler = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../../tmp/kilo/betascript-compiler-entry.ts
  var betascript_compiler_entry_exports = {};
  __export(betascript_compiler_entry_exports, {
    compile: () => compile,
    version: () => version
  });

  // src/utils/Position.ts
  var Position = class _Position {
    constructor(line = 1, column = 1) {
      __publicField(this, "line", line);
      __publicField(this, "column", column);
    }
    advance() {
      return new _Position(this.line, this.column + 1);
    }
    newline() {
      return new _Position(this.line + 1, 1);
    }
    offset(n) {
      return new _Position(this.line, this.column + n);
    }
  };

  // src/utils/BetaError.ts
  var BetaError = class _BetaError extends Error {
    constructor(message, position, filename) {
      super(`${filename ?? position.filename ?? "unknown"}:${position.line}:${position.column}: ${message}`);
      __publicField(this, "message", message);
      __publicField(this, "position", position);
      __publicField(this, "filename", filename);
      this.name = "BetaError";
    }
    static unexpectedToken(token, position, filename) {
      return new _BetaError(`Unexpected token: '${token}'`, position, filename);
    }
    static expected(identifier, position, filename) {
      return new _BetaError(`Expected ${identifier}`, position, filename);
    }
    static undefinedVariable(name, position, filename) {
      return new _BetaError(`Undefined variable: '${name}'`, position, filename);
    }
    static syntaxError(message, position, filename) {
      return new _BetaError(`Syntax error: ${message}`, position, filename);
    }
  };

  // src/lexer/Lexer.ts
  var Lexer = class {
    constructor(source) {
      __publicField(this, "source", source);
      __publicField(this, "position", new Position());
      __publicField(this, "tokens", []);
      __publicField(this, "start", 0);
    }
    tokenize() {
      this.tokens = [];
      this.position = new Position();
      this.start = 0;
      while (this.start < this.source.length) {
        this.skipWhitespace();
        if (this.start >= this.source.length) {
          break;
        }
        this.scanToken();
      }
      this.tokens.push({ type: "EOF" /* EOF */, value: "EOF", position: this.position });
      return this.tokens;
    }
    skipWhitespace() {
      while (this.start < this.source.length) {
        const char = this.source[this.start];
        if (char === " " || char === "	" || char === "\r") {
          this.start++;
          this.position = this.position.advance();
        } else if (char === "\n") {
          this.start++;
          this.position = this.position.newline();
        } else if (char === "/" && this.source[this.start + 1] === "/") {
          this.start += 2;
          while (this.start < this.source.length && this.source[this.start] !== "\n") {
            this.start++;
            this.position = this.position.advance();
          }
        } else if (char === "/" && this.source[this.start + 1] === "*") {
          this.start += 2;
          this.position = this.position.advance();
          this.position = this.position.advance();
          while (this.start < this.source.length && !(this.source[this.start] === "*" && this.source[this.start + 1] === "/")) {
            if (this.source[this.start] === "\n") this.position = this.position.newline();
            this.start++;
            this.position = this.position.advance();
          }
          this.start += 2;
        } else {
          break;
        }
      }
    }
    addToken(type, value) {
      this.tokens.push({ type, value: value ?? "", position: this.position });
    }
    scanToken() {
      const char = this.source[this.start++];
      this.position = this.position.advance();
      switch (char) {
        case "+":
          if (this.source[this.start] === "+") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("++" /* INCREMENT */, "++");
          } else if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("+=" /* PLUS_ASSIGN */, "+=");
          } else {
            this.addToken("+" /* PLUS */, "+");
          }
          break;
        case "-":
          if (this.source[this.start] === "-") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("--" /* DECREMENT */, "--");
          } else if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("-=" /* MINUS_ASSIGN */, "-=");
          } else {
            this.addToken("-" /* MINUS */, "-");
          }
          break;
        case "*":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("*=" /* TIMES_ASSIGN */, "*=");
          } else if (this.source[this.start] === "*") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("**" /* POWER */, "**");
          } else {
            this.addToken("*" /* TIMES */, "*");
          }
          break;
        case "/":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("/=" /* DIVIDE_ASSIGN */, "/=");
          } else if (this.canStartRegex() && this.source[this.start] !== " " && this.source[this.start] !== "\n") {
            this.scanRegex();
          } else {
            this.addToken("/" /* DIVIDE */, "/");
          }
          break;
        case "%":
          this.addToken("%" /* MODULO */, "%");
          break;
        case "(":
          this.addToken("(" /* LEFT_PAREN */, "(");
          break;
        case ")":
          this.addToken(")" /* RIGHT_PAREN */, ")");
          break;
        case "{":
          this.addToken("{" /* LEFT_BRACE */, "{");
          break;
        case "}":
          this.addToken("}" /* RIGHT_BRACE */, "}");
          break;
        case "[":
          this.addToken("[" /* LEFT_BRACKET */, "[");
          break;
        case "]":
          this.addToken("]" /* RIGHT_BRACKET */, "]");
          break;
        case ";":
          this.addToken(";" /* SEMICOLON */, ";");
          break;
        case ",":
          this.addToken("," /* COMMA */, ",");
          break;
        case ".":
          if (this.source[this.start] === "." && this.source[this.start + 1] === ".") {
            this.start += 2;
            this.position = this.position.advance().advance();
            this.addToken("..." /* SPREAD */, "...");
          } else {
            this.addToken("." /* DOT */, ".");
          }
          break;
        case ":":
          this.addToken(":" /* COLON */, ":");
          break;
        case "?":
          if (this.source[this.start] === "?") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("??" /* NULLISH */, "??");
          } else if (this.source[this.start] === ".") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("?." /* QUESTION_DOT */, "?.");
          } else {
            this.addToken("?" /* QUESTION */, "?");
          }
          break;
        case ">":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken(">=" /* GREATER_EQUAL */, ">=");
          } else {
            this.addToken(">" /* GREATER */, ">");
          }
          break;
        case "<":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("<=" /* LESS_EQUAL */, "<=");
          } else {
            this.addToken("<" /* LESS */, "<");
          }
          break;
        case "!":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            if (this.source[this.start] === "=") {
              this.start++;
              this.position = this.position.advance();
              this.addToken("!==" /* STRICT_NOT_EQUAL */, "!==");
            } else {
              this.addToken("!=" /* NOT_EQUAL */, "!=");
            }
          } else {
            this.addToken("!" /* NOT */, "!");
          }
          break;
        case "=":
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            if (this.source[this.start] === "=") {
              this.start++;
              this.position = this.position.advance();
              this.addToken("===" /* STRICT_EQUAL */, "===");
            } else {
              this.addToken("==" /* EQUAL_EQUAL */, "==");
            }
          } else {
            this.addToken("=" /* EQUAL */, "=");
          }
          break;
        case '"':
          this.scanString('"');
          break;
        case "'":
          this.scanString("'");
          break;
        case "`":
          this.scanTemplate();
          break;
        case "&":
          if (this.source[this.start] === "&") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("&&" /* AND */, "&&");
          }
          break;
        case "|":
          if (this.source[this.start] === "|") {
            this.start++;
            this.position = this.position.advance();
            this.addToken("||" /* OR */, "||");
          }
          break;
        default:
          if (this.isDigit(char)) {
            this.scanNumber();
          } else if (this.isAlpha(char)) {
            this.scanIdentifier();
          } else {
            throw BetaError.syntaxError(`Unexpected character: '${char}'`, this.position);
          }
      }
    }
    scanString(quote) {
      let value = "";
      while (this.start < this.source.length && this.source[this.start] !== quote) {
        if (this.source[this.start] === "\\") {
          this.start++;
          this.position = this.position.advance();
          const escaped = this.source[this.start];
          switch (escaped) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "	";
              break;
            case "r":
              value += "\r";
              break;
            case '"':
              value += '"';
              break;
            case "'":
              value += "'";
              break;
            case "\\":
              value += "\\";
              break;
            default:
              value += escaped;
          }
        } else {
          value += this.source[this.start];
        }
        this.start++;
        this.position = this.position.advance();
      }
      if (this.start >= this.source.length) {
        throw BetaError.syntaxError("Unterminated string", this.position);
      }
      this.start++;
      this.position = this.position.advance();
      this.addToken("STRING" /* STRING */, value);
    }
    scanTemplate() {
      let value = "`";
      while (this.start < this.source.length) {
        const char = this.source[this.start++];
        this.position = char === "\n" ? this.position.newline() : this.position.advance();
        value += char;
        if (char === "`") {
          this.addToken("TEMPLATE" /* TEMPLATE */, value);
          return;
        }
        if (char === "\\" && this.start < this.source.length) {
          const escaped = this.source[this.start++];
          this.position = escaped === "\n" ? this.position.newline() : this.position.advance();
          value += escaped;
        }
      }
      throw BetaError.syntaxError("Unterminated template literal", this.position);
    }
    scanRegex() {
      let value = "/";
      let inClass = false;
      while (this.start < this.source.length) {
        const char = this.source[this.start++];
        this.position = this.position.advance();
        value += char;
        if (char === "\\" && this.start < this.source.length) {
          const escaped = this.source[this.start++];
          this.position = this.position.advance();
          value += escaped;
          continue;
        }
        if (char === "[") inClass = true;
        if (char === "]") inClass = false;
        if (char === "/" && !inClass) {
          while (this.start < this.source.length && /[a-z]/i.test(this.source[this.start])) {
            value += this.source[this.start++];
            this.position = this.position.advance();
          }
          this.addToken("REGEX" /* REGEX */, value);
          return;
        }
        if (char === "\n") {
          throw BetaError.syntaxError("Unterminated regex literal", this.position);
        }
      }
      throw BetaError.syntaxError("Unterminated regex literal", this.position);
    }
    canStartRegex() {
      const previous = this.tokens[this.tokens.length - 1];
      if (!previous) return true;
      return previous.type === "=" /* EQUAL */ || previous.type === "(" /* LEFT_PAREN */ || previous.type === "[" /* LEFT_BRACKET */ || previous.type === "{" /* LEFT_BRACE */ || previous.type === "," /* COMMA */ || previous.type === ":" /* COLON */ || previous.type === "kasoh" /* KASOH */ || previous.type === "lempar" /* LEMPAR */;
    }
    scanNumber() {
      let value = this.source[this.start - 1];
      while (this.start < this.source.length && /[0-9]/.test(this.source[this.start])) {
        value += this.source[this.start];
        this.start++;
        this.position = this.position.advance();
      }
      if (this.start < this.source.length && this.source[this.start] === ".") {
        if (this.start + 1 < this.source.length && /[0-9]/.test(this.source[this.start + 1])) {
          value += ".";
          this.start++;
          this.position = this.position.advance();
          while (this.start < this.source.length && /[0-9]/.test(this.source[this.start])) {
            value += this.source[this.start];
            this.start++;
            this.position = this.position.advance();
          }
        }
      }
      this.addToken("NUMBER" /* NUMBER */, value);
    }
    scanIdentifier() {
      let value = this.source[this.start - 1];
      while (this.start < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.start])) {
        value += this.source[this.start];
        this.start++;
        this.position = this.position.advance();
      }
      const keyword = this.getKeyword(value);
      if (keyword) {
        this.addToken(keyword);
      } else {
        this.addToken("IDENTIFIER" /* IDENTIFIER */, value);
      }
    }
    getKeyword(value) {
      const keywords = {
        ane: "ane" /* ANCE */,
        ente: "ente" /* ENTE */,
        bener: "betoel" /* BETOEL */,
        benar: "betoel" /* BETOEL */,
        betoel: "betoel" /* BETOEL */,
        kaga: "kaga" /* KAGA */,
        kosong: "kosong" /* KOSONG */,
        entah: "entah" /* ENTAH */,
        tetep: "tetep" /* TETEP */,
        tetap: "tetep" /* TETEP */,
        kalo: "kalo" /* KALO */,
        kagaknye: "kagaknye" /* KAGAKNYE */,
        kagaknya: "kagaknye" /* KAGAKNYE */,
        kalo_kagak: "udah_gituh" /* UDAH_GITUH */,
        udah_gituh: "udah_gituh" /* UDAH_GITUH */,
        udahan: "bodo_amat" /* BODO_AMAT */,
        selagi: "selagi" /* SELAGI */,
        selama: "selagi" /* SELAGI */,
        kerjain: "kerjain" /* KERJAIN */,
        itung: "itung" /* ITUNG */,
        saban: "saban" /* SABAN */,
        dah: "dah" /* DAH */,
        keluar: "dah" /* DAH */,
        lanjut: "lanjut" /* LANJUT */,
        lanjut_aja: "lanjut" /* LANJUT */,
        pilih: "pilih" /* PILIH */,
        kalo_gini: "kalo_gini" /* KALO_GINI */,
        kalau_gitu: "kalo_gini" /* KALO_GINI */,
        bodo_amat: "bodo_amat" /* BODO_AMAT */,
        bikin: "bikin" /* BIKIN */,
        nanti: "nanti" /* NANTI */,
        asinkron: "nanti" /* NANTI */,
        kasoh: "kasoh" /* KASOH */,
        balikin: "kasoh" /* KASOH */,
        sabut: "sabut" /* SABUT */,
        panggil: "sabut" /* SABUT */,
        cetak: "cetak" /* CETAK */,
        cetakan: "cetak" /* CETAK */,
        turun: "turun" /* TURUN */,
        warisan: "turun" /* TURUN */,
        ikut: "ikut" /* IKUT */,
        mula: "mula" /* MULA */,
        gua: "gua" /* GUA */,
        ini: "gua" /* GUA */,
        punye: "punye" /* PUNYE */,
        babang: "babang" /* BABANG */,
        atas: "babang" /* BABANG */,
        anyar: "anyar" /* ANYAR */,
        baru: "anyar" /* ANYAR */,
        diem: "diem" /* DIEM */,
        diam: "diem" /* DIEM */,
        statik: "statik" /* STATIK */,
        cobi: "cobi" /* COBA */,
        coba: "cobi" /* COBA */,
        tangkep: "tangkep" /* TANGKEP */,
        akhirnye: "akhirnye" /* AKHIRNYE */,
        lempar: "lempar" /* LEMPAR */,
        ambil: "ambil" /* AMBIL */,
        impor: "ambil" /* AMBIL */,
        ekspor: "kasoh" /* KASOH */,
        dari: "dari" /* DARI */,
        teriak: "teriak" /* TERIAK */,
        bisik: "bisik" /* BISIK */,
        dengerin: "dengerin" /* DENGERIN */,
        sebrapa: "sebrapa" /* SEBRAPA */,
        ape: "ape" /* APE */,
        itungan: "itungan" /* ITUNGAN */,
        omongan: "omongan" /* OMONGAN */,
        kumpulin: "kumpulin" /* KUMPULIN */,
        acak: "acak" /* ACAK */,
        tidur: "tidur" /* TIDUR */,
        angka: "angka" /* ANGKA */,
        kata: "kata" /* KATA */,
        tungguin: "tungguin" /* TUNGGU */,
        tunggu: "tungguin" /* TUNGGU */,
        deret: "deret" /* DERET */,
        antarmuka: "antarmuka" /* ANTARMUKA */
      };
      return keywords[value] ?? null;
    }
    isDigit(char) {
      return /[0-9]/.test(char);
    }
    isAlpha(char) {
      return /[a-zA-Z_]/.test(char);
    }
  };

  // src/parser/Parser.ts
  var Parser = class {
    constructor(source) {
      __publicField(this, "source", source);
      __publicField(this, "tokens", []);
      __publicField(this, "current", 0);
    }
    parse(tokens) {
      this.tokens = tokens;
      this.current = 0;
      const statements = [];
      while (!this.isAtEnd()) {
        statements.push(this.parseStatement());
      }
      return {
        type: "Program",
        body: statements
      };
    }
    isAtEnd() {
      return this.peek().type === "EOF" /* EOF */;
    }
    peek() {
      return this.tokens[this.current];
    }
    previous() {
      return this.tokens[this.current - 1];
    }
    advance() {
      if (!this.isAtEnd()) this.current++;
      return this.previous();
    }
    check(type) {
      if (this.isAtEnd()) return false;
      return this.peek().type === type;
    }
    checkNext(type) {
      if (this.current + 1 >= this.tokens.length) return false;
      return this.tokens[this.current + 1].type === type;
    }
    match(...types) {
      for (const type of types) {
        if (this.check(type)) {
          this.advance();
          return true;
        }
      }
      return false;
    }
    consume(type, message) {
      if (this.check(type)) return this.advance();
      throw BetaError.expected(message, this.peek().position);
    }
    parseStatement() {
      if (this.isStrictModeDirective()) return this.strictModeStatement();
      if (this.match("ambil" /* AMBIL */)) return this.importStatement();
      if (this.match("kasoh" /* KASOH */)) return this.kasohStatement();
      if (this.match("ane" /* ANCE */, "tetep" /* TETEP */)) return this.variableDeclaration();
      const isAsync = this.match("nanti" /* NANTI */);
      if (this.match("bikin" /* BIKIN */)) return this.functionDeclaration(isAsync);
      if (this.match("cetak" /* CETAK */)) return this.classDeclaration();
      if (this.match("antarmuka" /* ANTARMUKA */)) return this.interfaceDeclaration();
      if (this.match("kalo" /* KALO */)) return this.ifStatement();
      if (this.match("selagi" /* SELAGI */)) return this.whileStatement();
      if (this.match("kerjain" /* KERJAIN */)) return this.doWhileStatement();
      if (this.match("itung" /* ITUNG */)) return this.forStatement();
      if (this.match("saban" /* SABAN */)) return this.forEachStatement();
      if (this.match("pilih" /* PILIH */)) return this.switchStatement();
      if (this.match("cobi" /* COBA */)) return this.tryStatement();
      if (this.match("lempar" /* LEMPAR */)) return this.throwStatement();
      if (this.match("dah" /* DAH */)) return this.breakStatement();
      if (this.match("lanjut" /* LANJUT */)) return this.continueStatement();
      if (this.match("{" /* LEFT_BRACE */)) return this.parseBlockBody();
      if (this.match(";" /* SEMICOLON */)) {
        return {
          type: "EmptyStatement",
          position: this.previous().position
        };
      }
      return this.expressionStatement();
    }
    isStrictModeDirective() {
      return this.check("IDENTIFIER" /* IDENTIFIER */) && this.peek().value === "mode" && this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === "IDENTIFIER" /* IDENTIFIER */ && this.tokens[this.current + 1].value === "ketat";
    }
    strictModeStatement() {
      const token = this.advance();
      this.advance();
      this.match(";" /* SEMICOLON */);
      return { type: "EmptyStatement", position: token.position };
    }
    kasohStatement() {
      if (this.check("bikin" /* BIKIN */) || this.check("cetak" /* CETAK */) || this.check("ane" /* ANCE */) || this.check("tetep" /* TETEP */)) {
        return this.exportStatement();
      }
      return this.returnStatement();
    }
    variableDeclaration() {
      const token = this.previous();
      const kind = token.type === "ane" /* ANCE */ ? "ane" : "tetep";
      const name = this.bindingPattern();
      let typeAnnotation;
      if (this.match(":" /* COLON */)) {
        const typeToken = this.advance();
        typeAnnotation = this.getTypeAnnotation(typeToken);
      }
      let initializer = null;
      if (this.match("=" /* EQUAL */)) {
        initializer = this.assignment();
      } else if (this.match("+=" /* PLUS_ASSIGN */, "-=" /* MINUS_ASSIGN */, "*=" /* TIMES_ASSIGN */, "/=" /* DIVIDE_ASSIGN */)) {
        const op = this.previous().value;
        const right = this.assignment();
        initializer = {
          type: "BinaryExpression",
          operator: op.slice(0, -1),
          left: { type: "Identifier", name, position: this.peek().position },
          right,
          position: this.peek().position
        };
      }
      this.match(";" /* SEMICOLON */);
      return {
        type: "VariableDeclaration",
        kind,
        name,
        typeAnnotation,
        initializer,
        position: token.position
      };
    }
    functionDeclaration(isAsync = false) {
      const token = this.previous();
      const name = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected function name").value;
      this.skipGenericParameters();
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after function name");
      const parameters = this.parameters();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
      let returnType;
      if (this.match(":" /* COLON */)) {
        const typeToken = this.advance();
        returnType = this.getTypeAnnotation(typeToken);
      }
      this.consume("{" /* LEFT_BRACE */, "Expected '{' before function body");
      const body = this.parseBlockBody();
      return {
        type: "FunctionDeclaration",
        name,
        parameters,
        body,
        isAsync,
        isExported: false,
        position: token.position
      };
    }
    parameters() {
      const params = [];
      if (!this.check(")" /* RIGHT_PAREN */)) {
        do {
          const ente = this.match("ente" /* ENTE */);
          const isRest = this.match("..." /* SPREAD */);
          const name = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected parameter name").value;
          let paramType;
          if (this.match(":" /* COLON */)) {
            const typeToken = this.advance();
            paramType = this.getTypeAnnotation(typeToken);
          }
          params.push({
            name,
            type: paramType,
            isRest,
            position: this.peek().position
          });
        } while (this.match("," /* COMMA */));
      }
      return params;
    }
    classDeclaration() {
      const name = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected class name").value;
      let superclass;
      if (this.match("turun" /* TURUN */)) {
        superclass = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected superclass name").value;
      }
      const interfaces = [];
      if (this.match("ikut" /* IKUT */)) {
        do {
          interfaces.push(this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected interface name").value);
        } while (this.match("," /* COMMA */));
      }
      this.consume("{" /* LEFT_BRACE */, "Expected '{' before class body");
      const members = this.classMembers();
      return {
        type: "ClassDeclaration",
        name,
        superclass,
        interfaces,
        members,
        position: this.previous().position
      };
    }
    classMembers() {
      const members = [];
      while (!this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
        let isStatic = false;
        if (this.match("statik" /* STATIK */)) isStatic = true;
        if (this.match("mula" /* MULA */)) {
          this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'mula'");
          const parameters = this.parameters();
          this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
          this.consume("{" /* LEFT_BRACE */, "Expected '{' before constructor body");
          const body = this.parseBlockBody();
          members.push({
            type: "MethodDeclaration",
            name: "constructor",
            parameters,
            body,
            kind: "constructor",
            visibility: "public",
            isStatic,
            position: this.peek().position
          });
        } else if (this.match("bikin" /* BIKIN */)) {
          if (this.check("anyar" /* ANYAR */)) {
            this.advance();
            this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'anyar'");
            const parameters = this.parameters();
            this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
            this.consume("{" /* LEFT_BRACE */, "Expected '{' before constructor body");
            const body = this.parseBlockBody();
            members.push({
              type: "MethodDeclaration",
              name: "constructor",
              parameters,
              body,
              kind: "constructor",
              visibility: "public",
              isStatic,
              position: this.peek().position
            });
          } else {
            const nameToken = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected method name");
            const name = nameToken.value;
            this.consume("(" /* LEFT_PAREN */, "Expected '(' after method name");
            const parameters = this.parameters();
            this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
            this.consume("{" /* LEFT_BRACE */, "Expected '{' before method body");
            const body = this.parseBlockBody();
            members.push({
              type: "MethodDeclaration",
              name,
              parameters,
              body,
              kind: "method",
              visibility: "public",
              isStatic,
              position: this.peek().position
            });
          }
        } else if (this.check("IDENTIFIER" /* IDENTIFIER */) && this.peek().value !== "statik") {
          const nameToken = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected method name");
          const name = nameToken.value;
          this.consume("(" /* LEFT_PAREN */, "Expected '(' after method name");
          const parameters = this.parameters();
          this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
          this.consume("{" /* LEFT_BRACE */, "Expected '{' before method body");
          const body = this.parseBlockBody();
          members.push({
            type: "MethodDeclaration",
            name,
            parameters,
            body,
            kind: "method",
            visibility: "public",
            isStatic,
            position: this.peek().position
          });
        } else if (this.match("ane" /* ANCE */, "tetep" /* TETEP */)) {
          const fieldToken = this.previous();
          const fieldName = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected field name").value;
          let initializer = null;
          if (this.match("=" /* EQUAL */)) {
            initializer = this.assignment();
          }
          this.match(";" /* SEMICOLON */);
          members.push({
            type: "FieldDeclaration",
            name: fieldName,
            visibility: "public",
            isStatic,
            initializer,
            position: this.peek().position
          });
        } else {
          break;
        }
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after class body");
      return members;
    }
    interfaceDeclaration() {
      const name = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected interface name").value;
      this.consume("{" /* LEFT_BRACE */, "Expected '{' before interface body");
      const methods = [];
      while (!this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
        const methodName = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected method name").value;
        this.consume("(" /* LEFT_PAREN */, "Expected '(' after method name");
        const parameters = this.parameters();
        this.consume(")" /* RIGHT_PAREN */, "Expected ')' after parameters");
        let returnType;
        if (this.match(":" /* COLON */)) {
          const typeToken = this.advance();
          returnType = this.getTypeAnnotation(typeToken);
        }
        this.consume(";" /* SEMICOLON */, "Expected ';' after method signature");
        methods.push({
          type: "InterfaceMethod",
          name: methodName,
          parameters,
          returnType,
          position: this.peek().position
        });
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after interface body");
      return {
        type: "InterfaceDeclaration",
        name,
        methods,
        position: this.peek().position
      };
    }
    ifStatement() {
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'kalo'");
      const test = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after condition");
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after if condition");
      const consequent = this.parseBlockBody();
      let alternate = null;
      if (this.match("kagaknye" /* KAGAKNYE */)) {
        alternate = {
          type: "ElseClause",
          ifStatement: this.ifStatement(),
          position: this.peek().position
        };
      } else if (this.match("udah_gituh" /* UDAH_GITUH */)) {
        this.consume("{" /* LEFT_BRACE */, "Expected '{' after else");
        alternate = {
          type: "ElseClause",
          block: this.parseBlockBody(),
          position: this.peek().position
        };
      }
      return {
        type: "IfStatement",
        test,
        consequent,
        alternate,
        position: this.peek().position
      };
    }
    parseBlockBody() {
      const start = this.previous();
      const statements = [];
      while (!this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
        statements.push(this.parseStatement());
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after block");
      return {
        type: "BlockStatement",
        statements,
        position: start.position
      };
    }
    whileStatement() {
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'selagi'");
      const test = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after condition");
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after while condition");
      const body = this.parseBlockBody();
      return {
        type: "WhileStatement",
        test,
        body,
        position: this.peek().position
      };
    }
    doWhileStatement() {
      const token = this.previous();
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after 'kerjain'");
      const body = this.parseBlockBody();
      this.consume("selagi" /* SELAGI */, "Expected 'selagi' after do-while body");
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'selagi'");
      const test = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after do-while condition");
      this.match(";" /* SEMICOLON */);
      return {
        type: "DoWhileStatement",
        body,
        test,
        position: token.position
      };
    }
    forStatement() {
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'itung'");
      if (!this.match("ane" /* ANCE */, "tetep" /* TETEP */)) {
        throw BetaError.expected("Expected variable declaration after 'itung ('", this.peek().position);
      }
      const init = this.variableDeclaration();
      const test = this.assignment();
      this.consume(";" /* SEMICOLON */, "Expected ';' after for condition");
      const update = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after for update");
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after for update");
      const body = this.parseBlockBody();
      return {
        type: "ForStatement",
        init,
        test,
        update,
        body,
        position: this.peek().position
      };
    }
    forEachStatement() {
      let kind = "ane";
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'saban'");
      if (this.match("tetep" /* TETEP */)) kind = "tetep";
      else this.match("ane" /* ANCE */);
      const variable = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected variable name").value;
      this.consume("dari" /* DARI */, "Expected 'dari' after variable");
      const iterable = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after iterable");
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after iterable");
      const body = this.parseBlockBody();
      return {
        type: "ForEachStatement",
        kind,
        variable,
        iterable,
        body,
        position: this.peek().position
      };
    }
    switchStatement() {
      this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'pilih'");
      const discriminant = this.assignment();
      this.consume(")" /* RIGHT_PAREN */, "Expected ')' after discriminant");
      this.consume("{" /* LEFT_BRACE */, "Expected '{' before switch cases");
      const cases = [];
      while (!this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
        const isDefault = this.match("bodo_amat" /* BODO_AMAT */);
        let test = null;
        if (!isDefault) {
          this.consume("kalo_gini" /* KALO_GINI */, "Expected 'kalo_gini'");
          test = this.assignment();
        }
        this.consume(":" /* COLON */, "Expected ':' after case keyword");
        const consequent = [];
        while (!this.check("kalo_gini" /* KALO_GINI */) && !this.check("bodo_amat" /* BODO_AMAT */) && !this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
          consequent.push(this.parseStatement());
        }
        cases.push({
          type: "SwitchCase",
          test,
          consequent,
          position: this.peek().position
        });
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after switch cases");
      return {
        type: "SwitchStatement",
        discriminant,
        cases,
        position: this.peek().position
      };
    }
    tryStatement() {
      this.consume("{" /* LEFT_BRACE */, "Expected '{' after try");
      const block = this.parseBlockBody();
      let handler = null;
      let finalizer = null;
      if (this.match("tangkep" /* TANGKEP */)) {
        this.consume("(" /* LEFT_PAREN */, "Expected '(' after 'tangkep'");
        let param = null;
        if (this.match("ente" /* ENTE */)) {
          param = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected catch parameter name").value;
        } else if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
          param = this.advance().value;
        }
        this.consume(")" /* RIGHT_PAREN */, "Expected ')' after catch parameter");
        this.consume("{" /* LEFT_BRACE */, "Expected '{' after catch");
        const catchBlock = this.parseBlockBody();
        handler = {
          type: "CatchClause",
          param,
          block: catchBlock,
          position: this.peek().position
        };
      }
      if (this.match("akhirnye" /* AKHIRNYE */)) {
        this.consume("{" /* LEFT_BRACE */, "Expected '{' after finally");
        finalizer = this.parseBlockBody();
      }
      return {
        type: "TryStatement",
        block,
        handler,
        finalizer,
        position: this.peek().position
      };
    }
    returnStatement() {
      const arg = !this.check(";" /* SEMICOLON */) && !this.check("}" /* RIGHT_BRACE */) ? this.assignment() : null;
      return {
        type: "ReturnStatement",
        argument: arg,
        position: this.peek().position
      };
    }
    throwStatement() {
      const arg = this.assignment();
      return {
        type: "ThrowStatement",
        argument: arg,
        position: this.peek().position
      };
    }
    breakStatement() {
      return {
        type: "BreakStatement",
        position: this.peek().position
      };
    }
    continueStatement() {
      return {
        type: "ContinueStatement",
        position: this.peek().position
      };
    }
    blockStatement() {
      const start = this.previous();
      const statements = [];
      while (!this.check("}" /* RIGHT_BRACE */) && !this.isAtEnd()) {
        statements.push(this.parseStatement());
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after block");
      return {
        type: "BlockStatement",
        statements,
        position: start.position
      };
    }
    expressionStatement() {
      const expr = this.call(this.assignment());
      this.match(";" /* SEMICOLON */);
      return {
        type: "ExpressionStatement",
        expression: expr,
        position: expr.position
      };
    }
    importStatement() {
      let specifiers = [];
      let defaultImport = null;
      if (this.match("IDENTIFIER" /* IDENTIFIER */)) {
        defaultImport = this.previous().value;
        if (this.match("," /* COMMA */)) {
          specifiers = this.parseImportSpecifiers();
        }
      } else if (this.match("{" /* LEFT_BRACE */)) {
        specifiers = this.parseImportSpecifiers();
      }
      this.consume("dari" /* DARI */, "Expected 'dari' in import statement");
      const source = this.consume("STRING" /* STRING */, "Expected module specifier").value;
      return {
        type: "ImportStatement",
        specifiers,
        source,
        defaultImport,
        position: this.peek().position
      };
    }
    parseImportSpecifiers() {
      const specifiers = [];
      if (this.check("}" /* RIGHT_BRACE */)) {
        this.advance();
        return specifiers;
      }
      do {
        specifiers.push(this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected identifier").value);
      } while (this.match("," /* COMMA */));
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after import specifiers");
      return specifiers;
    }
    exportStatement() {
      let declaration;
      if (this.match("bikin" /* BIKIN */)) {
        declaration = this.functionDeclaration();
        declaration.isExported = true;
      } else if (this.match("cetak" /* CETAK */)) {
        declaration = this.classDeclaration();
      } else if (this.match("ane" /* ANCE */, "tetep" /* TETEP */)) {
        declaration = this.variableDeclaration();
      } else {
        throw BetaError.expected("Expected declaration after 'kasoh'", this.peek().position);
      }
      return {
        type: "ExportStatement",
        declaration,
        position: this.peek().position
      };
    }
    assignment() {
      let expr = this.ternary();
      if (this.match(
        "=" /* EQUAL */,
        "+=" /* PLUS_ASSIGN */,
        "-=" /* MINUS_ASSIGN */,
        "*=" /* TIMES_ASSIGN */,
        "/=" /* DIVIDE_ASSIGN */
      )) {
        const op = this.previous().value;
        const right = this.assignment();
        expr = {
          type: "AssignmentExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    ternary() {
      const expr = this.nullish();
      if (this.match("?" /* QUESTION */)) {
        const consequent = this.assignment();
        this.consume(":" /* COLON */, "Expected ':' in ternary expression");
        const alternate = this.assignment();
        return {
          type: "ConditionalExpression",
          test: expr,
          consequent,
          alternate,
          position: this.peek().position
        };
      }
      return expr;
    }
    nullish() {
      let expr = this.or();
      while (this.match("??" /* NULLISH */)) {
        const op = this.previous().value;
        const right = this.or();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    or() {
      let expr = this.and();
      while (this.match("||" /* OR */)) {
        const op = this.previous().value;
        const right = this.and();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    and() {
      let expr = this.equality();
      while (this.match("&&" /* AND */)) {
        const op = this.previous().value;
        const right = this.equality();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    equality() {
      let expr = this.comparison();
      while (this.match(
        "==" /* EQUAL_EQUAL */,
        "!=" /* NOT_EQUAL */,
        "===" /* STRICT_EQUAL */,
        "!==" /* STRICT_NOT_EQUAL */
      )) {
        const op = this.previous().value;
        const right = this.comparison();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    comparison() {
      let expr = this.addition();
      while (this.match(
        "<" /* LESS */,
        ">" /* GREATER */,
        "<=" /* LESS_EQUAL */,
        ">=" /* GREATER_EQUAL */
      )) {
        const op = this.previous().value;
        const right = this.addition();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    addition() {
      let expr = this.multiplication();
      while (this.match("+" /* PLUS */, "-" /* MINUS */)) {
        const op = this.previous().value;
        const right = this.multiplication();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    multiplication() {
      let expr = this.power();
      while (this.match("*" /* TIMES */, "/" /* DIVIDE */, "%" /* MODULO */)) {
        const op = this.previous().value;
        const right = this.power();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    power() {
      let expr = this.unary();
      while (this.match("**" /* POWER */)) {
        const op = this.previous().value;
        const right = this.unary();
        expr = {
          type: "BinaryExpression",
          left: expr,
          operator: op,
          right,
          position: this.peek().position
        };
      }
      return expr;
    }
    unary() {
      if (this.match("!" /* NOT */, "-" /* MINUS */, "++" /* INCREMENT */, "--" /* DECREMENT */, "..." /* SPREAD */)) {
        const op = this.previous().value;
        const arg = this.unary();
        return {
          type: "UnaryExpression",
          operator: op,
          argument: arg,
          prefix: true,
          position: this.peek().position
        };
      }
      if (this.match("tungguin" /* TUNGGU */)) {
        const arg = this.unary();
        return {
          type: "UnaryExpression",
          operator: "await",
          argument: arg,
          prefix: true,
          position: this.peek().position
        };
      }
      if (this.match("sabut" /* SABUT */)) {
        if (this.check("babang" /* BABANG */)) {
          return this.legacySuperCallExpression();
        }
        return this.unary();
      }
      if (this.match("babang" /* BABANG */)) {
        let property;
        let args = [];
        if (this.match("punye" /* PUNYE */, "." /* DOT */)) {
          const propName = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected property name after 'punye'").value;
          property = {
            type: "Identifier",
            name: propName,
            position: this.peek().position
          };
        } else if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
          this.advance();
          property = {
            type: "Identifier",
            name: this.previous().value,
            position: this.peek().position
          };
        }
        if (this.match("(" /* LEFT_PAREN */)) {
          if (!this.check(")" /* RIGHT_PAREN */)) {
            do {
              args.push(this.assignment());
            } while (this.match("," /* COMMA */));
          }
          this.consume(")" /* RIGHT_PAREN */, "Expected ')' after super call arguments");
        }
        return {
          type: "SuperExpression",
          property,
          arguments: args.length > 0 ? args : void 0,
          position: this.peek().position
        };
      }
      return this.postfix();
    }
    postfix() {
      let expr = this.primary();
      while (this.match("++" /* INCREMENT */, "--" /* DECREMENT */)) {
        const op = this.previous().value;
        expr = {
          type: "UnaryExpression",
          operator: op,
          argument: expr,
          prefix: false,
          position: this.peek().position
        };
      }
      return this.call(expr);
    }
    call(expr) {
      let result = expr;
      while (true) {
        if (this.match("(" /* LEFT_PAREN */)) {
          const args = [];
          if (!this.check(")" /* RIGHT_PAREN */)) {
            do {
              args.push(this.assignment());
            } while (this.match("," /* COMMA */));
          }
          this.consume(")" /* RIGHT_PAREN */, "Expected ')' after arguments");
          result = {
            type: "CallExpression",
            callee: result,
            arguments: args,
            optional: false,
            position: this.peek().position
          };
        } else if (this.match("." /* DOT */, "punye" /* PUNYE */, "?." /* QUESTION_DOT */)) {
          const optional = this.previous().type === "?." /* QUESTION_DOT */;
          const property = this.propertyName();
          result = {
            type: "MemberExpression",
            object: result,
            property: {
              type: "Identifier",
              name: property,
              position: this.peek().position
            },
            computed: false,
            optional,
            position: this.peek().position
          };
        } else if (this.match("[" /* LEFT_BRACKET */)) {
          const property = this.assignment();
          this.consume("]" /* RIGHT_BRACKET */, "Expected ']' after computed property");
          result = {
            type: "MemberExpression",
            object: result,
            property,
            computed: true,
            position: this.peek().position
          };
        } else {
          break;
        }
      }
      return result;
    }
    primary() {
      if (this.match("NUMBER" /* NUMBER */)) {
        return {
          type: "Literal",
          value: parseFloat(this.previous().value),
          raw: this.previous().value,
          position: this.peek().position
        };
      }
      if (this.match("STRING" /* STRING */)) {
        return {
          type: "Literal",
          value: this.previous().value,
          raw: this.previous().value,
          position: this.peek().position
        };
      }
      if (this.match("TEMPLATE" /* TEMPLATE */)) {
        return {
          type: "Literal",
          value: this.previous().value,
          raw: this.previous().value,
          position: this.peek().position
        };
      }
      if (this.match("REGEX" /* REGEX */)) {
        return {
          type: "Literal",
          value: this.previous().value,
          raw: this.previous().value,
          position: this.peek().position
        };
      }
      if (this.match("betoel" /* BETOEL */)) {
        return {
          type: "Literal",
          value: true,
          raw: "true",
          position: this.peek().position
        };
      }
      if (this.match("kaga" /* KAGA */)) {
        return {
          type: "Literal",
          value: false,
          raw: "false",
          position: this.peek().position
        };
      }
      if (this.match("kosong" /* KOSONG */)) {
        return {
          type: "Literal",
          value: null,
          raw: "null",
          position: this.peek().position
        };
      }
      if (this.match("entah" /* ENTAH */)) {
        return {
          type: "Literal",
          value: void 0,
          raw: "undefined",
          position: this.peek().position
        };
      }
      if (this.match("gua" /* GUA */)) {
        return {
          type: "Identifier",
          name: "this",
          position: this.peek().position
        };
      }
      if (this.match("anyar" /* ANYAR */)) {
        const callee = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected class name").value;
        let args = [];
        if (this.match("(" /* LEFT_PAREN */)) {
          if (!this.check(")" /* RIGHT_PAREN */)) {
            do {
              args.push(this.assignment());
            } while (this.match("," /* COMMA */));
          }
          this.consume(")" /* RIGHT_PAREN */, "Expected ')' after new arguments");
        }
        return {
          type: "NewExpression",
          callee,
          arguments: args,
          position: this.peek().position
        };
      }
      if (this.check("deret" /* DERET */) && this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === "[" /* LEFT_BRACKET */) {
        this.advance();
        this.consume("[" /* LEFT_BRACKET */, "Expected '[' after 'deret'");
        return this.arrayLiteralAfterLeftBracket();
      }
      if (this.isBuiltinIdentifier(this.peek().type)) {
        const token = this.advance();
        return {
          type: "Identifier",
          name: token.value || token.type,
          position: this.peek().position
        };
      }
      if (this.match("IDENTIFIER" /* IDENTIFIER */)) {
        return {
          type: "Identifier",
          name: this.previous().value,
          position: this.peek().position
        };
      }
      if (this.match("[" /* LEFT_BRACKET */)) {
        const elements = [];
        if (!this.check("]" /* RIGHT_BRACKET */)) {
          do {
            elements.push(this.assignment());
          } while (this.match("," /* COMMA */));
        }
        this.consume("]" /* RIGHT_BRACKET */, "Expected ']' after array elements");
        return {
          type: "ArrayExpression",
          elements,
          position: this.peek().position
        };
      }
      if (this.match("{" /* LEFT_BRACE */)) {
        return this.objectExpression();
      }
      if (this.match("(" /* LEFT_PAREN */)) {
        const expr = this.assignment();
        this.consume(")" /* RIGHT_PAREN */, "Expected ')' after expression");
        return expr;
      }
      throw BetaError.expected("Expected expression", this.peek().position);
    }
    legacySuperCallExpression() {
      const token = this.consume("babang" /* BABANG */, "Expected 'babang' after 'panggil'");
      let property;
      if (this.match("punye" /* PUNYE */, "." /* DOT */)) {
        if (this.match("bikin" /* BIKIN */)) {
          if (this.match("anyar" /* ANYAR */, "mula" /* MULA */)) {
            property = {
              type: "Identifier",
              name: "constructor",
              position: this.peek().position
            };
          } else {
            property = {
              type: "Identifier",
              name: "bikin",
              position: this.peek().position
            };
          }
        } else if (this.match("mula" /* MULA */, "anyar" /* ANYAR */)) {
          property = {
            type: "Identifier",
            name: "constructor",
            position: this.peek().position
          };
        } else {
          property = {
            type: "Identifier",
            name: this.propertyName(),
            position: this.peek().position
          };
        }
      }
      const args = [];
      if (this.match("(" /* LEFT_PAREN */)) {
        if (!this.check(")" /* RIGHT_PAREN */)) {
          do {
            args.push(this.assignment());
          } while (this.match("," /* COMMA */));
        }
        this.consume(")" /* RIGHT_PAREN */, "Expected ')' after super arguments");
      }
      return {
        type: "SuperExpression",
        property,
        arguments: args,
        position: token.position
      };
    }
    isBuiltinIdentifier(type) {
      return type === "teriak" /* TERIAK */ || type === "bisik" /* BISIK */ || type === "dengerin" /* DENGERIN */ || type === "sebrapa" /* SEBRAPA */ || type === "ape" /* APE */ || type === "itungan" /* ITUNGAN */ || type === "omongan" /* OMONGAN */ || type === "kumpulin" /* KUMPULIN */ || type === "acak" /* ACAK */ || type === "tidur" /* TIDUR */ || type === "deret" /* DERET */ || type === "angka" /* ANGKA */ || type === "kata" /* KATA */;
    }
    propertyName() {
      if (this.check("IDENTIFIER" /* IDENTIFIER */)) return this.advance().value;
      if (this.isBuiltinIdentifier(this.peek().type)) {
        const token = this.advance();
        return token.value || token.type;
      }
      throw BetaError.expected("Expected property name", this.peek().position);
    }
    objectExpression() {
      const properties = [];
      if (!this.check("}" /* RIGHT_BRACE */)) {
        do {
          if (this.match("..." /* SPREAD */)) {
            properties.push({
              type: "ObjectProperty",
              key: "__spread",
              value: this.assignment(),
              position: this.peek().position
            });
            continue;
          }
          let key;
          const keyToken = this.peek();
          if (keyToken.type === "IDENTIFIER" /* IDENTIFIER */) {
            this.advance();
            key = keyToken.value;
          } else if (keyToken.type === "STRING" /* STRING */) {
            this.advance();
            key = keyToken.value;
          } else {
            this.advance();
            key = this.assignment();
          }
          this.consume(":" /* COLON */, "Expected ':' in object property");
          const value = this.assignment();
          properties.push({
            type: "ObjectProperty",
            key,
            value,
            position: this.peek().position
          });
        } while (this.match("," /* COMMA */));
      }
      this.consume("}" /* RIGHT_BRACE */, "Expected '}' after object properties");
      return {
        type: "ObjectExpression",
        properties,
        position: this.peek().position
      };
    }
    bindingPattern() {
      if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
        return this.advance().value;
      }
      if (this.check("{" /* LEFT_BRACE */) || this.check("[" /* LEFT_BRACKET */)) {
        const opening = this.advance();
        const closing = opening.type === "{" /* LEFT_BRACE */ ? "}" /* RIGHT_BRACE */ : "]" /* RIGHT_BRACKET */;
        let depth = 1;
        const parts = [opening.value || opening.type];
        while (!this.isAtEnd() && depth > 0) {
          const token = this.advance();
          const value = token.value || token.type;
          parts.push(value);
          if (token.type === opening.type) depth++;
          if (token.type === closing) depth--;
        }
        if (depth !== 0) {
          throw BetaError.expected("Expected closing destructuring pattern", this.peek().position);
        }
        return parts.join(" ").replace(/\s*([{}[\],:])\s*/g, "$1").replace(/\s+/g, " ");
      }
      throw BetaError.expected("Expected variable name", this.peek().position);
    }
    skipGenericParameters() {
      if (!this.match("<" /* LESS */)) return;
      let depth = 1;
      while (!this.isAtEnd() && depth > 0) {
        if (this.match("<" /* LESS */)) depth++;
        else if (this.match(">" /* GREATER */)) depth--;
        else this.advance();
      }
    }
    arrayLiteralAfterLeftBracket() {
      const elements = [];
      if (!this.check("]" /* RIGHT_BRACKET */)) {
        do {
          elements.push(this.assignment());
        } while (this.match("," /* COMMA */));
      }
      this.consume("]" /* RIGHT_BRACKET */, "Expected ']' after array elements");
      return {
        type: "ArrayExpression",
        elements,
        position: this.peek().position
      };
    }
    getTypeAnnotation(token) {
      switch (token.type) {
        case "angka" /* ANGKA */:
          return "angka";
        case "kata" /* KATA */:
          return "kata";
        case "betoel" /* BETOEL */:
          return "betoel";
        case "deret" /* DERET */:
          return "deret";
        case "IDENTIFIER" /* IDENTIFIER */:
          return token.value;
        default:
          throw BetaError.expected("Expected type annotation", token.position);
      }
    }
  };

  // src/transpiler/JavaScriptEmitter.ts
  var JavaScriptEmitter = class {
    constructor() {
      __publicField(this, "output", "");
      __publicField(this, "indent", 0);
      __publicField(this, "variables", /* @__PURE__ */ new Set());
      __publicField(this, "functions", /* @__PURE__ */ new Set());
      __publicField(this, "classes", /* @__PURE__ */ new Set());
    }
    emit(program) {
      this.output = "";
      this.indent = 0;
      this.variables = /* @__PURE__ */ new Set();
      this.functions = /* @__PURE__ */ new Set();
      this.classes = /* @__PURE__ */ new Set();
      this.emitRuntimeHelpers();
      for (const stmt of program.body) {
        this.emitStatement(stmt);
      }
      return this.output;
    }
    emitRuntimeHelpers() {
      this.output += `// Generated by BetaScript Compiler
`;
      this.output += `const __fs = require("fs");
`;
      this.output += `const __pasang = (proto, nama, fn) => { if (!Object.prototype.hasOwnProperty.call(proto, nama)) Object.defineProperty(proto, nama, { value: fn, configurable: true }); };
`;
      this.output += `const __pasangGet = (proto, nama, fn) => { if (!Object.prototype.hasOwnProperty.call(proto, nama)) Object.defineProperty(proto, nama, { get: fn, configurable: true }); };
`;
      this.output += `__pasang(String.prototype, "gede", function() { return this.toString().toUpperCase(); });
`;
      this.output += `__pasang(String.prototype, "kecil", function() { return this.toString().toLowerCase(); });
`;
      this.output += `__pasang(String.prototype, "pisah", function(separator) { return this.toString().split(separator); });
`;
      this.output += `__pasang(String.prototype, "ganti", function(search, replace) { return this.toString().replace(search, replace); });
`;
      this.output += `__pasang(String.prototype, "cocok", function(pattern) { return this.toString().match(pattern); });
`;
      this.output += `__pasangGet(String.prototype, "sebrapa", function() { return this.length; });
`;
      this.output += `__pasang(Array.prototype, "petakan", function(fn) { return this.map(fn); });
`;
      this.output += `__pasang(Array.prototype, "saring", function(fn) { return this.filter(fn); });
`;
      this.output += `__pasang(Array.prototype, "kurangi", function(fn, init) { return arguments.length > 1 ? this.reduce(fn, init) : this.reduce(fn); });
`;
      this.output += `__pasang(Array.prototype, "urutin", function(fn) { return this.sort(fn); });
`;
      this.output += `__pasang(Array.prototype, "gabung", function(separator) { return this.join(separator); });
`;
      this.output += `__pasangGet(Array.prototype, "sebrapa", function() { return this.length; });
`;
      this.output += `const __runtime = {
`;
      this.output += this.indentString() + `teriak: (...args) => console.log(...args),
`;
      this.output += this.indentString() + `bisik: (msg) => process.stdout.write(String(msg)),
`;
      this.output += this.indentString() + `dengerin: (msg) => require('readline-sync').question(msg),
`;
      this.output += this.indentString() + `sebrapa: (arr) => arr?.length ?? 0,
`;
      this.output += this.indentString() + `ape: (val) => typeof val,
`;
      this.output += this.indentString() + `itungan: (val) => Number(val),
`;
      this.output += this.indentString() + `omongan: (val) => String(val),
`;
      this.output += this.indentString() + `kumpulin: (...items) => Array(...items),
`;
      this.output += this.indentString() + `acak: () => Math.random(),
`;
      this.output += this.indentString() + `tidur: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
`;
      this.output += this.indentString() + `semua: (promises) => Promise.all(promises),
`;
      this.output += this.indentString() + `balap: (promises) => Promise.race(promises),
`;
      this.output += this.indentString() + `peta: (entries) => new Map(entries),
`;
      this.output += this.indentString() + `himpunan: (values) => new Set(values),
`;
      this.output += this.indentString() + `peta_lemah: (entries) => new WeakMap(entries),
`;
      this.output += this.indentString() + `himpunan_lemah: (values) => new WeakSet(values)
`;
      this.output += `};

`;
      this.output += `const http = { ambil: (url, options) => fetch(url, options), kirim: (url, data, options = {}) => fetch(url, { ...options, method: options.method || "POST", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, body: typeof data === "string" ? data : JSON.stringify(data) }) };
`;
      this.output += `const file = { baca: (p) => __fs.promises.readFile(p, "utf8"), tulis: (p, data) => __fs.promises.writeFile(p, data, "utf8"), ada: (p) => __fs.existsSync(p) };
`;
      this.output += `const matematika = { pi: Math.PI, akar: Math.sqrt, acak: Math.random, bulat: Math.round, lantai: Math.floor, atap: Math.ceil, mutlak: Math.abs, maksimal: Math.max, minimal: Math.min };
`;
      this.output += `const teks = { gede: (v) => String(v).toUpperCase(), kecil: (v) => String(v).toLowerCase(), pisah: (v, s) => String(v).split(s), ganti: (v, a, b) => String(v).replace(a, b), cocok: (v, pola) => String(v).match(pola) };
`;
      this.output += `const deret = { petakan: (v, fn) => v.map(fn), saring: (v, fn) => v.filter(fn), kurangi: (v, fn, init) => init === undefined ? v.reduce(fn) : v.reduce(fn, init), urutin: (v, fn) => v.sort(fn) };
`;
      this.output += `const waktu = { sekarang: () => new Date(), format: (v) => new Date(v).toISOString(), tahun: (v = new Date()) => new Date(v).getFullYear(), bulan: (v = new Date()) => new Date(v).getMonth() + 1, tanggal: (v = new Date()) => new Date(v).getDate() };
`;
      this.output += `const json = { parse: JSON.parse, stringify: JSON.stringify };
`;
      this.output += `const teriak = __runtime.teriak;
`;
      this.output += `const bisik = __runtime.bisik;
`;
      this.output += `const dengerin = __runtime.dengerin;
`;
      this.output += `const sebrapa = __runtime.sebrapa;
`;
      this.output += `const ape = __runtime.ape;
`;
      this.output += `const itungan = __runtime.itungan;
`;
      this.output += `const omongan = __runtime.omongan;
`;
      this.output += `const kumpulin = __runtime.kumpulin;
`;
      this.output += `const acak = __runtime.acak;
`;
      this.output += `const tidur = __runtime.tidur;

`;
      this.output += `const semua = __runtime.semua;
`;
      this.output += `const balap = __runtime.balap;
`;
      this.output += `const peta = __runtime.peta;
`;
      this.output += `const himpunan = __runtime.himpunan;
`;
      this.output += `const peta_lemah = __runtime.peta_lemah;
`;
      this.output += `const himpunan_lemah = __runtime.himpunan_lemah;

`;
    }
    emitStatement(stmt) {
      switch (stmt.type) {
        case "EmptyStatement":
          break;
        case "VariableDeclaration":
          this.emitVariableDeclaration(stmt);
          break;
        case "FunctionDeclaration":
          this.emitFunctionDeclaration(stmt);
          break;
        case "ClassDeclaration":
          this.emitClassDeclaration(stmt);
          break;
        case "InterfaceDeclaration":
          break;
        case "IfStatement":
          this.emitIfStatement(stmt);
          break;
        case "WhileStatement":
          this.emitWhileStatement(stmt);
          break;
        case "DoWhileStatement":
          this.emitDoWhileStatement(stmt);
          break;
        case "ForStatement":
          this.emitForStatement(stmt);
          break;
        case "ForEachStatement":
          this.emitForEachStatement(stmt);
          break;
        case "SwitchStatement":
          this.emitSwitchStatement(stmt);
          break;
        case "TryStatement":
          this.emitTryStatement(stmt);
          break;
        case "ReturnStatement":
          this.emitReturnStatement(stmt);
          break;
        case "ThrowStatement":
          this.emitThrowStatement(stmt);
          break;
        case "BreakStatement":
          this.emitLine("break;");
          break;
        case "ContinueStatement":
          this.emitLine("continue;");
          break;
        case "ImportStatement":
          this.emitImportStatement(stmt);
          break;
        case "ExportStatement":
          this.emitExportStatement(stmt);
          break;
        case "ExpressionStatement":
          this.emitExpressionStatement(stmt);
          break;
        case "BlockStatement":
          this.emitBlockStatement(stmt);
          break;
      }
    }
    emitVariableDeclaration(stmt) {
      const keyword = stmt.kind === "ane" ? "let" : "const";
      const name = stmt.name;
      this.variables.add(name);
      if (stmt.initializer) {
        this.emitLine(`${keyword} ${name} = ${this.emitExpression(stmt.initializer)};`);
      } else {
        this.emitLine(`${keyword} ${name};`);
      }
    }
    emitFunctionDeclaration(stmt) {
      const asyncKeyword = stmt.isAsync ? "async " : "";
      const exportKeyword = stmt.isExported ? "export " : "";
      const name = stmt.name;
      this.functions.add(name);
      const params = stmt.parameters.map((p) => `${p.isRest ? "..." : ""}${p.name}`).join(", ");
      this.emitLine(`${exportKeyword}${asyncKeyword}function ${name}(${params}) {`);
      this.indent++;
      this.emitBlockStatement(stmt.body);
      this.indent--;
      this.emitLine("}");
    }
    emitClassDeclaration(stmt) {
      this.classes.add(stmt.name);
      let classStr = "class " + stmt.name;
      if (stmt.superclass) {
        classStr += " extends " + stmt.superclass;
      }
      this.emitLine(classStr + " {");
      this.indent++;
      for (const member of stmt.members) {
        this.emitClassMember(member);
      }
      this.indent--;
      this.emitLine("}");
    }
    emitClassMember(member) {
      if (member.type === "MethodDeclaration") {
        const staticKeyword = member.isStatic ? "static " : "";
        if (member.kind === "method") {
          const isAsync = member.body.statements.some(
            (s) => s.type === "FunctionDeclaration" && s.isAsync
          ) || member.body.statements.some(
            (s) => s.type === "ExpressionStatement" && s.expression.type === "CallExpression" && s.expression.callee.type === "Identifier" && s.expression.callee.name === "tungguin"
          );
          const asyncKeyword = isAsync ? "async " : "";
          const params = member.parameters.map((p) => `${p.isRest ? "..." : ""}${p.name}`).join(", ");
          this.emitLine(`${staticKeyword}${asyncKeyword}${member.name}(${params}) {`);
          this.indent++;
          this.emitBlockStatement(member.body);
          this.indent--;
          this.emitLine("}");
        } else {
          const params = member.parameters.map((p) => `${p.isRest ? "..." : ""}${p.name}`).join(", ");
          this.emitLine(`${staticKeyword}constructor(${params}) {`);
          this.indent++;
          this.emitBlockStatement(member.body);
          this.indent--;
          this.emitLine("}");
        }
      } else {
        const staticKeyword = member.isStatic ? "static " : "";
        const visibility = this.getVisibility(member.visibility);
        if (member.initializer) {
          this.emitLine(`${staticKeyword}${visibility}${member.name} = ${this.emitExpression(member.initializer)};`);
        } else {
          this.emitLine(`${staticKeyword}${visibility}${member.name};`);
        }
      }
    }
    getVisibility(vis) {
      switch (vis) {
        case "private":
          return "#";
        case "protected":
          return "#";
        default:
          return "";
      }
    }
    emitIfStatement(stmt) {
      this.emitLine(`if (${this.emitExpression(stmt.test)}) {`);
      this.indent++;
      this.emitBlockStatement(stmt.consequent);
      this.indent--;
      this.emitLine("}");
      if (stmt.alternate) {
        if (stmt.alternate.ifStatement) {
          this.emitIfStatement(stmt.alternate.ifStatement);
        } else if (stmt.alternate.block) {
          this.emitLine("else {");
          this.indent++;
          this.emitBlockStatement(stmt.alternate.block);
          this.indent--;
          this.emitLine("}");
        }
      }
    }
    emitWhileStatement(stmt) {
      this.emitLine(`while (${this.emitExpression(stmt.test)}) {`);
      this.indent++;
      this.emitBlockStatement(stmt.body);
      this.indent--;
      this.emitLine("}");
    }
    emitDoWhileStatement(stmt) {
      this.emitLine("do {");
      this.indent++;
      this.emitBlockStatement(stmt.body);
      this.indent--;
      this.emitLine(`} while (${this.emitExpression(stmt.test)});`);
    }
    emitForStatement(stmt) {
      const init = this.emitForInit(stmt.init);
      this.emitLine(`for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
      this.indent++;
      this.emitBlockStatement(stmt.body);
      this.indent--;
      this.emitLine("}");
    }
    emitForInit(init) {
      const keyword = init.kind === "ane" ? "let" : "const";
      if (init.initializer) {
        return `${keyword} ${init.name} = ${this.emitExpression(init.initializer)}`;
      }
      return `${keyword} ${init.name}`;
    }
    emitForEachStatement(stmt) {
      const keyword = stmt.kind === "ane" ? "let" : "const";
      this.emitLine(`for (${keyword} ${stmt.variable} of ${this.emitExpression(stmt.iterable)}) {`);
      this.indent++;
      this.emitBlockStatement(stmt.body);
      this.indent--;
      this.emitLine("}");
    }
    emitSwitchStatement(stmt) {
      this.emitLine(`switch (${this.emitExpression(stmt.discriminant)}) {`);
      this.indent++;
      for (const caseItem of stmt.cases) {
        if (caseItem.test === null) {
          this.emitLine("default:");
        } else {
          this.emitLine(`case ${this.emitExpression(caseItem.test)}:`);
        }
        this.indent++;
        for (const caseStmt of caseItem.consequent) {
          this.emitStatement(caseStmt);
        }
        this.indent--;
      }
      this.indent--;
      this.emitLine("}");
    }
    emitTryStatement(stmt) {
      this.emitLine("try {");
      this.indent++;
      this.emitBlockStatement(stmt.block);
      this.indent--;
      if (stmt.handler) {
        const param = stmt.handler.param ?? "";
        this.emitLine(`} catch (${param}) {`);
        this.indent++;
        this.emitBlockStatement(stmt.handler.block);
        this.indent--;
      }
      if (stmt.finalizer) {
        this.emitLine("} finally {");
        this.indent++;
        this.emitBlockStatement(stmt.finalizer);
        this.indent--;
      } else if (!stmt.handler) {
        this.emitLine("}");
      } else {
        this.emitLine("}");
      }
    }
    emitBlockStatement(stmt) {
      for (const s of stmt.statements) {
        this.emitStatement(s);
      }
    }
    emitReturnStatement(stmt) {
      if (stmt.argument) {
        this.emitLine(`return ${this.emitExpression(stmt.argument)};`);
      } else {
        this.emitLine("return;");
      }
    }
    emitThrowStatement(stmt) {
      this.emitLine(`throw ${this.emitExpression(stmt.argument)};`);
    }
    emitImportStatement(stmt) {
      if (stmt.defaultImport) {
        if (stmt.specifiers.length > 0) {
          const namedImports = stmt.specifiers.join(", ");
          this.emitLine(`import ${stmt.defaultImport}, { ${namedImports} } from "${stmt.source.replace(".beta", ".js")}";`);
        } else {
          this.emitLine(`import ${stmt.defaultImport} from "${stmt.source.replace(".beta", ".js")}";`);
        }
      } else if (stmt.specifiers.length > 0) {
        const namedImports = stmt.specifiers.join(", ");
        this.emitLine(`import { ${namedImports} } from "${stmt.source.replace(".beta", ".js")}";`);
      }
    }
    emitExportStatement(stmt) {
      if (stmt.declaration.type === "FunctionDeclaration") {
        const decl = stmt.declaration;
        const asyncKeyword = decl.isAsync ? "async " : "";
        const params = decl.parameters.map((p) => `${p.isRest ? "..." : ""}${p.name}`).join(", ");
        this.emitLine(`export async function ${decl.name}(${params}) {`);
        this.indent++;
        this.emitBlockStatement(decl.body);
        this.indent--;
        this.emitLine("}");
      } else if (stmt.declaration.type === "VariableDeclaration") {
        const decl = stmt.declaration;
        const keyword = decl.kind === "ane" ? "let" : "const";
        if (decl.initializer) {
          this.emitLine(`export ${keyword} ${decl.name} = ${this.emitExpression(decl.initializer)};`);
        } else {
          this.emitLine(`export ${keyword} ${decl.name};`);
        }
      } else if (stmt.declaration.type === "ClassDeclaration") {
        const decl = stmt.declaration;
        let classStr = "export class " + decl.name;
        if (decl.superclass) classStr += " extends " + decl.superclass;
        this.emitLine(classStr + " {");
        this.indent++;
        for (const member of decl.members) {
          this.emitClassMember(member);
        }
        this.indent--;
        this.emitLine("}");
      }
    }
    emitExpressionStatement(stmt) {
      this.emitLine(`${this.emitExpression(stmt.expression)};`);
    }
    emitExpression(expr) {
      switch (expr.type) {
        case "Identifier":
          if (expr.name === "tungguin") return "await ";
          return expr.name;
        case "Literal":
          if (expr.value === null) return "null";
          if (expr.value === void 0) return "undefined";
          if (typeof expr.value === "string" && (expr.raw.startsWith("`") || expr.raw.startsWith("/"))) return expr.raw;
          if (typeof expr.value === "string") return JSON.stringify(expr.value);
          if (typeof expr.value === "number") return expr.raw;
          return String(expr.value);
        case "BinaryExpression":
          return `(${this.emitExpression(expr.left)} ${expr.operator} ${this.emitExpression(expr.right)})`;
        case "UnaryExpression":
          if (expr.prefix) {
            const op = expr.operator === "await" || expr.operator === "..." ? `${expr.operator} ` : expr.operator;
            return `${op}${this.emitExpression(expr.argument)}`;
          }
          return `${this.emitExpression(expr.argument)}${expr.operator}`;
        case "AssignmentExpression":
          return `(${this.emitExpression(expr.left)} ${expr.operator} ${this.emitExpression(expr.right)})`;
        case "CallExpression":
          return this.emitCallExpression(expr);
        case "MemberExpression":
          return this.emitMemberExpression(expr);
        case "NewExpression":
          return `new ${expr.callee}(${expr.arguments.map(this.emitExpression.bind(this)).join(", ")})`;
        case "SuperExpression":
          const superArgs = expr.arguments ? expr.arguments.map(this.emitExpression.bind(this)).join(", ") : "";
          if (expr.property) {
            if (expr.property.name === "constructor") {
              return `super(${superArgs})`;
            }
            return `super.${expr.property.name}(${superArgs})`;
          }
          return `super(${superArgs})`;
        case "ArrayExpression":
          return `[${expr.elements.map(this.emitExpression.bind(this)).join(", ")}]`;
        case "ObjectExpression":
          const props = expr.properties.map((p) => {
            if (p.key === "__spread") return `...${this.emitExpression(p.value)}`;
            const key = typeof p.key === "string" ? p.key : this.emitExpression(p.key);
            return `${key}: ${this.emitExpression(p.value)}`;
          }).join(", ");
          return `{${props}}`;
        case "LambdaExpression":
          const params = expr.parameters.map((p) => p.name).join(", ");
          if (expr.body.type === "BlockStatement") {
            const body = this.emitLambdaBody(expr.body);
            return `(${params}) => ${body}`;
          }
          return `(${params}) => ${this.emitExpression(expr.body)}`;
        case "ConditionalExpression":
          return `(${this.emitExpression(expr.test)} ? ${this.emitExpression(expr.consequent)} : ${this.emitExpression(expr.alternate)})`;
      }
    }
    emitCallExpression(expr) {
      const callee = this.emitExpression(expr.callee);
      const args = expr.arguments.map(this.emitExpression.bind(this)).join(", ");
      return `${callee}(${args})`;
    }
    emitMemberExpression(expr) {
      const obj = this.emitExpression(expr.object);
      const prop = expr.computed ? `[${this.emitExpression(expr.property)}]` : `${expr.optional ? "?." : "."}${expr.property.name}`;
      return `${obj}${prop}`;
    }
    emitLambdaBody(body) {
      const statements = body.statements.map((s) => {
        if (s.type === "ReturnStatement") {
          if (s.argument) return `return ${this.emitExpression(s.argument)};`;
          return "return;";
        }
        return this.emitExpression(s);
      });
      return `{ ${statements.join(" ")} }`;
    }
    emitLine(line) {
      this.output += this.indentString() + line + "\n";
    }
    indentString() {
      return "  ".repeat(this.indent);
    }
  };

  // src/analyzer/SemanticAnalyzer.ts
  var BUILTIN_FUNCTIONS = [
    "teriak",
    "bisik",
    "dengerin",
    "sebrapa",
    "ape",
    "itungan",
    "omongan",
    "kumpulin",
    "acak",
    "tidur",
    "angka",
    "kata",
    "semua",
    "balap",
    "peta",
    "himpunan",
    "peta_lemah",
    "himpunan_lemah"
  ];
  var BUILTIN_KEYWORDS = [
    "this",
    "super",
    "gua",
    "http",
    "file",
    "matematika",
    "teks",
    "deret",
    "waktu",
    "json",
    "Error",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet"
  ];
  var SemanticAnalyzer = class {
    constructor() {
      __publicField(this, "scopeStack", []);
      __publicField(this, "loopDepth", 0);
    }
    analyze(program) {
      this.scopeStack = [{ variables: /* @__PURE__ */ new Map(), functions: /* @__PURE__ */ new Map() }];
      for (const fn of BUILTIN_FUNCTIONS) {
        this.scopeStack[0].functions.set(fn, true);
      }
      for (const stmt of program.body) {
        this.analyzeStatement(stmt);
      }
    }
    pushScope() {
      this.scopeStack.push({ variables: /* @__PURE__ */ new Map(), functions: /* @__PURE__ */ new Map() });
    }
    popScope() {
      this.scopeStack.pop();
    }
    currentScope() {
      return this.scopeStack[this.scopeStack.length - 1];
    }
    declareVariable(name, position) {
      const current = this.currentScope();
      current.variables.set(name, true);
    }
    variableExists(name) {
      for (let i = this.scopeStack.length - 1; i >= 0; i--) {
        if (this.scopeStack[i].variables.has(name)) {
          return true;
        }
      }
      return false;
    }
    functionExists(name) {
      for (let i = this.scopeStack.length - 1; i >= 0; i--) {
        if (this.scopeStack[i].functions.has(name)) {
          return true;
        }
      }
      return false;
    }
    isVariableInCurrentScope(name) {
      return this.currentScope().variables.has(name);
    }
    analyzeStatement(stmt) {
      switch (stmt.type) {
        case "VariableDeclaration":
          this.analyzeVariableDeclaration(stmt);
          break;
        case "FunctionDeclaration":
          this.analyzeFunctionDeclaration(stmt);
          break;
        case "ClassDeclaration":
          this.analyzeClassDeclaration(stmt);
          break;
        case "InterfaceDeclaration":
          this.analyzeInterfaceDeclaration(stmt);
          break;
        case "IfStatement":
          this.analyzeIfStatement(stmt);
          break;
        case "WhileStatement":
          this.analyzeWhileStatement(stmt);
          break;
        case "DoWhileStatement":
          this.analyzeDoWhileStatement(stmt);
          break;
        case "ForStatement":
          this.analyzeForStatement(stmt);
          break;
        case "ForEachStatement":
          this.analyzeForEachStatement(stmt);
          break;
        case "SwitchStatement":
          this.analyzeSwitchStatement(stmt);
          break;
        case "TryStatement":
          this.analyzeTryStatement(stmt);
          break;
        case "ReturnStatement":
          this.analyzeReturnStatement(stmt);
          break;
        case "ThrowStatement":
          this.analyzeThrowStatement(stmt);
          break;
        case "BreakStatement":
          this.analyzeBreakStatement(stmt);
          break;
        case "ContinueStatement":
          this.analyzeContinueStatement(stmt);
          break;
        case "BlockStatement":
          this.analyzeBlockStatement(stmt);
          break;
        case "ImportStatement":
          break;
        case "ExportStatement":
          break;
        case "ExpressionStatement":
          this.analyzeExpression(stmt.expression);
          break;
      }
    }
    analyzeBlockStatement(stmt) {
      this.analyzeStatementBlock(stmt.statements);
    }
    analyzeStatementBlock(statements) {
      for (const s of statements) {
        this.analyzeStatement(s);
      }
    }
    analyzeIfStatement(stmt) {
      this.analyzeExpression(stmt.test);
      this.pushScope();
      this.analyzeStatement(stmt.consequent);
      this.popScope();
      if (stmt.alternate) {
        this.pushScope();
        if (stmt.alternate.ifStatement) {
          this.analyzeStatement(stmt.alternate.ifStatement);
        } else if (stmt.alternate.block) {
          this.analyzeStatement(stmt.alternate.block);
        }
        this.popScope();
      }
    }
    analyzeWhileStatement(stmt) {
      this.analyzeExpression(stmt.test);
      this.loopDepth++;
      this.pushScope();
      this.analyzeStatement(stmt.body);
      this.popScope();
      this.loopDepth--;
    }
    analyzeDoWhileStatement(stmt) {
      this.loopDepth++;
      this.pushScope();
      this.analyzeStatement(stmt.body);
      this.popScope();
      this.analyzeExpression(stmt.test);
      this.loopDepth--;
    }
    analyzeForStatement(stmt) {
      this.loopDepth++;
      this.pushScope();
      if (stmt.init) {
        this.analyzeStatement(stmt.init);
      }
      this.analyzeExpression(stmt.test);
      this.analyzeExpression(stmt.update);
      this.analyzeStatement(stmt.body);
      this.popScope();
      this.loopDepth--;
    }
    analyzeForEachStatement(stmt) {
      this.analyzeExpression(stmt.iterable);
      this.loopDepth++;
      this.pushScope();
      this.declareVariable(stmt.variable, stmt.position);
      this.analyzeStatement(stmt.body);
      this.popScope();
      this.loopDepth--;
    }
    analyzeSwitchStatement(stmt) {
      this.analyzeExpression(stmt.discriminant);
      this.pushScope();
      for (const caseItem of stmt.cases) {
        if (caseItem.test) {
          this.analyzeExpression(caseItem.test);
        }
        for (const caseStmt of caseItem.consequent) {
          this.analyzeStatement(caseStmt);
        }
      }
      this.popScope();
    }
    analyzeTryStatement(stmt) {
      this.pushScope();
      this.analyzeStatement(stmt.block);
      this.popScope();
      if (stmt.handler) {
        this.pushScope();
        if (stmt.handler.param) {
          this.declareVariable(stmt.handler.param, stmt.handler.position);
        }
        this.analyzeStatement(stmt.handler.block);
        this.popScope();
      }
      if (stmt.finalizer) {
        this.pushScope();
        this.analyzeStatement(stmt.finalizer);
        this.popScope();
      }
    }
    analyzeReturnStatement(stmt) {
      if (stmt.argument) {
        this.analyzeExpression(stmt.argument);
      }
    }
    analyzeThrowStatement(stmt) {
      this.analyzeExpression(stmt.argument);
    }
    analyzeBreakStatement(stmt) {
      if (this.loopDepth === 0) {
        throw new BetaError(
          "Eh, 'dah' nggak boleh di sini! Harusnya di dalem loop, cek lagi ye bang.",
          stmt.position
        );
      }
    }
    analyzeContinueStatement(stmt) {
      if (this.loopDepth === 0) {
        throw new BetaError(
          "Waduh, 'lanjut' cuma bisa dipakai di dalam loop saja ya, jangan di luar!",
          stmt.position
        );
      }
    }
    analyzeVariableDeclaration(stmt) {
      for (const name of this.extractBindingNames(stmt.name)) {
        if (this.isVariableInCurrentScope(name)) {
          throw new BetaError(
            `Aduh, variabel '${name}' udah ada di sini. Nggak boleh timpa ya, nanti bingung orang lain!`,
            stmt.position
          );
        }
        this.declareVariable(name, stmt.position);
      }
      if (stmt.initializer) {
        this.analyzeExpression(stmt.initializer);
      }
    }
    analyzeFunctionDeclaration(stmt) {
      this.currentScope().functions.set(stmt.name, true);
      this.pushScope();
      for (const param of stmt.parameters) {
        this.declareVariable(param.name, param.position);
      }
      this.analyzeStatement(stmt.body);
      this.popScope();
    }
    analyzeClassDeclaration(stmt) {
      this.currentScope().variables.set(stmt.name, true);
      this.pushScope();
      for (const member of stmt.members) {
        if (member.type === "MethodDeclaration") {
          this.analyzeMethodDeclaration(member);
        } else {
          this.declareVariable(member.name, member.position);
        }
      }
      this.popScope();
    }
    analyzeMethodDeclaration(method) {
      this.pushScope();
      for (const param of method.parameters) {
        this.declareVariable(param.name, param.position);
      }
      this.analyzeStatement(method.body);
      this.popScope();
    }
    analyzeInterfaceDeclaration(stmt) {
      this.currentScope().variables.set(stmt.name, true);
    }
    analyzeExpression(expr) {
      switch (expr.type) {
        case "Identifier":
          this.analyzeIdentifier(expr);
          break;
        case "Literal":
          break;
        case "BinaryExpression":
          this.analyzeExpression(expr.left);
          this.analyzeExpression(expr.right);
          break;
        case "UnaryExpression":
          this.analyzeExpression(expr.argument);
          break;
        case "AssignmentExpression":
          this.analyzeAssignmentExpression(expr);
          break;
        case "CallExpression":
          this.analyzeExpression(expr.callee);
          for (const arg of expr.arguments) {
            this.analyzeExpression(arg);
          }
          break;
        case "MemberExpression":
          this.analyzeExpression(expr.object);
          break;
        case "NewExpression":
          for (const arg of expr.arguments) {
            this.analyzeExpression(arg);
          }
          break;
        case "SuperExpression":
          if (expr.arguments) {
            for (const arg of expr.arguments) {
              this.analyzeExpression(arg);
            }
          }
          break;
        case "LambdaExpression":
          this.analyzeLambdaExpression(expr);
          break;
        case "ArrayExpression":
          for (const elem of expr.elements) {
            this.analyzeExpression(elem);
          }
          break;
        case "ObjectExpression":
          for (const prop of expr.properties) {
            this.analyzeExpression(prop.value);
          }
          break;
        case "ConditionalExpression":
          this.analyzeExpression(expr.test);
          this.analyzeExpression(expr.consequent);
          this.analyzeExpression(expr.alternate);
          break;
      }
    }
    analyzeIdentifier(expr) {
      if (BUILTIN_KEYWORDS.includes(expr.name)) {
        return;
      }
      if (!this.variableExists(expr.name) && !this.functionExists(expr.name)) {
        throw new BetaError(
          `Ihh, variabel '${expr.name}' belum didefinisikan nih. Jangan sampai lupa deklarasi ya!`,
          expr.position
        );
      }
    }
    analyzeAssignmentExpression(expr) {
      this.analyzeExpression(expr.right);
      if (expr.left.type === "Identifier") {
        if (!this.variableExists(expr.left.name)) {
          throw new BetaError(
            `Waduh, '${expr.left.name}' belum ada. Deklarasi dulu sebelum diisi ya!`,
            expr.position
          );
        }
      } else if (expr.left.type === "MemberExpression") {
        this.analyzeExpression(expr.left.object);
      }
    }
    extractBindingNames(name) {
      if (!name.startsWith("{") && !name.startsWith("[")) return [name];
      const reserved = /* @__PURE__ */ new Set(["as", "dari"]);
      return Array.from(name.matchAll(/[A-Za-z_]\w*/g)).map((match) => match[0]).filter((item) => !reserved.has(item));
    }
    analyzeLambdaExpression(expr) {
      this.pushScope();
      for (const param of expr.parameters) {
        this.declareVariable(param.name, param.position);
      }
      if (typeof expr.body === "object" && "type" in expr.body && expr.body.type === "BlockStatement") {
        this.analyzeStatement(expr.body);
      } else if (expr.body && typeof expr.body === "object" && "type" in expr.body) {
        this.analyzeExpression(expr.body);
      }
      this.popScope();
    }
  };

  // ../../tmp/kilo/betascript-compiler-entry.ts
  var version = "1.1.0";
  function compile(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(source);
    const ast = parser.parse(tokens);
    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);
    const emitter = new JavaScriptEmitter();
    return emitter.emit(ast);
  }
  return __toCommonJS(betascript_compiler_entry_exports);
})();
