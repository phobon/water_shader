#include <common>
#include <packing>

varying vec3 v_position;
varying vec2 v_uv;

uniform sampler2D u_depthTexture;
uniform sampler2D u_sceneTexture;
uniform sampler2D u_displacementTexture;
uniform float u_cameraNear;
uniform float u_cameraFar;
uniform float u_time;
uniform float u_threshold;
uniform vec2 u_resolution;

uniform float u_waterOpacity;
uniform vec3 u_deepWaterColor;
uniform vec3 u_shallowWaterColor;
uniform vec3 u_foamColor;
uniform float u_deepWaterOpacity;
uniform float u_shallowWaterOpacity;
uniform float u_foamOpacity;

uniform float u_refractionScale;
uniform float u_refractionSpeed;
uniform float u_refractionStrength;

uniform float u_depth;

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
float cnoise(vec2 P){
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
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
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

float getDepth( const in vec2 screenPosition ) {
  return texture2D(u_depthTexture, screenPosition).x;
}

float getViewZ( const in float depth ) {
  return orthographicDepthToViewZ(depth, u_cameraNear, u_cameraFar);
}

float depthFade(const in vec2 screenUv) {
  float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
  float linearEyeDepth = getViewZ(getDepth(screenUv));
  float totalDepth = (linearEyeDepth - fragmentLinearEyeDepth) / -u_depth;

  float saturatedDepth = saturate(totalDepth);
  return saturatedDepth;
}

vec2 sceneTransparency(const in vec2 uv, const in float scale, const in float speed, const in float strength) {
  float scaledSpeed = speed * u_time;
  vec2 offset = vec2(scaledSpeed);

  // Tiling and offset
  vec2 uvOffset = uv * scale + offset;

  // Gradient noise
  float noise = cnoise(uvOffset) * 0.5;

  // Remap noise from [0, 1] to [-1, 1]
  float remappedNoise = noise * 2.0 - 1.0;

  // Apply strength
  float finalNoise = remappedNoise * strength;

  vec2 distortedScreenUv = uv + finalNoise;

  return distortedScreenUv;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  float depth = depthFade(screenUv);
  vec4 shallowWaterColor = vec4(u_shallowWaterColor, u_shallowWaterOpacity);
  vec4 deepWaterColor = vec4(u_deepWaterColor, u_deepWaterOpacity);
  vec4 waterColor = mix(shallowWaterColor, deepWaterColor, depth);

  vec2 distoredUv = sceneTransparency(screenUv, u_refractionScale, u_refractionSpeed, u_refractionStrength);
  vec4 sceneColor = mix(texture2D(u_sceneTexture, distoredUv), vec4(0.0), depth);

  vec4 finalColor = sceneColor + waterColor;
  // vec4 finalColor = mix(sceneColor, waterColor, u_waterOpacity);

  // vec2 displacement = texture2D(u_displacementTexture, (v_uv * 2.0) - u_time * 0.05).rg;
  // displacement = (displacement * 2.0) - 1.0;
  // diff += displacement.y;
  // vec3 finalColor = mix(u_foamColor, underwaterColor, smoothstep(u_threshold - .02, u_threshold + .02, depth));

  gl_FragColor = finalColor;
  // gl_FragColor.a = 1.0;
}