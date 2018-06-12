import { Lexer, Token } from 'moo';
import * as Tokens from './token';
import tokenize from './tokenizer';

const IGNORE_TOKENS = ['WS', 'NL', 'comment', 'pragma'];

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
    while (true) {
      let token = this.lexer.next();
      if (token == null || !IGNORE_TOKENS.includes(token.type)) return token;
    }
  }
}

function match<T>(
  state: State, patterns: { [key: string]: (token: Token) => T | any },
): T | any {
  let token = state.next();
  let type = token == null ? 'eof' : token.type;
  if (patterns[type] != null) return patterns[type](token);
  if (patterns['otherwise'] != null) return patterns['otherwise'](token);
  throw new Error('Unexpected token ' + (token == null ? type : token.value));
}

function pull(state: State, type: string | string[]) {
  let token = state.next();
  if (token == null) throw new Error('Unexpected end of input');
  if (Array.isArray(type) ? !type.includes(token.type) : token.type !== type) {
    throw new Error('Token error; expected ' + type + ' but received ' +
      token.type);
  }
  return token;
}

function pullIf(state: State, type: string | string[]): Token | null;
function pullIf<T>(
  state: State, type: string | string[], then: (token: Token) => T,
): T | null;

function pullIf<T>(
  state: State, type: string | string[], then?: (token: Token) => T,
): T | Token | null {
  let token = state.next();
  let tokenType = token == null ? 'eof' : token.type;
  if (Array.isArray(type) ? !type.includes(tokenType) : tokenType !== type) {
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

export default function parse(
  code: string, entry: (state: State) => any = main,
) {
  let tokenizer = tokenize(code);
  let state = new State(tokenizer);
  return entry(state);
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

function primaryConstantExpression(state: State): Tokens.Expression {
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
    type: (token: Token) => {
      let type = constantToken<Tokens.TypeConstant>(
        'typeConstant', token.value, token);
      pull(state, 'leftParen');
      let args: Tokens.Expression[] = [];
      do {
        if (pullIf(state, 'void')) break;
        args.push(constantExpression(state));
      } while (pullIf(state, 'comma'));
      pull(state, 'rightParen');
      return {
        type: 'callExpression',
        callee: type,
        arguments: args,
      };
    }
  });
}

function primaryExpression(state: State): Tokens.Expression {
  if (pullIf(state, 'leftParen')) {
    let value = expression(state);
    pull(state, 'rightParen');
    return value;
  }
  return primaryConstantExpression(state);
}

function postfixExpression(state: State): Tokens.Expression {
  let expression: Tokens.Expression = primaryExpression(state);
  const next = (): Tokens.Expression => match(state, {
    leftBracket: () => {
      let value = constantExpression(state);
      pull(state, 'rightBracket');
      expression = {
        type: 'arrayExpression',
        array: expression,
        index: value,
      };
      return next();
    },
    leftParen: () => {
      let args: Tokens.Expression[] = [];
      do {
        if (pullIf(state, 'void')) break;
        args.push(constantExpression(state));
      } while (pullIf(state, 'comma'));
      pull(state, 'rightParen');
      expression = {
        type: 'callExpression',
        callee: expression,
        arguments: args,
      };
      return next();
    },
    period: () => {
      let value = primaryConstantExpression(state);
      expression = {
        type: 'memberExpression',
        object: expression,
        index: value,
      };
      return next();
    },
    incOp: () => {
      expression = {
        type: 'updateExpression',
        operator: '++',
        prefix: false,
        argument: expression,
      };
      return next();
    },
    decOp: () => {
      expression = {
        type: 'updateExpression',
        operator: '--',
        prefix: false,
        argument: expression,
      };
      return next();
    },
    otherwise: (token: Token) => {
      state.push(token);
      return expression;
    },
  });
  return next();
}

function unaryExpression(state: State): Tokens.Expression {
  let token = state.next();
  if (token == null) throw new Error('Unexpected EOF');
  switch (token.type) {
    case 'incOp':
    case 'decOp':
      return {
        type: 'updateExpression',
        operator: token.value,
        prefix: true,
        argument: postfixExpression(state),
      };
    case 'plus':
    case 'dash':
    case 'bang':
    case 'tlide':
      return {
        type: 'unaryExpression',
        operator: token.value,
        argument: postfixExpression(state),
      };
    default:
      state.push(token);
      return postfixExpression(state);
  }
}

const BINARY_TABLE = [
  ['orOp'],
  ['xorOp'],
  ['andOp'],
  ['verticalBar'],
  ['caret'],
  ['ampersand'],
  ['eqOp', 'neOp'],
  ['leftAngle', 'rightAngle', 'leOp', 'geOp'],
  ['leftOp', 'rightOp'],
  ['plus', 'dash'],
  ['star', 'slash', 'percent'],
];

function binaryExpression(state: State): Tokens.Expression {
  return handleBinaryExpr(state);
}

function handleBinaryExpr(state: State, depth: number = 0): Tokens.Expression {
  if (BINARY_TABLE[depth] == null) return unaryExpression(state);
  let left = handleBinaryExpr(state, depth + 1);
  let op = pullIf(state, BINARY_TABLE[depth], (token: Token) => token.value);
  if (op != null) {
    let right = handleBinaryExpr(state, depth);
    return {
      type: 'binaryExpression',
      operator: op,
      left,
      right,
    };
  }
  return left;
}

function conditionalExpression(state: State): Tokens.Expression {
  let test = binaryExpression(state);
  if (!pullIf(state, 'question')) return test;
  let consequent = binaryExpression(state);
  pullIf(state, 'colon');
  let alternate = binaryExpression(state);
  return {
    type: 'conditionalExpression',
    test,
    consequent,
    alternate,
  };
}

function constantExpression(state: State): Tokens.Expression {
  return conditionalExpression(state);
}

const ASSIGNMENT_TABLE = ['equal', 'mulAssign', 'divAssign', 'addAssign',
  'modAssign', 'leftAssign', 'rightAssign', 'andAssign', 'xorAssign',
  'orAssign', 'subAssign'];

function assignmentExpression(state: State): Tokens.Expression {
  let left = conditionalExpression(state);
  let op = pullIf(state, ASSIGNMENT_TABLE, (token: Token) => token.value);
  if (op == null) return left;
  let right = assignmentExpression(state);
  return {
    type: 'assignmentExpression',
    operator: op,
    left,
    right,
  };
}

export function expression(state: State): Tokens.Expression {
  let exprs = [];
  do {
    exprs.push(assignmentExpression(state));
  } while (pullIf(state, 'comma'));
  if (exprs.length === 1) return exprs[0];
  return {
    type: 'sequenceExpression',
    expressions: exprs,
  };
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
    while (pullIf(state, 'comma')) {
      declarations.push({
        ...qualifier,
        ...specifier,
        name: pull(state, 'identifier').value,
      });
    }
    pull(state, 'semicolon');
  } while (pullIf(state, 'rightBrace'));
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
