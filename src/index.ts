import tokenize from './tokenizer';

export default function convert(code: string, type: 'fragment' | 'vertex') {
  let result = [];
  let tokenizer = tokenize(code);
  let token;
  let scope: { [key: string]: any } = {};
  let state = '';
  while (token = tokenizer.next()) {
    switch (token.type) {
      case 'in':
        result.push(type === 'vertex' ? 'attribute' : 'varying');
        break;
      case 'out': {
        if (type === 'vertex') {
          result.push('varying');
        } else {
          // We need to convert the following value to gl_FragColor.
          state = 'glFragColorPending';
        }
        break;
      }
      case 'identifier': {
        if (state === 'glFragColorPending') {
          scope['gl_FragColor'] = token.value;
        } else if (token.value === 'gl_FragColor') {
          result.push(scope['gl_FragColor'] || 'gl_FragColor');
        } else {
          result.push(token.value);
        }
        break;
      }
    }
    if (token.type === 'in') {
      result.push(type === 'vertex' ? 'attribute' : 'varying');
    }
    console.log(token.type, token.value);
  }
}
