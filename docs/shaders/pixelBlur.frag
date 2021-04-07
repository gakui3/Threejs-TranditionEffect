precision highp float;
precision highp int;
#include <common>
#pragma glslify:snoise3D=require(glsl-noise/simplex/3d.glsl)
#pragma glslify:snoise2D=require(glsl-noise/simplex/2d.glsl)

uniform vec3 color;
uniform sampler2D tDiffuse;
uniform sampler2D transitionTexture;
uniform float time;
uniform vec2 stretchNoiseMultiplier; 
uniform float stretchStrength; 
uniform float transitionStrength; 
uniform float transitionDirection; 
uniform float interpolationCount; 
uniform vec3 uClearColor; 
uniform float lineAmount;
uniform float lineNoiseSeed;

varying vec3 pos;
varying vec2 texcoord;

float randam(vec2 co) 
{ 
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); 
} 

vec4 getStretchColor(sampler2D textureSample) 
{ 
    // Fragment amplitude 
    float fragmentAmplitude = 1.0 / interpolationCount; 
 
    // Base coordinates 
    float x = texcoord.x; 
    float y = texcoord.y; 
 
    // Randomize X coordinate 
    // float offsetStrength = 0.25; 
    // float randomOffset = randam(vec2(1.0, y)) * fragmentAmplitude *0.01 - fragmentAmplitude * 0.5 * offsetStrength; 
    // x += randomOffset; 
    // x = clamp(x, 0.0, 1.0); 
 
    // Fragment start and end 
    float fragmentStart = floor(x * interpolationCount) / interpolationCount; 
    float fragmentEnd = ceil(x * interpolationCount) / interpolationCount; 
    vec4 originalCol = texture2D(textureSample, texcoord);

    float a = step(lineAmount, snoise2D(vec2(lineNoiseSeed, y*80.0)));

    float fragmentProgress = (x - fragmentStart) / fragmentAmplitude; 
 
    // Colors start and end 
    vec4 fragmentStartColor; 
    vec4 fragmentEndColor; 


    fragmentStartColor = texture2D(textureSample, vec2(fragmentStart, y)); 
    fragmentEndColor = texture2D(textureSample, vec2(fragmentEnd, y)); 
 
    if(fragmentStartColor.xyz == uClearColor) 
    { 
        fragmentStartColor = texture2D(textureSample, vec2(0.5, y)); 
    } 
 
    if(fragmentEndColor.xyz == uClearColor) 
    { 
        fragmentEndColor = texture2D(textureSample, vec2(0.5, y)); 
    } 
 
    vec4 color = mix(fragmentStartColor, fragmentEndColor, fragmentProgress); 
    color = mix(color, originalCol, a);

    return color; 
} 

void main() {
    vec4 col = texture2D(tDiffuse, texcoord);

    //strech map
    float stretchMap = 0.0; 
    stretchMap += snoise3D(vec3(texcoord.y * 1.0 * stretchNoiseMultiplier.y, stretchStrength + time * 0.0002, texcoord.x * stretchNoiseMultiplier.x)) * 0.5; 
    stretchMap += snoise3D(vec3(texcoord.y * 4.0 * stretchNoiseMultiplier.y, stretchStrength + time * 0.0002, texcoord.x * stretchNoiseMultiplier.x)) * 0.5; 
    stretchMap += 0.5 + (stretchStrength - 0.5) * 2.0; 
    stretchMap = clamp(stretchMap, 0.0, 1.0);

    //transition
    float transitionMap = 0.0; 
    float transitionAmplitude = 0.5; 
    float transitionAmplitudeInverse = 1.0 - transitionAmplitude; 
    float transitionUvX = transitionDirection == 1.0 ? texcoord.x : (1.0 - texcoord.x); 
 
    transitionMap += transitionUvX / transitionAmplitude + transitionStrength / transitionAmplitude / transitionAmplitudeInverse - (1.0 / transitionAmplitude); 
    transitionMap += snoise2D(vec2(texcoord.y * 1.0, transitionStrength + 1.0)) * 0.5; 
    transitionMap += snoise2D(vec2(texcoord.y * 4.0, transitionStrength + 1.0)) * 0.5; 
    transitionMap -= 0.5;
    transitionMap = clamp(transitionMap, 0.0, 1.0); 
 
    //basecolor
    //vec2 uv = vec2(snoise2D(vec2(time, pos.x)), snoise2D(vec2(time, pos.y)));
    vec3 baseColorA = texture2D(tDiffuse, texcoord).rgb;
    vec3 baseColorB = texture2D(transitionTexture, texcoord).rgb; 
    vec3 baseColor = mix(baseColorA, baseColorB, transitionMap); 

    vec3 stretchColorA = getStretchColor(tDiffuse).rgb; 
    vec3 stretchColorB = getStretchColor(transitionTexture).rgb; 
    vec3 stretchColor = mix(stretchColorA, stretchColorB, transitionMap); 

    col.rgb = baseColor * (1.0-stretchMap) + stretchColor * stretchMap;

    gl_FragColor = col;
}