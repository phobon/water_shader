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

uniform vec3 u_underWaterColor;
uniform vec3 u_waterColor;
uniform vec3 u_foamColor;

float getDepth(const in vec2 screenPosition) {
  return texture2D(u_depthTexture, screenPosition).x;
}

float getViewZ(const in float depth) {
  return orthographicDepthToViewZ(depth, u_cameraNear, u_cameraFar);
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  float depth = getDepth(screenUv);
  float diff = getViewZ(depth);

  // Sample the scene at the current pixel
  vec3 sceneColorRaw = texture2D(u_sceneTexture, screenUv).rgb;

  // Mix the scene color with the water color based on depth
  vec3 sceneColor = mix(sceneColorRaw, u_underWaterColor, depth);
  vec3 waterColor = mix(u_underWaterColor, u_waterColor, depth);
  vec3 finalColor = mix(sceneColor, waterColor, depth);

  gl_FragColor.rgb = finalColor.rgb;
  gl_FragColor.a = 1.0;
}