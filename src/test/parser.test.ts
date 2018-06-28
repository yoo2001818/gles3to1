import parse, { expression } from '../parser';

const assign = (op: string, left: any, right: any) => ({
  type: 'assignmentExpression',
  operator: op,
  left,
  right,
});

const bin = (op: string, left: any, right: any) => ({
  type: 'binaryExpression',
  operator: op,
  left,
  right,
});

const int = (start: number, value: string) => ({
  type: 'intConstant',
  value: parseInt(value, 10),
  startPos: start,
  endPos: start + value.length,
  rawValue: value,
});

const ident = (start: number, value: string) => ({
  type: 'identifier',
  value: value,
  startPos: start,
  endPos: start + value.length,
  rawValue: value,
});

const call = (callee: any, ...args: any[]) => ({
  type: 'callExpression',
  callee,
  arguments: args,
})

describe('parser', () => {
  it('should parse expressions correctly', () => {
    expect(parse('1 * 2 + 3 * 4', expression)).toEqual(bin('+',
      bin('*', int(0, '1'), int(4, '2')),
      bin('*', int(8, '3'), int(12, '4'))));
    expect(parse('1 + 2 + 3', expression)).toEqual(bin('+',
      int(0, '1'), bin('+', int(4, '2'), int(8, '3'))));
    expect(parse('(1 + 2) * 3', expression)).toEqual(bin('*',
      bin('+', int(1, '1'), int(5, '2')), int(10, '3')));
  });
  it('should parse assignment expressions correctly', () => {
    expect(parse('a = b *= c', expression)).toEqual(assign('=', ident(0, 'a'),
      assign('*=', ident(4, 'b'), ident(9, 'c'))));
  });
  it('should parse sequence expressions correctly', () => {
    expect(parse('a, b, c', expression)).toEqual({
      type: 'sequenceExpression',
      expressions: [ident(0, 'a'), ident(3, 'b'), ident(6, 'c')],
    });
  });
  it('should parse conditional expressions correctly', () => {
    expect(parse('a = a ? b + 1 : c | 0', expression)).toEqual(assign('=',
      ident(0, 'a'), {
        type: 'conditionalExpression',
        test: ident(4, 'a'),
        consequent: bin('+', ident(8, 'b'), int(12, '1')),
        alternate: bin('|', ident(16, 'c'), int(20, '0'))
      }));
  });
  it('should parse unary expressions correctly', () => {
    expect(parse('-a.b[0]', expression)).toEqual({
      type: 'unaryExpression',
      operator: '-',
      argument: {
        type: 'arrayExpression',
        array: {
          type: 'memberExpression',
          object: ident(1, 'a'),
          index: ident(3, 'b'),
        },
        index: int(5, '0'),
      },
    })
  });
  it('should parse update expressions correctly', () => {
    expect(parse('--a--', expression)).toEqual({
      type: 'updateExpression',
      operator: '--',
      prefix: true,
      argument: {
        type: 'updateExpression',
        operator: '--',
        prefix: false,
        argument: ident(2, 'a'),
      },
    });
  });
  it('should parse call expressions correctly', () => {
    expect(parse('a.b(void)', expression)).toEqual(call({
      type: 'memberExpression',
      object: ident(0, 'a'),
      index: ident(2, 'b'),
    }));
    expect(parse('vec4(1)', expression)).toEqual(call({
      type: 'typeConstant',
      value: 'vec4',
      startPos: 0,
      endPos: 4,
      rawValue: 'vec4',
    }, int(5, '1')));
    expect(parse('a(a, b, c)', expression)).toEqual(call(ident(0, 'a'),
      ident(2, 'a'), ident(5, 'b'), ident(8, 'c')));
  });
  it('should parse function prototypes', () => {
    expect(parse('int something(int a);'));
    expect(parse('int something();'));
    expect(parse('int something(void);'));
    expect(parse('int something(int a, int b);'));
    expect(parse('void something(int a, int b);'));
  });
  it('should parse variable declarations', () => {
    expect(parse('int a;'));
    expect(parse('uniform int a[5];'));
    expect(parse('uniform lowp int a[5];'));
    expect(parse('uniform lowp mat4[bc] a;'));
  });
});
