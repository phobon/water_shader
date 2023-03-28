#include <common>
#include <packing>

varying vec3 v_position;
varying vec2 v_uv;

uniform sampler2D u_sceneTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_displacementTexture;

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

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
  float linearEyeDepth = getViewZ(getDepth(screenUv));

  float diff = 1.0 - saturate(fragmentLinearEyeDepth - linearEyeDepth);

  // Get the depth color
  vec3 depthColor = mix(u_deepWaterColor, u_shallowWaterColor, diff);

  // Determine the horizon color with a fresnel effect
  float f = fresnel(normalize(u_horizonPosition - u_cameraPosition), vec3(0.0, 1.0, 0.0), 0.5, 4.0);
  vec3 horizonColor = mix(u_horizonColor, depthColor, f);

  // Color the underwater objects
  vec3 sceneColorRaw = texture2D(u_sceneTexture, screenUv).rgb;
  vec3 sceneColor = sceneColorRaw * (1.0 - horizonColor);

  vec3 finalColor = horizonColor + sceneColor;
  gl_FragColor.rgb = finalColor;
  gl_FragColor.a = 1.0;


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