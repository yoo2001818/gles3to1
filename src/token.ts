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
  SeqeunceExpression

type LayoutQualifierId = { name: string, value: number | null };
type TypeQualifier = {
  layout: LayoutQualifierId[],
  storage: string | null,
  interpolation: string | null,
  invariant: string | null,
};
type TypeSpecifier = {
  precision: string | null,
  valueType: TypeConstant,
  isArray: boolean,
  size: ConstantExpression | null,
};
type FullType = TypeQualifier & TypeSpecifier;
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
  valueType: TypeConstant,
};


/*
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE SEMICOLON
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE
IDENTIFIER SEMICOLON
type_qualifier IDENTIFIER LEFT_BRACE struct_declaration_list RIGHT_BRACE
IDENTIFIER LEFT_BRACKET constant_expression RIGHT_BRACKET SEMICOLON
type_qualifier SEMICOLON
*/
