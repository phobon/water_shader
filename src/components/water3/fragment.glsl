#include <common>
#include <packing>

varying vec3 v_position;
varying vec2 v_uv;

uniform sampler2D u_sceneTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_displacementTexture;
uniform sampler2D u_surfaceFoamTexture;

uniform vec3 u_cameraPosition;
uniform float u_cameraNear;
uniform float u_cameraFar;

uniform float u_time;
uniform float u_threshold;
uniform vec2 u_resolution;

uniform vec3 u_deepWaterColor;
uniform vec3 u_shallowWaterColor;
uniform vec3 u_foamColor;

uniform vec3 u_horizonPosition;
uniform vec3 u_horizonColor;

uniform float u_farPlaneDepth;
varying float v_depth;

varying vec3 v_worldPosition;
varying vec3 v_scenePosition;

float getDepth(const in vec2 screenPosition) {
  return texture2D(u_depthTexture, screenPosition).x;
}

float getViewZ(const in float depth) {
  return orthographicDepthToViewZ(depth, u_cameraNear, u_cameraFar);
}

// fresnel effect
float fresnel(const in vec3 view, const in vec3 normal, const in float bias, const in float power) {
  return bias + (1.0 - bias) * pow(1.0 - max(dot(view, normal), 0.0), power);
}

void depthFade(const in vec2 screenUv, const in float distance, out float exponential, out float linear) {
  vec3 viewVector = normalize(u_cameraPosition - v_worldPosition);

  // Perspective divide
  vec3 perspectiveDivide = (viewVector * -1.0) / gl_FragCoord.w;

  vec3 scenePosition = distance * perspectiveDivide;
  scenePosition += u_cameraPosition;

  float split = (v_worldPosition - scenePosition).g;
  float divideByDistance = split / distance;
  linear = saturate(divideByDistance);
  
  float inverseSplit = split * -1.0;
  float inverseDivideByDistance = inverseSplit / distance;
  float expInverseSplit = exp(inverseDivideByDistance);
  exponential = saturate(expInverseSplit);
}

float depthFadeExponential(const in vec2 screenUv, const in float distance) {
  float e = 0.0;
  float l = 0.0;
  depthFade(screenUv, distance, e, l);

  return e;
}

float depthFadeLinear(const in vec2 screenUv, const in float distance) {
  float e = 0.0;
  float l = 0.0;
  depthFade(screenUv, distance, e, l);

  return l;
}

vec2 panningUv(const in vec2 uv, const in float tiling, const in float direction, const in float speed, const in vec2 offset) {
  float d = (2.0 * direction) - 1.0;
  float piD = PI * d;

  vec2 distorted = normalize(vec2(cos(piD), sin(piD)));
  float s = speed * u_time;

  vec2 speedDistored = s * distorted;

  vec2 t = uv * tiling;

  vec2 tiled = t + speedDistored;
  vec2 o = offset + tiled;

  return o;
}

vec3 rgbToHsv(const in vec3 rgb) {
  vec4 p = rgb.g < rgb.b ? vec4(rgb.bg, -1.0, 2.0 / 3.0) : vec4(rgb.gb, 0.0, -1.0 / 3.0);
  vec4 q = rgb.r < p.x ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;

  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsvToRgb(const in vec3 hsv) {
  vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(hsv.xxx + k.xyz) * 6.0 - k.www);
  return hsv.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), hsv.y);
}

vec3 hsvLerp(const in vec3 baseColor, const in vec3 blendColor, const in float blendAmount) {
  vec3 baseHsv = rgbToHsv(baseColor);
  vec3 blendHsv = rgbToHsv(blendColor);

  vec3 resultHsv = mix(baseHsv, blendHsv, blendAmount);
  vec3 resultRgb = hsvToRgb(resultHsv);

  return resultRgb;
}

vec4 blendWithDodge(const in vec4 baseColor, const in vec4 blendColor, const in float opacity) {
  vec4 result = vec4(1.0) - ((vec4(1.0) - baseColor) / blendColor);
  return mix(baseColor, result, opacity);
}

vec4 blend(const in vec4 baseColor, const in vec4 blendColor, const in float blendAmount) {
  return mix(baseColor, blendColor, blendAmount);
}

vec4 lerp(const in vec4 baseColor, const in vec4 blendColor, const in float blendAmount) {
  return mix(baseColor, blendColor, blendAmount);
}

vec4 overlay(const in vec4 baseColor, const in vec4 overlayColor, const in float blendAmount) {
  float a = saturate(overlayColor.a);

  vec4 blendA = blend(baseColor, overlayColor, a);
  vec4 blendB = blendWithDodge(overlayColor, baseColor, a);

  vec4 result = lerp(blendA, blendB, blendAmount);

  return result;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  // Depth calculations used in different parts of the scene
  float depth = getViewZ(getDepth(screenUv));
  float e = depthFadeExponential(screenUv, depth);

  float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
  float linearEyeDepth = getViewZ(getDepth(screenUv));
  float linearDepth = saturate(fragmentLinearEyeDepth - linearEyeDepth);

  vec3 depthColor = mix(u_deepWaterColor, u_shallowWaterColor, e);

  // Determine the horizon color with a fresnel effect
  float f = fresnel(normalize(u_horizonPosition - u_cameraPosition), vec3(0.0, 1.0, 0.0), 0.5, 4.0);
  vec3 horizonColor = mix(u_horizonColor, depthColor, f);

  // Color the underwater objects
  // Mix with the linear view depth here
  vec3 sceneColor = mix(vec3(0.0), texture2D(u_sceneTexture, screenUv).rgb, 1.0 - linearDepth);
  vec3 underwaterColor = sceneColor * (1.0 - horizonColor);

  vec3 waterColor = horizonColor + underwaterColor;

  // Surface foam
  vec2 pannedUv = panningUv(v_uv, 1.0, 1.0, 0.05, vec2(0.0));
  // vec4 foamSample = texture2D(u_surfaceFoamTexture, pannedUv);
  // float foamOpacity = step(0.55, foamSample.r);
  // vec4 foamColor = foamOpacity * vec4(u_foamColor, foamOpacity);

  // vec4 waterFoamColor = overlay(vec4(waterColor, 1.0), foamColor, 0.05);

  // Intersection foam mask
  vec2 displacement = texture2D(u_displacementTexture, pannedUv).rg;
  displacement = (displacement * 2.0) - 1.0;
  float foamMask = linearDepth + displacement.y;
  vec4 finalColor = vec4(mix(u_foamColor, waterColor, step(u_threshold, foamMask)), 1.0);

  gl_FragColor = finalColor;
  // vec3 finalColor = waterColor;

  // gl_FragColor.rgb = finalColor;
  // gl_FragColor.a = 1.0;



  // float depth = getDepth(screenUv);
  // float depthWorld = u_cameraNear + depth * (u_cameraFar - u_cameraNear);
  // float depthDiff = depthWorld - v_depth;
  // float depthBetweenPlanes = depthDiff / (u_farPlaneDepth - v_depth);
  // // depthBetweenPlanes /= u_threshold;

  // float inverseDepth = 1.0 - depthBetweenPlanes;

  // vec3 depthColor = mix(u_deepWaterColor, u_shallowWaterColor, depthBetweenPlanes);

  // vec3 sceneColor = texture2D(u_sceneTexture, screenUv).rgb;
  // vec3 finalColor = mix(vec3(0.0), sceneColor, depthBetweenPlanes);

  // gl_FragColor.rgb = depthColor;
  // gl_FragColor.a = 1.0;


  // float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
  // float linearEyeDepth = getViewZ(getDepth(screenUv));

  // float diff = 1.0 - saturate(fragmentLinearEyeDepth - linearEyeDepth);

  // // Get the depth color
  // vec3 depthColor = mix(u_deepWaterColor, u_shallowWaterColor, diff);

  // // Determine the horizon color with a fresnel effect
  // float f = fresnel(normalize(u_horizonPosition - u_cameraPosition), vec3(0.0, 1.0, 0.0), 0.5, 4.0);
  // vec3 horizonColor = mix(u_horizonColor, depthColor, f);

  // // Color the underwater objects
  // vec3 sceneColorRaw = texture2D(u_sceneTexture, screenUv).rgb;
  // vec3 sceneColor = sceneColorRaw * (1.0 - horizonColor);

  // vec3 finalColor = horizonColor + sceneColor;
  // gl_FragColor.rgb = finalColor;
  // gl_FragColor.rgb = vec3(diff);
  // gl_FragColor.a = 1.0;


  // float depth = getDepth(screenUv);
  // // float diff = getViewZ(depth);

  // // Sample the scene at the current pixel
  // vec3 sceneColorRaw = texture2D(u_sceneTexture, screenUv).rrr;

  // // Mix the scene color with the water color based on depth
  // vec3 sceneColor = mix(sceneColorRaw, vec3(1.0), diff);
  // vec3 waterColor = mix(u_deepWaterColor, u_shallowWaterColor, diff);
  // vec3 finalColor = mix(sceneColor, waterColor, depth);

  // gl_FragColor.rgb = finalColor.rgb;

  // gl_FragColor.rgb = vec3(diff);
  // gl_FragColor.a = 1.0;
  // // gl_FragColor.a = diff;
}