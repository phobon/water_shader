#define PI 3.1415926535897932384626433832795

uniform float u_time;
uniform float u_amplitude;

uniform vec4 u_waveA;
uniform vec4 u_waveB;
uniform vec4 u_waveC;
uniform vec4 u_waveD;

varying vec3 v_position;
varying vec2 v_uv;

vec3 gerstnerWave (vec4 wave, vec3 p, float time) {
  float steepness = wave.z;
  float wavelength = wave.w;
  float k = 2.0 * PI / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
  float f = k * (dot(d, p.xy) - c * time);
  float a = steepness / k;

  return vec3(
    d.x * (a * cos(f)),
    d.y * (a * cos(f)),
    a * sin(f)
  );
}

void main() {
  v_position = position;
  v_uv = uv;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  vec3 p = mvPosition.xyz;
  p += gerstnerWave(u_waveA, mvPosition.xyz, u_time);
  p += gerstnerWave(u_waveB, mvPosition.xyz, u_time);
  p += gerstnerWave(u_waveC, mvPosition.xyz, u_time);
  p += gerstnerWave(u_waveD, mvPosition.xyz, u_time);
  mvPosition.xyz = p;

  gl_Position = projectionMatrix * mvPosition;
}