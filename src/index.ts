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
  let nextToken = tokenizer.next();
  while (nextToken != null) {
    match(nextToken, {
      in: () => result.push(state.type === 'vertex' ? 'attribute': 'varying'),
      out: () => state.type === 'vertex'
        ? result.push('varying')
        : grabFragColor(tokenizer, state),
      identifier: (token: Token) => {
        if (token.value === 'gl_FragColor' && state.fragColor) {
          result.push(state.fragColor);
        } else {
          result.push(token.value);
        }
      }
    })
    nextToken = tokenizer.next();
  }
  /*
  while (token = tokenizer.next()) {
    switch (token.type) {
      case 'in':
        result.push(type === 'vertex' ? 'attribute' : 'varying');
        break;
      case 'out': {
        if (type === 'vertex') {
          result.push('varying');
        } else {
          // We need to convert the following value to gl_FragColor.
          state = 'glFragColorPending';
        }
        break;
      }
      case 'identifier': {
        if (state === 'glFragColorPending') {
          scope['gl_FragColor'] = token.value;
        } else if (token.value === 'gl_FragColor') {
          result.push(scope['gl_FragColor'] || 'gl_FragColor');
        } else {
          result.push(token.value);
        }
        break;
      }
    }
    if (token.type === 'in') {
      result.push(type === 'vertex' ? 'attribute' : 'varying');
    }
    console.log(token.type, token.value);
  }
  */
}

function getFragColor(tokenizer: Lexer, state: State, result: string[]) {
}

function match(
  token: Token, patterns: { [key: string]: (token: Token) => any },
) {
  if (patterns[token.type] != null) return patterns[token.type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + token.value);
}
