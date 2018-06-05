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

function typeSpecifier(state: State): Tokens.TypeSpecifier {
  let precision = pullIf(state, 'precisionQualifier',
    (token: Token) => token.value);
  
}

function typeSpecifierType(state: State): Tokens.TypeExpression {
  return match<Tokens.TypeExpression>(state, {
    type: (token: Token) =>
      constantToken<Tokens.TypeConstant>('typeConstant', token.value, token),
    struct: () => structType(state),
    identifier: (token: Token) =>
      constantToken<Tokens.Identifier>('identifier', token.value, token),
  });
}

function structType(state: State): Tokens.StructSpecifier {
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

/*
storage_qualifier
layout_qualifier
layout_qualifier storage_qualifier
interpolation_qualifier storage_qualifier
interpolation_qualifier
invariant_qualifier storage_qualifier
invariant_qualifier interpolation_qualifier storage_qualifier
*/
function typeQualifier(state: State): Tokens.TypeQualifier {
  
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
