#include <common>
#pragma glslify:snoise=require(glsl-noise/simplex/3d.glsl)
#pragma glslify:HSLToRGB=require("./lib/PhotoshopMath.glsl")

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float time;
uniform float transitionAmount;
uniform float speed;
uniform float blockSize; 
uniform float maxOffsetX; 
uniform float maxOffsetY;

varying vec3 pos;
varying vec2 texcoord;

float rand2d(vec2 seed)
{
    return fract(sin(dot(seed * floor(time * speed), vec2(127.1, 311.7))) * 43758.5453123);
}

float rand1d(float seed)
{
    return rand2d(vec2(seed, 1.0));
}

void main() {
    vec2 block = vec2(rand2d(floor(texcoord * blockSize)));
    float OffsetX = pow(block.x, 8.0) * pow(block.x, 3.0) - pow(rand1d(7.2341), 17.0) * maxOffsetX;
    float OffsetY = pow(block.x, 8.0) * pow(block.x, 3.0) - pow(rand1d(7.2341), 17.0) * maxOffsetY;
    vec4 r = mix(texture2D(tex1, texcoord), texture2D(tex2, texcoord), transitionAmount);
    vec4 g = mix(texture2D(tex1, texcoord + vec2(OffsetX * 0.05 * rand1d(7.0), OffsetY*0.05*rand1d(12.0))),
                 texture2D(tex2, texcoord + vec2(OffsetX * 0.05 * rand1d(7.0), OffsetY*0.05*rand1d(12.0))),
                 transitionAmount);

    vec4 b = mix(texture2D(tex1, texcoord - vec2(OffsetX * 0.05 * rand1d(13.0), OffsetY*0.05*rand1d(12.0))),
                 texture2D(tex2, texcoord - vec2(OffsetX * 0.05 * rand1d(13.0), OffsetY*0.05*rand1d(12.0))),
                 transitionAmount);

    gl_FragColor = vec4(r.x, g.g, b.z, (r.a+g.a+b.a));
}