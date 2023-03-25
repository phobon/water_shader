varying vec2 v_uv;

uniform float u_time;

void main() {
  gl_FragColor = vec4(v_uv, sin(u_time), 1.0);
}