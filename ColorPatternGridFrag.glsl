
uniform vec2 u_line_width;
uniform vec2 u_line_offset;

uniform sampler2D u_texture_map;
uniform float u_max_val;
uniform float u_min_val;
uniform vec3 u_size;
uniform float u_time;

in vec3 v_position;
in vec3 v_normal;
in vec2 v_st;
in float v_val;

in vec3 v_positionEC;

// 主函数
void main () {

  vec2 st = v_st;
  vec3 positionToEyeEC = -v_positionEC;

  float scaledWidth = fract(u_size.s * st.s);
  scaledWidth = abs(scaledWidth - floor(scaledWidth) - u_line_offset.s);
  float scaledHeight = fract(u_size.t * st.t);
  scaledHeight = abs(scaledHeight - floor(scaledHeight) - u_line_offset.t);
  // 模糊因子-控制线条的模糊度
  const float fuzz = 0.001;
  
  float value;
  #ifdef GL_OES_standard_derivatives
    // 
    vec2 thickness = (u_line_width * czm_pixelRatio) - 1.0;
    // 来自Cozzi和Ring的“虚拟球体的3D引擎设计”，清单4.13
    vec2 dx = abs(dFdx(st));
    vec2 dy = abs(dFdy(st));
    vec2 dF = vec2(max(dx.s, dy.s), max(dx.t, dy.t)) * vec2(u_size.s, u_size.t);
    value = min(
      smoothstep(dF.s * thickness.s, dF.s * (fuzz + thickness.s), scaledWidth),
      smoothstep(dF.t * thickness.t, dF.t * (fuzz + thickness.t), scaledHeight)
    );
  #else

    vec2 range = 1.0 - (u_line_width * czm_pixelRatio * 0.05);
    value = min(
      1.0 - smoothstep(range.s, range.s + fuzz, scaledWidth),
      1.0 - smoothstep(range.t, range.t + fuzz, scaledHeight)
    );
  #endif

  // 边缘取自 RimLightingMaterial.glsl
  // See http://www.fundza.com/rman_shaders/surface/fake_rim/fake_rim1.html
  float dRim = 1.0 - abs(dot(v_normal, normalize(positionToEyeEC)));
  float sRim = smoothstep(1.0, 1.0, dRim);
  value *= (1.0 - sRim);

  float valInRange = (v_val-u_min_val)/(u_max_val-u_min_val);
  vec4 color = texture(u_texture_map, vec2(valInRange, 0.5));
  
  // 绘制网格
  color.a = color.a * (1.0 * value);

  vec4 newColor = czm_gammaCorrect(color);

  out_FragColor = newColor;

}



// vec2 random2( vec2 p ) {
//   return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
// }

// vec2 tile (vec2 st, vec2 size) {
//   st.x *= size.x;
//   st.y *= size.y;
//   return st;
// }

// void main () {
//   vec2 st = tile(v_st, vec2(u_size.x, u_size.y));
//   vec3 positionToEyeEC = -v_positionEC;

//   vec3 color = vec3(1.0);

//   // 平铺
//   vec2 i_st = floor(st);
//   vec2 f_st = fract(st);

//   float m_dist = 1.;  // minimum distance

//   for (int y= -1; y <= 1; y++) {
//     for (int x= -1; x <= 1; x++) {
//       // 网格中的邻居位置
//       vec2 neighbor = vec2(float(x),float(y));
//       // 网格中当前位置+相邻位置的随机位置
//       vec2 point = random2(i_st + neighbor);
//       // 为点设置动画
//       point = 0.5 + 0.5*sin(u_time + 6.2831*point);
//       // 像素和点之间的矢量
//       vec2 diff = neighbor + point - f_st;
//       // 到点的距离
//       float dist = length(diff);
//       // 保持更近的距离
//       m_dist = min(m_dist, dist);
//     }
//   }
//   // 绘制最小距离（距离场）
//   color += m_dist;
//   // 绘制单元格中心
//   color += 1.-step(.02, m_dist);
//   // 绘制网格
//   color.r += step(.95, f_st.x) + step(.95, f_st.y);
//   // 显示等值线
//   color -= step(.7,abs(sin(27.0*m_dist)))*.5;

//   out_FragColor = vec4(color,1.0);

// }