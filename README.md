# gles3to1
GLSL ES 3 to 1 transpiler

# TODO
- [x] Convert `#version` to 100
- [ ] Create uniform for `textureSize`, `texelFetch`
- [ ] Polyfill `textureSize(sampler, lod)`
- [ ] Polyfill `texelFetch(sampler, ivec2Position, lod)`
- [x] Detect type of sampler (For converting `texture`)
- [ ] Convert `texture` to `texture2D`, `textureCube`
- [ ] Polyfill `invert` and `transpose`
- [ ] Polyfill bitwise operations
- [x] Convert `in` and `out`
- [x] Convert `out` to `gl_FragColor`
- [ ] Convert `out` to `gl_FragData` (GL_EXT_draw_buffers)
- [ ] Strip `layout` in uniform
- [ ] Convert uniform layout to struct
- [ ] Apply `OES_standard_derivatives`
- [ ] Apply `EXT_shader_texture_lod`
- [ ] Apply `EXT_frag_depth`
