export type Block = { type: string, /* startPos: number, endPos: number */ };
export type Token = Block & { rawValue: string };

export type Identifier = Token & { type: 'identifier', value: string };
export type TypeConstant = Token & { type: 'typeConstant', value: string };
export type IntConstant = Token & { type: 'intConstant', value: number };
export type UintConstant = Token & { type: 'uintConstant', value: number };
export type FloatConstant = Token & { type: 'floatConstant', value: number };
export type BoolConstant = Token & { type: 'boolConstant', value: boolean };

export type ArrayExpression = Block & {
  type: 'arrayExpression', array: Expression, index: Expression,
};

export type MemberExpression = Block & {
  type: 'memberExpression', object: Expression, index: Expression, 
};

export type CallExpression = Block & {
  type: 'callExpression',
  callee: Expression | TypeConstant | null,
  arguments: Expression[],
};

export type UpdateExpression = Block & {
  type: 'updateExpression',
  operator: string,
  prefix: boolean,
  argument: Expression, 
};

export type UnaryExpression = Block & {
  type: 'unaryExpression',
  operator: string,
  argument: Expression,
};

export type BinaryExpression = Block & {
  type: 'binaryExpression',
  operator: string,
  left: Expression,
  right: Expression,
};

export type ConditionalExpression = Block & {
  type: 'conditionalExpression',
  test: Expression,
  consequent: Expression,
  alternate: Expression,
};

export type AssignmentExpression = Block & {
  type: 'assignmentExpression',
  operator: string,
  left: Expression,
  right: Expression,
};

export type SeqeunceExpression = Block & {
  type: 'sequenceExpression',
  expressions: Expression[],
};

export type PrimaryExpression = Identifier | IntConstant | UintConstant |
  FloatConstant | BoolConstant;
export type PostfixExpression = PrimaryExpression | 
  ArrayExpression | MemberExpression | CallExpression | UpdateExpression;
export type ConstantExpression = PrimaryExpression | PostfixExpression |
  UnaryExpression | BinaryExpression | ConditionalExpression;
export type Expression = ConstantExpression | AssignmentExpression |
  SeqeunceExpression;

export type StructSpecifier = Block & {
  type: 'structSpecifier',
  name: string | null,
  declarations: StructDeclaration[],
};

export type TypeExpression = TypeConstant | Identifier | StructSpecifier;

export type LayoutQualifierId = { name: string, value: number | null };
export type TypeQualifier = {
  layout: LayoutQualifierId[],
  storage: string | null,
  interpolation: string | null,
  invariant: boolean | null,
};
export type TypeSpecifier = {
  precision: string | null,
  valueType: TypeExpression,
  isArray: boolean,
  size: Expression | null,
};
export type FullType = TypeQualifier & TypeSpecifier;
export type StructDeclaration = FullType & {
  name: string,
};
export type ParameterDeclaration = TypeSpecifier & {
  name: string,
  isConst: boolean,
  qualifier: null | 'in' | 'out' | 'inout',
};

export type FunctionPrototype = Block & {
  type: 'functionPrototype',
  name: string,
  returns: FullType,
  arguments: ParameterDeclaration[],
};

export type InitDeclaration = Block & {
  type: 'initDeclaration',
  valueType: FullType,
  name: string,
  value: null | Expression,
};

export type InitDeclarationList = Block & {
  type: 'initDeclarationList',
  declarations: InitDeclaration[],
};

export type PrecisionDeclaration = Block & {
  type: 'precisionDeclaration',
  precision: string,
  valueType: TypeExpression,
};

export type TypeDeclaration = Block & {
  type: 'typeDeclaration',
  valueType: TypeExpression,
};

export type Declaration = FunctionPrototype | InitDeclaration |
  PrecisionDeclaration | TypeDeclaration;

export type DeclarationStatement = Block & {
  type: 'declarationStatement',
  declaration: ExternalDeclaration,
};

export type ExpressionStatement = Block & {
  type: 'expressionStatement',
  expression: Expression | null,
};

export type SelectionStatement = Block & {
  type: 'selectionStatement',
  test: Expression,
  consequent: Statement,
  alternate: null | Statement,
};

export type SwitchStatement = Block & {
  type: 'switchStatement',
  test: Expression,
  statements: Statement[],
};

export type CaseStatement = Block & {
  type: 'caseStatement',
  isDefault: boolean,
  value: Expression,
};

export type IterationStatement = Block & {
  type: 'iterationStatement',
  iterationType: 'for' | 'while' | 'do while',
  init: DeclarationStatement | ExpressionStatement | null,
  test: Expression,
  loop: Expression | null,
  statement: Statement,
};

export type JumpStatement = Block & {
  type: 'jumpStatement',
  iterationType: 'continue' | 'break' | 'return' | 'discard',
  value: Expression | null,
};

export type CompoundStatement = Block & {
  type: 'compoundStatement',
  statements: Statement[],
};

export type Statement = DeclarationStatement | ExpressionStatement |
  SelectionStatement | SwitchStatement | CaseStatement |
  IterationStatement | JumpStatement |
  CompoundStatement;

export type FunctionDeclaration = Block & {
  type: 'functionDeclaration',
  name: string,
  returns: FullType,
  arguments: ParameterDeclaration[],
  statement: CompoundStatement,
};

export type ExternalDeclaration = Declaration | FunctionDeclaration;

export type File = ExternalDeclaration[];
