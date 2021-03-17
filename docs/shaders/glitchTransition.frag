#include <common>
#pragma glslify:snoise=require(glsl-noise/simplex/3d.glsl)
#pragma glslify:HSLToRGB=require("./lib/PhotoshopMath.glsl")

uniform vec3 color;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float time;

varying vec3 pos;
varying vec2 texcoord;

// float _ChromAberrAmountX;
// float _ChromAberrAmountY;
// vec4 _DisplacementAmount;
// float _DesaturationAmount;
// float _RightStripesAmount;
// float _RightStripesFill;
// float _LeftStripesAmount;
// float _LeftStripesFill;
// float _WavyDisplFreq;

float _rand(vec2 co){
      return fract(sin( dot(co ,vec2(12.9898,78.233))) * 43758.5453 );
}

void main() {
      float _ChromAberrAmountX = 1.;
      float _ChromAberrAmountY = 1.;
      vec4 _DisplacementAmount = vec4(0, 0, 10, 10);
      float _RightStripesAmount = 1.0;
      float _RightStripesFill = 1.7;
      float _LeftStripesAmount = 1.0;
      float _LeftStripesFill = 1.7;
      float _WavyDisplFreq = 10.0;
      float _GlitchEffect = time;

      vec2 _ChromAberrAmount = vec2(_ChromAberrAmountX, _ChromAberrAmountY);
 
      vec4 displAmount = vec4(0.0, 0.0, 0.0, 0.0);
      vec2 chromAberrAmount = vec2(0.0, 0.0);
      float rightStripesFill = 0.0;
      float leftStripesFill = 0.0;

      //Glitch control
      if (fract(_GlitchEffect) < 0.8) {
            rightStripesFill = mix(0., _RightStripesFill, fract(_GlitchEffect) * 2.0);
            leftStripesFill = mix(0., _LeftStripesFill, fract(_GlitchEffect) * 2.0);
      }
      if (fract(_GlitchEffect) < 0.5) {
            chromAberrAmount = mix(vec2(0, 0), _ChromAberrAmount.xy, fract(_GlitchEffect) * 2.0);
      }
      if (fract(_GlitchEffect) < 0.33) {
            displAmount = mix(vec4(0, 0, 0, 0), _DisplacementAmount, fract(_GlitchEffect) * 3.0);
      }

 
      //Stripes section 
      float stripesRight = floor(texcoord.y * _RightStripesAmount);
      stripesRight = step(rightStripesFill, _rand(vec2(stripesRight, stripesRight)));

      float stripesLeft = floor(texcoord.y * _LeftStripesAmount);
      stripesLeft = step(leftStripesFill, _rand(vec2(stripesLeft, stripesLeft)));
      //Stripes section

      vec4 wavyDispl = mix(vec4(1.0, 0., 0., 1.0), vec4(0.1, 0., 0., 1.0), (sin(texcoord.y * _WavyDisplFreq) + 1.0) / 2.0);

      //Displacement section
      vec2 displUV = (displAmount.xy * stripesRight) - (displAmount.xy * stripesLeft);
      displUV += (displAmount.zw * wavyDispl.r) - (displAmount.zw * wavyDispl.g);
      //Displacement section

      //Chromatic aberration section
      float chromR = texture2D(tex1, texcoord + displUV + chromAberrAmount).r;
      float chromG = texture2D(tex1, texcoord + displUV).g;
      float chromB = texture2D(tex1, texcoord + displUV - chromAberrAmount).b;
      //Chromatic aberration section
      
      vec4 finalCol = vec4(chromR, chromG, chromB, 1);


      //gl_FragColor = vec4(vec3(snoise(v2f_position*0.02), 0, 0), 1.0);
      // vec4 col1 = texture2D(tex1, v2f_uv);
      // vec4 col2 = texture2D(tex2, v2f_uv);
      //gl_FragColor = mix(col1, col2, 0.4);

      gl_FragColor = finalCol;
}