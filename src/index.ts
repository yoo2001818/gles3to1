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
        } else {
          result.push(token.value);
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
        console.log(token.value);
      },
      semicolon: () => doContinue = false,
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
