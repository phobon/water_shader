#define PI 3.1415926535897932384626433832795

uniform float u_time;
uniform float u_amplitude;

uniform vec4 u_waveA;
uniform vec4 u_waveB;
uniform vec4 u_waveC;
uniform vec4 u_waveD;

uniform vec3 u_shallowColor;
uniform vec3 u_deepColor;
uniform float u_shallowColorOpacity;
uniform float u_deepColorOpacity;

varying vec3 v_position;
varying vec2 v_uv;

varying vec4 v_shallowColor;
varying vec4 v_deepColor;

vec4 sRGBToLinear(in vec4 value) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

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

  v_shallowColor = sRGBToLinear(vec4(u_shallowColor, u_shallowColorOpacity));
  v_deepColor = sRGBToLinear(vec4(u_deepColor, u_deepColorOpacity));
}