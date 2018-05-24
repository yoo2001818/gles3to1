import { Lexer, Token } from 'moo';
import tokenize from './tokenizer';

type Scope = { [key: string]: any };

class State {
  type: 'fragment' | 'vertex';
  scopes: Scope[] = [{}];
  buffer: Token[] = [];
  lexer: Lexer;
  output: string[] = [];
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
    if (token.type === 'WS') {
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
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}

function pull(state: State, type: string) {
  let token = state.next();
  if (token.type !== type) {
    throw new Error('Token error; expected ' + type + ' but received ' +
      token.type);
  }
  return token;
}

function pullIf<T>(
  state: State, type: string, then: (token: Token) => T,
): T | false {
  let token = state.next();
  if (token.type !== type) {
    state.push(token);
    return false;
  }
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
  main(state);
  return state.output;
}

function main(state: State) {
  while (match(state, {
    in: () => state.output.push(
      state.type === 'vertex' ? 'attribute' : 'varying'),
    out: () => state.type === 'vertex' ? state.output.push('varying')
      : getFragColor(state),
    identifier: (token: Token) => {
      let fragColorIndex = state.fragColors.indexOf(token.value);
      if (fragColorIndex !== -1) {
        state.output.push(state.fragColors[fragColorIndex]);
      } else if (token.value === 'texture') {
        state.push(token);
        convertTexture(state);
      } else {
        state.output.push(token.value);
      }
    },
    leftBrace: (token: Token) => {
      state.output.push(token.value);
      state.scopes.push({});
    },
    rightBrace: (token: Token) => {
      state.output.push(token.value);
      if (state.scopes.length <= 1) {
        throw new Error('Unmatched braces');
      }
      state.scopes.pop();
    },
    type: (token: Token) => {
      switch (token.value) {
        case 'sampler2D':
        case 'samplerCube':
          state.output.push(token.value);
          getVarDecl(token);
          break;
        default:
          state.output.push(token.value);
          break;
      }
    },
    pragma: (token: Token) => {
      let keyword = /^\s*#([a-zA-Z_0-9]+)\s+(.+)$/.exec(token.value);
      if (keyword == null) {
        state.output.push(token.value);
      } else if (keyword[1] === 'version') {
        state.output.push('\n#version 100 es');
      } else {
        state.output.push(token.value);
      }
    },
    otherwise: (token: Token) => state.output.push(token.value),
  }) !== false);
  console.log(result.join(''));
}

function getFragColor(tokenizer: Lexer, state: State, result: string[]) {
  let token = tokenizer.next();
  while (token != null) {
    let doContinue = true;
    match(token, {
      precisionIdentifier: () => {},
      type: () => {},
      WS: () => {},
      comment: () => {},
      identifier: (token: Token) => {
        state.fragColor = token.value;
      },
      semicolon: () => doContinue = false,
    });
    if (!doContinue) break;
    token = tokenizer.next();
  }
}

function getVarDecl(
  typeToken: Token, tokenizer: Lexer, state: State, result: string[],
) {
  let typeName = typeToken.value;
  let name: string | null = null;
  let token = tokenizer.next();
  while (token != null) {
    let doContinue = true;
    result.push(token.value);
    match(token, {
      precisionIdentifier: () => {},
      type: () => {},
      WS: () => {},
      comment: () => {},
      identifier: (token: Token) => {
        name = token.value;
      },
      semicolon: () => doContinue = false,
    });
    if (!doContinue) {
      if (name == null) {
        throw new Error('VariatypeTokeble declaration name must be specified')
      }
      let scope = statfunction match<T>(
  token: Token, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}
.scopes[state.scopes.length - 1];
      scope[name] = tyfunction match<T>(
  token: Token, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}
eName;
      console.log(scopfunction match<T>(
  token: Token, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}
);
      break;
    }
    token = tokenizer.next();
  }
}

function convertTexture(
  funcToken: Token, tokenizer: Lexer, state: State, result: string[],
) {
  let buffer: string[] = [];
  // texture(abc, def)
  // Wouldn't it be better to use actual parser?
  let token = tokenizer.next();
  let depth = 1;
  let args: string[] = [];
  while (token != null) {
    let doContinue = true;
    buffer.push(token.value);
    match(token, {
      WS: () => {},
      leftParen: () => {
        depth += 1;
      },
      rightParen: () => {
        depth -= 1;
        if (depth <= 0) doContinue = false;
      },
      comma: () => {
      },
      identifier: (token: Token) => {
        args.push(token.value);
      },
    });
    if (!doContinue) break;
    token = tokenizer.next();
  }
}
