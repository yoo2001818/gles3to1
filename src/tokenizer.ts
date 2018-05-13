import moo from 'moo';

const lexer = moo.compile({
  WS: /[ \t]+/,
  keyword: ['const', 'uniform', 'layout', 'centroid', 'flat', 'smooth',
    'break', 'continue', 'do', 'for', 'while', 'if', 'switch', 'case',
    'default', 'else', 'in', 'out', 'inout', 'float', 'int', 'void', 'bool',
    'true', 'false', 'invariant', 'discard', 'return', 'mat2', 'mat3', 'mat4',
    'mat2x2', 'mat2x3', 'mat2x4', 'mat3x2', 'mat3x3', 'mat3x4',
    'mat4x2', 'mat4x3', 'mat4x4', 'vec2', 'vec3', 'vec4', 'uint', 'lowp',
    'uvec2', 'ivec2', 'ivec3', 'ivec4', 'uvec3', 'bvec2', 'bvec3', 'bvec4',
    'uvec4', 'mediump', 'highp', 'precision', 'sampler2D', 'sampler3D',
    'samplerCube', 'sampler2DShadow', 'samplerCubeShadow', 'sampler2DArray',
    'sampler2DArrayShadow', 'isampler2D', 'isampler3D', 'isamplerCube',
    'isampler2DArray', 'usampler2D', 'usampler3D', 'usamplerCube',
    'usampler2DArray', 'struct'],
  identifier: /[a-zA-Z_](?:[a-zA-Z_0-9]*)/,
  floatValue: /\-?[0-9]+\.[0-9]+/,
  integerValue: /\-?[0-9]+/,
  NL: { match: /\n/, lineBreaks: true },
});
