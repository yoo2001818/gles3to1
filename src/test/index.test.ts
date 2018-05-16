import convert from '../index';

describe('test', () => {
  it('should parse code correctly', () => {
    convert(`
#version 300 es
#define JOINT_COUNT 64
precision lowp float;

// Just a dummy shader with bunch of nonsense

uniform MaterialBlock {
  vec3 albedo;
  vec4 intensity;
  vec4 reflectivity;
} materials;

uniform sampler2D heightTexture;

in vec3 iPosition;
in vec2 iTexCoord;
in vec3 iViewPos;
in vec3 iNormal;

out vec3 oColor;

void main() {
  oColor = texture(heightTexture, iTexCoord).xyz * max(
      dot(vec3(1.0, 0.0, 0.0), iNormal), 0.0);
}
    `, 'fragment');
  });
});
