#include <common>
#include <packing>

uniform vec2 u_resolution;

uniform float u_time;

uniform sampler2D u_depthTexture;
uniform sampler2D u_sceneTexture;

uniform float u_cameraNear;
uniform float u_cameraFar;

uniform float u_depth;
uniform vec3 u_shallowColor;
uniform vec3 u_deepColor;
uniform float u_shallowColorOpacity;
uniform float u_deepColorOpacity;

uniform float u_refractionScale;
uniform float u_refractionSpeed;
uniform float u_refractionStrength;

uniform vec3 u_foamColor;
uniform float u_foamScale;
uniform float u_foamSpeed;
uniform float u_foamAmount;
uniform float u_foamCutoff;

varying vec2 v_uv;

vec4 permute(vec4 x) {
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float fbmNoise(in vec2 _st) {
  vec2 i = floor(_st);
  vec2 f = fract(_st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
          (c - a)* u.y * (1.0 - u.x) +
          (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm(in vec2 _st, in int octaves) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  // Rotate to reduce axial bias
  mat2 rot = mat2(cos(0.5), sin(0.5),
                  -sin(0.5), cos(0.50));
  for (int i = 0; i < octaves; ++i) {
    v += a * fbmNoise(_st);
    _st = rot * _st * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

vec4 sRGBToLinear(in vec4 value) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 linearToSRGB(vec4 linearRGB)
{
    bvec4 cutoff = lessThan(linearRGB, vec4(0.0031308));
    vec4 higher = vec4(1.055)*pow(linearRGB, vec4(1.0/2.4)) - vec4(0.055);
    vec4 lower = linearRGB * vec4(12.92);

    return mix(higher, lower, cutoff);
}

float getDepth(const in vec2 screenPosition) {
  return texture2D(u_depthTexture, screenPosition).x;
}

float getViewZ(const in float depth) {
  return orthographicDepthToViewZ(depth, u_cameraNear, u_cameraFar);
}

float depthFade(const in vec2 screenUv, const in float distance) {
  float screenPosition = getViewZ(gl_FragCoord.z);
  float sceneDepth = getViewZ(getDepth(screenUv));

  float rawDepth = (screenPosition - sceneDepth) / distance;
  float depth = saturate(rawDepth);

  return depth;
}

vec2 tiledOffsetUv(const in vec2 uv, const in vec2 tiling, const in vec2 offset) {
  return uv * tiling + offset;
}

vec2 refractedUv(const in vec2 uv, const in float scale, const in float speed, const in float strength) {
  float time = u_time * speed;

  vec2 tiling = vec2(scale);
  vec2 offset = vec2(time);
  vec2 offsetUv = tiledOffsetUv(uv, tiling, offset);

  float noise = cnoise(offsetUv);
  
  noise = (noise * 2.0) - 1.0;

  float finalNoise = noise * strength;
  vec2 finalUv = uv + finalNoise;

  return finalUv;
}

float foam(const in vec2 uv, const in float foamScale, const in float foamSpeed, const in float foamAmount, const in float foamCutoff, const in vec3 foamColor) {
  float depth = depthFade(uv, foamAmount);
  float cutoff = depth * foamCutoff;

  float time = u_time * foamSpeed;

  vec2 tiling = vec2(foamScale);
  vec2 offset = vec2(time);
  vec2 offsetUv = tiledOffsetUv(uv, tiling, offset);

  float noise = fbm(offsetUv, 5) + (cnoise(offsetUv) * 0.9);
  float foamEdge = step(cutoff, noise);
  return foamEdge;
} 

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  vec4 shallowColor = sRGBToLinear(vec4(u_shallowColor, u_shallowColorOpacity));
  vec4 deepColor = sRGBToLinear(vec4(u_deepColor, u_deepColorOpacity));
  vec4 foamColor = sRGBToLinear(vec4(u_foamColor, 1.0));

  float depth = depthFade(screenUv, u_depth);
  vec4 waterColor = mix(deepColor, shallowColor, depth);

  float foamEdge = foam(screenUv, u_foamScale, u_foamSpeed, u_foamAmount, u_foamCutoff, foamColor.rgb);
  vec4 foamWaterColor = mix(waterColor, foamColor, foamEdge);

  vec2 noiseUv = refractedUv(screenUv, u_refractionScale, u_refractionSpeed, u_refractionStrength);
  vec4 sceneColor = sRGBToLinear(texture2D(u_sceneTexture, noiseUv));

  vec3 finalColor = mix(sceneColor.rgb, foamWaterColor.rgb, foamWaterColor.a);

  gl_FragColor.rgb = finalColor;
  gl_FragColor.a = 1.0;

	#include <tonemapping_fragment>
  #include <encodings_fragment>
}