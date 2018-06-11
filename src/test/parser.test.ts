import parse, { expression } from '../parser';

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
});
