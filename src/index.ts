import { Lexer, Token } from 'moo';
import tokenize from './tokenizer';

type Scope = { [key: string]: any };
interface State {
  type: 'fragment' | 'vertex';
  scopes: Scope[];
  fragColor?: string;
}

export default function convert(code: string, type: 'fragment' | 'vertex') {
  let result: string[] = [];
  let tokenizer = tokenize(code);
  main(tokenizer, { type, scopes: [{}] }, result);
  return result;
}

function main(tokenizer: Lexer, state: State, result: string[]) {
  let token = tokenizer.next();
  while (token != null) {
    match(token, {
      in: () => result.push(state.type === 'vertex' ? 'attribute': 'varying'),
      out: () => state.type === 'vertex'
        ? result.push('varying')
        : getFragColor(tokenizer, state, result),
      identifier: (token: Token) => {
        if (state.fragColor != null && state.fragColor === token.value) {
          result.push('gl_FragColor');
        } else if (token.value === 'texture') {
          convertTexture(token, tokenizer, state, result);
        } else {
          result.push(token.value);
        }
      },
      leftBrace: (token: Token) => {
        result.push(token.value);
        state.scopes.push({});
      },
      rightBrace: (token: Token) => {
        result.push(token.value);
        if (state.scopes.length <= 1) {
          throw new Error('Unmatched braces');
        }
        state.scopes.pop();
      },
      type: (token: Token) => {
        switch (token.value) {
          case 'sampler2D':
          case 'samplerCube':
            result.push(token.value);
            getVarDecl(token, tokenizer, state, result);
            break;
          default:
            result.push(token.value);
            break;
        }
      },
      pragma: (token: Token) => {
        let keyword = /^\s*#([a-zA-Z_0-9]+)\s+(.+)$/.exec(token.value);
        if (keyword == null) {
          result.push(token.value);
        } else if (keyword[1] === 'version') {
          result.push('\n#version 100 es');
        } else {
          result.push(token.value);
        }
      },
      otherwise: (token: Token) => result.push(token.value),
    });
    token = tokenizer.next();
  }
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
      let scope = state.scopes[state.scopes.length - 1];
      scope[name] = typeName;
      console.log(scope);
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

function match<T>(
  token: Token, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}
