type Token = { type: string, rawValue: string };

type Identifier = Token & { type: 'identifier', value: string };
type TypeConstant = Token & { type: 'typeConstant', value: string };
type IntConstant = Token & { type: 'intConstant', value: number };
type UintConstant = Token & { type: 'uintConstant', value: number };
type FloatConstant = Token & { type: 'floatConstant', value: number };
type BoolConstant = Token & { type: 'boolConstant', value: boolean };

type ArrayExpression = {
  type: 'arrayExpression', array: Expression, index: Expression,
};

type MemberExpression = {
  type: 'memberExpression', object: Expression, index: Identifier, 
};

type CallExpression = {
  type: 'callExpression',
  callee: Expression | TypeConstant | null,
  arguments: Expression[],
};

type UpdateExpression = {
  type: 'updateExpression',
  operator: '--' | '++',
  prefix: boolean,
  argument: Expression, 
};

type UnaryExpression = {
  type: 'unaryExpression',
  operator: '+' | '-' | '!' | '~',
  argument: Expression,
};

type BinaryExpression = {
  type: 'binaryExpression',
  operator: '*' | '/' | '%' | '+' | '-' | '<<' | '>>' |
    '<' | '>' | '<=' | '>=' | '==' | '!=' | '&' | '^' | '|' |
    '&&' | '^^' | '||';
  left: Expression,
  right: Expression,
};

type ConditionalExpression = {
  type: 'conditionalExpression',
  test: Expression,
  consequent: Expression,
  alternate: Expression,
};

type AssignmentExpression = {
  type: 'assignmentExpression',
  operator: '=' | '*=' | '/=' | '%=' | '+=' | '-=' | '<<=' | '>>=' |
    '&=' | '^=' | '|=',
  left: UnaryExpression,
  right: Expression,
};

type SeqeunceExpression = {
  type: 'sequenceExpression',
  expressions: Expression[],
};

type PrimaryExpression = Identifier | IntConstant | UintConstant |
  FloatConstant | BoolConstant;
type PostfixExpression = PrimaryExpression | 
  ArrayExpression | MemberExpression | CallExpression | UpdateExpression;
type ConstantExpression = PrimaryExpression | PostfixExpression |
  UnaryExpression | BinaryExpression | ConditionalExpression;
type Expression = ConstantExpression | AssignmentExpression |
  SeqeunceExpression;

type StructSpecifier = {
  type: 'structSpecifier',
  name: string | null,
  declarations: StructDeclaration[],
};

type TypeExpression = TypeConstant;

type LayoutQualifierId = { name: string, value: number | null };
type TypeQualifier = {
  layout: LayoutQualifierId[],
  storage: string | null,
  interpolation: string | null,
  invariant: boolean | null,
};
type TypeSpecifier = {
  precision: string | null,
  valueType: TypeExpression,
  isArray: boolean,
  size: ConstantExpression | null,
};
type FullType = TypeQualifier & TypeSpecifier;
type StructDeclaration = FullType & {
  name: string,
};
type ParameterDeclaration = TypeSpecifier & {
  name: string,
  isConst: boolean,
  qualifier: null | 'in' | 'out' | 'inout',
};

type FunctionPrototype = {
  type: 'functionPrototype',
  name: string,
  returns: FullType,
  arguments: ParameterDeclaration[],
};

type InitDeclaration = {
  type: 'initDeclaration',
  valueType: FullType,
  name: string,
  value: null | Expression,
};

type InitDeclarationList = {
  type: 'initDeclarationList',
  declarations: InitDeclaration[],
};

type PrecisionDeclaration = {
  type: 'precisionDeclaration',
  precision: string,
  valueType: TypeExpression,
};

type TypeDeclaration = {
  type: 'typeDeclaration',
  valueType: TypeExpression,
};

type Declaration = FunctionPrototype | InitDeclaration |
  PrecisionDeclaration | TypeDeclaration;

type DeclarationStatement = {
  type: 'declarationStatement',
  declaration: Declaration,
};

type ExpressionStatement = {
  type: 'expressionStatement',
  expression: Expression | null,
};

type SelectionStatement = {
  type: 'selectionStatement',
  test: Expression,
  consequent: Expression,
  alternate: null | Expression,
};

type SwitchStatement = {
  type: 'switchStatement',
  test: Expression,
  statements: Statement[],
};

type CaseStatement = {
  type: 'caseStatement',
  isDefault: boolean,
  value: Expression,
};

type IterationStatement = {
  type: 'iterationStatement',
  iterationType: 'for' | 'while' | 'do while',
  init: Expression | null,
  test: Expression,
  loop: Expression | null,
  statements: Statement[],
};

type JumpStatement = {
  type: 'jumpStatement',
  iterationType: 'continue' | 'break' | 'return' | 'discard',
  value: Expression | null,
};

type CompoundStatement = {
  type: 'compoundStatement',
  statements: Statement[],
};

type Statement = DeclarationStatement | ExpressionStatement |
  SelectionStatement | SwitchStatement | CaseStatement |
  IterationStatement | JumpStatement |
  CompoundStatement;
