type Token = { type: string, rawValue: string };

type Identifier = Token & { type: 'identifier', value: string };
type TypeConstant = Token & { type: 'typeConstant', value: string };
type IntConstant = Token & { type: 'intConstant', value: number };
type UintConstant = Token & { type: 'uintConstant', value: number };
type FloatConstant = Token & { type: 'floatConstant', value: number };
type BoolConstant = Token & { type: 'boolConstant', value: boolean };

type PrimaryExpression = Identifier | IntConstant | UintConstant |
  FloatConstant | BoolConstant;
type ArrayExpression = {
  type: 'arrayExpression', array: PostfixExpression, index: PrimaryExpression,
};
type MemberExpression = {
  type: 'memberExpression', object: PostfixExpression, index: Identifier, 
};
type CallExpression = {
  type: 'callExpression',
  callee: PostfixExpression | TypeConstant | null,
  arguments: Expression[],
};
type UpdateExpression = {
  type: 'updateExpression',
  operator: '--' | '++',
  prefix: boolean,
  argument: PostfixExpression, 
};

type PostfixExpression = PrimaryExpression | 
  ArrayExpression | MemberExpression | CallExpression | UpdateExpression;
type UnaryExpression = PostfixExpression | {
  type: 'unaryExpression',
  operator: '+' | '-' | '!' | '~',
  argument: PostfixExpression,
};

type BinaryExpression = UnaryExpression | {
  type: 'binaryExpression',
  operator: '*' | '/' | '%' | '+' | '-' | '<<' | '>>' |
    '<' | '>' | '<=' | '>=' | '==' | '!=' | '&' | '^' | '|' |
    '&&' | '^^' | '||';
  left: PostfixExpression,
  right: PostfixExpression,
};


type Expression = PostfixExpression;
