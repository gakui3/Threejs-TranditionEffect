#include <common>
#pragma glslify:snoise=require(glsl-noise/simplex/3d.glsl)
#pragma glslify:HSLToRGB=require("./lib/PhotoshopMath.glsl")

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float time;
uniform float jitterAmount;
uniform float chromaticaberrationAmount;
uniform float transitionAmount;

varying vec3 pos;
varying vec2 texcoord;

float strength = 1.0;
float jitterVFreq = 0.5;
float jitterVRate = 0.5;			
vec2 JitterVRandSeed;

float _mod(float x, float y)
{
    return x - y * floor(x / y);
}

vec3 rgb2yiq(vec3 c)
{   
    return vec3(
        (0.2989*c.x + 0.5959*c.y + 0.2115*c.z),
        (0.5870*c.x - 0.2744*c.y - 0.5229*c.z),
        (0.1140*c.x - 0.3216*c.y + 0.3114*c.z)
    );
}

vec3 yiq2rgb(vec3 c)
{				
    return vec3(
        (1.0*c.x + 1.0*c.y + 1.0*c.z),
        ( 0.956*c.x - 0.2720*c.y - 1.1060*c.z),
        (0.6210*c.x - 0.6474*c.y + 1.7046*c.z)
    );
}

float rnd_rd(vec2 co)
{
    float a = 22.9898;
    float b = 58.233;
    float c = 56058.5453;
    float dt= dot(co.xy ,vec2(a,b));
    float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

vec4 yiqDist(vec2 uv, float m, float t)
{					
    m *= 0.001; 
    vec3 offsetX = vec3( uv.x, uv.x, uv.x );	
    offsetX.r +=  sin(rnd_rd(vec2(t*0.2, uv.y)))*m;
    offsetX.g +=  sin(t*9.0)*m;
    vec4 signal = vec4(0.0, 0.0, 0.0, 0.0);
    signal.rgb = rgb2yiq( mix(texture2D( tex1, vec2(offsetX.r, uv.y) ), texture2D( tex2, vec2(offsetX.r, uv.y) ), transitionAmount).rgb ).xyz;
    // signal.g = rgb2yiq( mix(texture2D( tex1, vec2(offsetX.r, uv.y) ), texture2D( tex2, vec2(offsetX.r, uv.y) ), transitionAmount).rgb ).y;
    // signal.b = rgb2yiq( mix(texture2D( tex1, vec2(offsetX.r, uv.y) ), texture2D( tex2, vec2(offsetX.r, uv.y) ), transitionAmount).rgb ).z;
    signal.a = texture2D(tex1,uv).a + texture2D(tex1, vec2(offsetX.g, uv.y)).a + texture2D(tex1, vec2(offsetX.r, uv.y)).a ;
    //signal.a = 1.0;
    return signal;					    
}  

void main() {
    float t = time;			
    vec2 p = texcoord.xy;				

    vec4 col = vec4(0.0,0.0,0.0,0.0);
    vec4 signal = vec4(0.0,0.0,0.0,0.0);					
    strength = 1.;	
    signal = yiqDist(p, jitterAmount*strength, t*chromaticaberrationAmount);
    col.rgb = yiq2rgb(signal.rgb);
    gl_FragColor = vec4(col.rgb, (yiqDist(p, jitterAmount*strength, t*chromaticaberrationAmount)).a); 
    //gl_FragColor = vec4(col.rgb, 1); 
}