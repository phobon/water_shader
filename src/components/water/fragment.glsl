#include <common>
#include <packing>

varying vec3 v_position;
varying vec2 v_uv;

uniform sampler2D u_depthTexture;
uniform sampler2D u_displacementTexture;
uniform float u_cameraNear;
uniform float u_cameraFar;
uniform float u_time;
uniform float u_threshold;
uniform vec2 u_resolution;

uniform vec3 u_underWaterColor;
uniform vec3 u_waterColor;
uniform vec3 u_foamColor;

float getDepth( const in vec2 screenPosition ) {
  return texture2D( u_depthTexture, screenPosition ).x;
}

float getViewZ( const in float depth ) {
  return orthographicDepthToViewZ( depth, u_cameraNear, u_cameraFar );
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;

  float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
  float linearEyeDepth = getViewZ(getDepth(screenUv));

  float diff = saturate(fragmentLinearEyeDepth - linearEyeDepth);

  float underwaterThreshold = smoothstep(u_threshold, 0.8, diff);
  vec3 underwaterColor = mix(u_underWaterColor, u_waterColor, underwaterThreshold);

  vec2 displacement = texture2D(u_displacementTexture, (v_uv * 2.0) - u_time * 0.05).rg;
  displacement = (displacement * 2.0) - 1.0;
  diff += displacement.y;
  // vec3 foamColor = mix(u_foamColor, u_waterColor, step(u_threshold, diff));
  vec3 finalColor = mix(u_foamColor, underwaterColor, smoothstep(u_threshold - .02, u_threshold + .02, diff));

  // vec3 finalColor = underwaterColor + foamColor;

  gl_FragColor.rgb = finalColor;
  gl_FragColor.a = 1.0;
}