import { Lexer, Token } from 'moo';
import tokenize from './tokenizer';

type Scope = { [key: string]: any };

class State {
  type: 'fragment' | 'vertex';
  scopes: Scope[] = [{}];
  buffer: Token[] = [];
  lexer: Lexer;
  fragColors: string[] = [];
  constructor(type: 'fragment' | 'vertex', lexer: Lexer) {
    this.type = type;
    this.lexer = lexer;
  }
  push(token: Token) {
    this.buffer.push(token);
  }
  next(outputWs: boolean = true): Token | undefined {
    if (this.buffer.length > 0) {
      return this.buffer.shift();
    }
    let token = this.lexer.next();
    if (token == null) return token;
    if (token.type === 'WS' || token.type === 'comment') {
      if (outputWs) this.output.push(token.value);
      return this.next(outputWs);
    }
    return token;
  }
}

function match<T>(
  state: State, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  let token = state.next();
  if (token == null && patterns['eof'] != null) {
    return patterns['eof'](token);
  }
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}

function pull(state: State, type: string) {
  let token = state.next();
  if (token == null) throw new Error('Unexpected end of input');
  if (token.type !== type) {
    throw new Error('Token error; expected ' + type + ' but received ' +
      token.type);
  }
  return token;
}

function pullIf<T>(
  state: State, type: string, then?: (token: Token) => T,
): T | false | true {
  let token = state.next();
  if (token == null) throw new Error('Unexpected end of input');
  if (token.type !== type) {
    state.push(token);
    return false;
  }
  if (then == null) return true;
  return then(token);
}

function peek(state: State) {
  let token = state.next();
  state.push(token);
  return token;
}

export default function convert(code: string, type: 'fragment' | 'vertex') {
  let tokenizer = tokenize(code);
  let state = new State(type, tokenizer);
  return main(state);
}

function main(state: State, output: string[] = []) {
  while (match(state, {
    in: () => output.push(
      state.type === 'vertex' ? 'attribute' : 'varying'),
    out: () => state.type === 'vertex' ? output.push('varying')
      : getFragColor(state, output),
    identifier: (token: Token) => {
      let fragColorIndex = state.fragColors.indexOf(token.value);
      if (fragColorIndex !== -1) {
        output.push(fragColorIndex === 0
          ? 'gl_FragColor'
          : `gl_FragData[${fragColorIndex}]`);
      } else if (token.value === 'texture') {
        output.push(token.value);
        // convertTexture(state);
      } else {
        output.push(token.value);
      }
    },
    leftBrace: (token: Token) => {
      output.push(token.value);
      state.scopes.push({});
    },
    rightBrace: (token: Token) => {
      output.push(token.value);
      if (state.scopes.length <= 1) {
        throw new Error('Unmatched braces');
      }
      state.scopes.pop();
    },
    type: (token: Token) => {
      switch (token.value) {
        case 'sampler2D':
        case 'samplerCube':
          state.push(token);
          getVarDecl(state, output);
          break;
        default:
          output.push(token.value);
          break;
      }
    },
    pragma: (token: Token) => {
      let keyword = /^\s*#([a-zA-Z_0-9]+)\s+(.+)$/.exec(token.value);
      if (keyword == null) {
        output.push(token.value);
      } else if (keyword[1] === 'version') {
        output.push('\n#version 100 es');
      } else {
        output.push(token.value);
      }
    },
    otherwise: (token: Token) => output.push(token.value),
    eof: () => true,
  }) !== true);
  console.log(output.join(''));
  return output;
}

function getFragColor(state: State, output: string[]) {
  pullIf(state, 'precisionIdentifier');
  pull(state, 'type');
  let name = pull(state, 'identifier');
  state.fragColors.push(name.value);
  while (true) {
    let token = state.next();
    if (token == null || token.type === 'semicolon') break;
  }
}

function getVarDecl(state: State, output: string[]) {
  let type = pull(state, 'type');
  output.push(type.value);
  let name = pull(state, 'identifier');
  output.push(name.value);
  while (true) {
    let token = state.next();
    output.push(token.value);
    if (token == null || token.type === 'semicolon') break;
  }
  state.scopes[state.scopes.length - 1][name.value] = type.value;
}

function convertTexture(state: State, output: string[]) {
  let outputBuf = [];
  let name = pull(state, 'identifier');
  outputBuf.push(name.value);
  outputBuf.push(pull(state, 'leftParen').value);
  parseArg(state, outputBuf);
} 

function parseArg(state: State, output: string[]) {

}
