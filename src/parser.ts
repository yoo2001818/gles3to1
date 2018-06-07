import { Lexer, Token } from 'moo';
import * as Tokens from './token';
import tokenize from './tokenizer';

class State {
  buffer: Token[] = [];
  lexer: Lexer;
  fragColors: string[] = [];
  constructor(lexer: Lexer) {
    this.lexer = lexer;
  }
  push(token: Token) {
    this.buffer.push(token);
  }
  next(): Token | undefined {
    if (this.buffer.length > 0) {
      return this.buffer.shift();
    }
    let token = this.lexer.next();
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

function pullIf(state: State, type: string): Token | null;
function pullIf<T>(
  state: State, type: string, then: (token: Token) => T,
): T | null;

function pullIf<T>(
  state: State, type: string, then?: (token: Token) => T,
): T | Token | null {
  let token = state.next();
  if (token == null) throw new Error('Unexpected end of input');
  if (token.type !== type) {
    state.push(token);
    return null;
  }
  if (then == null) return token;
  return then(token);
}

function peek(state: State) {
  let token = state.next();
  state.push(token);
  return token;
}

export default function parse(code: string) {
  let tokenizer = tokenize(code);
  let state = new State(tokenizer);
  return main(state);
}

function main(state: State): Tokens.File {
  let output: Tokens.ExternalDeclaration[] = [];
  // Function prototype
  // Variable delcaration
  // Type declaration
  while (match(state, {
    otherwise: (token: Token) => {},
    eof: () => true,
  }) !== true);
  return output;
}

/*
function_prototype SEMICOLON
init_declarator_list SEMICOLON
PRECISION precision_qualifier type_specifier_no_prec SEMICOLON
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE SEMICOLON
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE
IDENTIFIER SEMICOLON
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE
IDENTIFIER LEFT_BRACKET constant_expression RIGHT_BRACKET SEMICOLON
type_qualifier SEMICOLON
*/
function declaration(state: State): Tokens.ExternalDeclaration {
}

function primaryExpression(state: State): Tokens.Expression {
  return match(state, {
    identifier: (token: Token) => constantToken<Tokens.Identifier>(
      'identifier', token.value, token),
    intConstant: (token: Token) => constantToken<Tokens.IntConstant>(
      'intConstant', parseInt(token.value, 10), token),
    floatConstant: (token: Token) => constantToken<Tokens.FloatConstant>(
      'floatConstant', parseFloat(token.value), token),
    'true': (token: Token) => constantToken<Tokens.BoolConstant>(
      'boolConstant', true, token),
    'false': (token: Token) => constantToken<Tokens.BoolConstant>(
      'boolConstant', false, token),
  });
}

function postfixExpression(state: State): Tokens.Expression {
  let expression = primaryExpression(state);
  return expression;
}

const UPDATE_TABLE = { incOp: '--' as '--', decOp: '++' as '++' };
const UNARY_TABLE = {
  plus: '+' as '+',
  dash: '-' as '-',
  bang: '!' as '!',
  tlide: '~' as '~',
};

function unaryExpression(state: State): Tokens.Expression {
  let token = state.next();
  switch (token.type) {
    case 'incOp':
    case 'decOp':
      return {
        type: 'updateExpression',
        operator: UPDATE_TABLE[token.type],
        prefix: false,
        argument: postfixExpression(state),
      };
    case 'plus':
    case 'dash':
    case 'bang':
    case 'tlide':
      return {
        type: 'unaryExpression',
        operator: UNARY_TABLE[token.type],
        argument: postfixExpression(state),
      };
    default:
      state.push(token);
      return postfixExpression(state);
  }
}

function constantExpression(state: State): Tokens.ConstantExpression {
  // TODO Nooo
}

function typeSpecifier(state: State): Tokens.TypeSpecifier {
  let precision = pullIf(state, 'precisionQualifier',
    (token: Token) => token.value);
  let valueType = typeSpecifierType(state);
  let isArray = false;
  let size = null;
  if (pullIf(state, 'leftBrace')) {
    isArray = true;
    if (peek(state).type !== 'rightBrace') {
      size = constantExpression(state);
    }
    pull(state, 'rightBrace');
  }
  return { precision, valueType, isArray, size };
}

function typeSpecifierType(state: State): Tokens.TypeExpression {
  return match<Tokens.TypeExpression>(state, {
    type: (token: Token) =>
      constantToken<Tokens.TypeConstant>('typeConstant', token.value, token),
    struct: (token: Token) => {
      state.push(token);
      return structType(state);
    },
    identifier: (token: Token) =>
      constantToken<Tokens.Identifier>('identifier', token.value, token),
  });
}

function structType(state: State): Tokens.StructSpecifier {
  pull(state, 'struct');
  let name: string | null =
    pullIf(state, 'identifier', (token: Token) => token.value);
  pull(state, 'leftBrace');
  let declarations: Tokens.StructDeclaration[] = [];
  do {
    let qualifier = typeQualifier(state);
    let specifier = typeSpecifier(state);
    let name = pull(state, 'identifier').value;
    // TODO Parse array
    declarations.push({ ...qualifier, ...specifier, name });
    while (peek(state).type === 'comma') {
      declarations.push({
        ...qualifier,
        ...specifier,
        name: pull(state, 'identifier').value,
      });
    }
    pull(state, 'semicolon');
  } while (peek(state).type !== 'rightBrace');
  return {
    type: 'structSpecifier',
    name,
    declarations,
  };
}

function typeQualifier(state: State): Tokens.TypeQualifier {
  let layout: Tokens.LayoutQualifierId[] = null;
  let storage: string | null = null;
  let interpolation: string | null = null;
  let invariant: boolean = false;
  if (peek(state).type === 'leftParen') {
    layout = layoutQualifier(state);
  }
  invariant = !!pullIf(state, 'invariant');
  interpolation = pullIf(state, 'interpolationQualifier',
    (token: Token) => token.value);
  if (['const', 'in', 'out', 'centroid', 'uniform']
    .includes(peek(state).type)
  ) {
    storage = storageQualifier(state);
  }
  return { layout, storage, interpolation, invariant };
}

function layoutQualifier(state: State): Tokens.LayoutQualifierId[] {
  // identifier, identifier = constant
  let qualifiers: Tokens.LayoutQualifierId[] = [];
  pull(state, 'leftParen');
  do {
    let name = pull(state, 'identifier').value;
    let value = null;
    if (pullIf(state, 'equal')) {
      value = parseInt(pull(state, 'intConstant').value, 10);
    }
    qualifiers.push({ name, value });
  } while (pullIf(state, 'comma'));
  pull(state, 'rightParen');
  return qualifiers;
}

function storageQualifier(state: State): string {
  return match(state, {
    const: () => 'const',
    in: () => 'in',
    out: () => 'out',
    uniform: () => 'uniform',
    centroid: () => match(state, {
      in: () => 'centroid in',
      out: () => 'centroid out',
    }),
  });
}

function constantToken<B extends { type: any, value: any }>(
  type: B['type'], value: B['value'], token: Token,
) {
  return {
    type,
    value,
    startPos: token.offset,
    endPos: token.offset + token.text.length,
    rawValue: token.text,
  };
}
