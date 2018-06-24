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
  push(token: Token | Token[]) {
    if (Array.isArray(token)) {
      this.buffer.push.apply(this.buffer, token);
    } else {
      this.buffer.push(token);
    }
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
  nextList(size: number): Token[] {
    let output: Token[] = [];
    for (let i = 0; i < size; ++i) {
      output.push(this.next());
    }
    return output;
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

function peekList(state: State, size: number) {
  let list = state.nextList(size);
  state.push(list);
  return list;
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

function statement(state: State): Tokens.Statement {
  let tokens = peekList(state, 2);
  let type = tokens[0].type;
  if (type === 'leftBrace') {
    return compoundStatement(state);
  } else if (['in', 'out', 'inout', 'struct', 'const', 'centroid', 'uniform',
    'layout', 'invariant'].includes(type)
  ) {
    return declarationStatement(state);
  } else if (['identifier', 'intConstant', 'floatConstant', 'boolConstant',
    'leftParen', 'bang', 'dash', 'tlide', 'plus'].includes(type)
  ) {
    return expressionStatement(state);
  } else if (type === 'type') {
    if (tokens[1].type === 'leftParen') return expressionStatement(state);
    else return declarationStatement(state);
  } else if (type === 'identifier') {
    if (tokens[1].type !== 'identifier') return expressionStatement(state);
    else return declarationStatement(state);
  } else if (type === 'if') {
    return selectionStatement(state);
  } else if (type === 'for' || type === 'while' || type === 'do') {
    // Iteration
  } else if (type === 'switch') {
    // Switch
  } else if (type === 'case' || type === 'default') {
    // Case
  } else if (['continue', 'break', 'return', 'discard'].includes(type)) {
    // Jump
  }
}

function selectionStatement(state: State): Tokens.SelectionStatement {
  pull(state, 'if');
  pull(state, 'leftParen');
  const test = expression(state);
  pull(state, 'rightParen');
  const consequent = statement(state);
  let alternate = null;
  if (pullIf(state, 'else')) alternate = statement(state);
  return {
    type: 'selectionStatement',
    test,
    consequent,
    alternate,
  };
}

function compoundStatement(state: State): Tokens.CompoundStatement {
  pull(state, 'leftBrace');
  let list: Tokens.Statement[] = [];
  do {
    list.push(statement(state));
  } while (peek(state).type === 'rightBrace');
  pull(state, 'rightBrace');
  return {
    type: 'compoundStatement',
    statements: list,
  };
}

function declarationStatement(state: State): Tokens.DeclarationStatement {
  return {
    type: 'declarationStatement',
    declaration: declaration(state),
  };
}

function declaration(state: State): Tokens.ExternalDeclaration {
  // Detect precision for precision qualifiers
  if (pullIf(state, 'precision')) {
    let precision = pull(state, 'precisionQualifier').value;
    let type = typeSpecifierType(state);
    return {
      type: 'precisionDeclaration', precision, valueType: type,
    };
  }
  // Qualifier - can be empty
  let qualifier = typeQualifier(state);
  // Specifier - can be empty
  let specifier: Tokens.TypeSpecifier = {
    precision: null, valueType: null, isArray: false, size: null,
  };
  if (peek(state).type !== 'leftParen') {
    specifier = typeSpecifier(state);
  }
  match(state, {
    identifier: (token: Token) => {
      if (pullIf(state, 'leftParen')) {
        // function_prototype
        let name = token.value;
        let args: Tokens.ParameterDeclaration[] = [];
        do {
          let isConst = !!pullIf(state, 'const');
          let qualifier = pullIf(state, ['in', 'out', 'inout'],
            (v: Token) => v.value as 'in' | 'out' | 'inout');
          let specifier = typeSpecifier(state);
          let argName = pull(state, 'identifier').value;
          if (pullIf(state, 'leftBracket')) {
            if (specifier.isArray) {
              throw new Error('2D array is not supported');
            }
            specifier.isArray = true;
            specifier.size = constantExpression(state);
            pull(state, 'rightBracket');
          }
          args.push({
            name: argName,
            isConst,
            qualifier,
            ...specifier,
          });
        } while (pullIf(state, 'comma'));
        pull(state, 'rightParen');
        return {
          type: 'functionPrototype',
          name,
          returns: { ...specifier, ...qualifier },
          arguments: args,
        };
      }
      state.push(token);
      let list: Tokens.InitDeclaration[] = [];
      do {
        let name = pull(state, 'identifier').value;
        let type = { ...qualifier, ...specifier };
        if (pullIf(state, 'leftBracket')) {
          if (!pullIf(state, 'rightBracket')) {
            type.size = constantExpression(state);
          } else {
            type.size = null;
          }
          if (type.isArray) {
            throw new Error('2D Array is not supported');
          }
          type.isArray = true;
        }
        let value = null;
        match(state, {
          equal: () => {
            value = assignmentExpression(state);
          },
          otherwise: (token) => {
            state.push(token);
          },
        });
        list.push({
          type: 'initDeclaration',
          valueType: type,
          name,
          value,
        });
      } while (pullIf(state, 'comma'));
      pull(state, 'semicolon');
      return {
        type: 'initDeclarationList',
        declarations: list,
      }
    },
    leftBrace: (token: Token) => {
      if (specifier.isArray) throw new Error('Unexpected array specifier');
      state.push(token);
      if (specifier.valueType.type !== 'identifier') {
        throw new Error('Specifier must be identifier');
      }
      let declarations = structDeclarations(state);
      let valueType: Tokens.FullType = {
        ...qualifier,
        precision: null,
        valueType: {
          type: 'structSpecifier',
          name: specifier.valueType.type,
          declarations,
        },
        isArray: false,
        size: null,
      };
      let name = pullIf(state, 'identifier', (token: Token) => token.value);
      if (pullIf(state, 'leftBracket')) {
        if (valueType.isArray) {
          throw new Error('2D Array is not supported');
        }
        valueType.isArray = true;
        if (!pullIf(state, 'rightBracket')) {
          valueType.size = constantExpression(state);
        } else {
          valueType.size = null;
        }
      }
      return {
        type: 'initDeclaration',
        valueType,
        name,
        value: null,
      };
    },
    semicolon: () => {
      return {
        type: 'typeDeclaration',
        valueType: specifier.valueType,
      };
    },
  });
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

function expressionStatement(state: State): Tokens.ExpressionStatement {
  const expr = expression(state);
  pull(state, 'semicolon');
  return {
    type: 'expressionStatement',
    expression: expr,
  };
}

function typeSpecifier(state: State): Tokens.TypeSpecifier {
  let precision = pullIf(state, 'precisionQualifier',
    (token: Token) => token.value);
  let valueType = typeSpecifierType(state);
  let isArray = false;
  let size = null;
  if (pullIf(state, 'leftBracket')) {
    isArray = true;
    if (peek(state).type !== 'rightBracket') {
      size = constantExpression(state);
    }
    pull(state, 'rightBracket');
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
  let declarations = structDeclarations(state);
  return {
    type: 'structSpecifier',
    name,
    declarations,
  };
}

function structDeclarations(state: State): Tokens.StructDeclaration[] {
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
  return declarations;
}

function typeQualifier(state: State): Tokens.TypeQualifier {
  let layout: Tokens.LayoutQualifierId[] = null;
  let storage: string | null = null;
  let interpolation: string | null = null;
  let invariant: boolean = false;
  if (pullIf(state, 'layout')) {
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
