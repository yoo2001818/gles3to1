import tokenize from './tokenizer';

export default function convert(code: string, type: 'fragment' | 'vertex') {
  let result = [];
  let tokenizer = tokenize(code);
  let token;
  while (token = tokenizer.next()) {
    console.log(token.type, token.value);
  }
}
