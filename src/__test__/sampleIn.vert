#version 300 es
#define JOINT_COUNT 64
precision lowp float;

// Just a dummy shader with bunch of nonsense

uniform ViewBlock {
  mat4 projection;
  mat4 view;
  mat4 model;
};

uniform ArmatureBlock {
  mat4 bindMatrices[64];
};

uniform MaterialBlock {
  vec3 albedo;
  vec4 intensity;
  vec4 reflectivity;
} materials;

uniform sampler2D heightTexture;

in vec3 iPosition;
in vec2 iTexCoord;
in vec3 iNormal;

in vec4 iSkinWeights;
in vec4 iSkinIndices;

out vec3 oPosition;
out vec2 oTexCoord;
out vec3 oViewPos;
out vec3 oNormal;

void main() {
  vec4 height = texture(heightTexture, texCoord);
  mat4 viewModel = view * model;
  mat3 normal = transpose(invert(mat3(
    viewModel[0].xyz, viewModel[1].xyz, viewModel[2].xyz)));
  oPosition = (projection * viewModel * vec4(iPosition, 1.0)).xyz;
  oNormal = normal * iNormal;
}
