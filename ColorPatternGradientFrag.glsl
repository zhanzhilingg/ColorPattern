uniform vec2 u_image_res;
uniform vec2 u_range;
uniform vec2 u_color_range;
float val;

float calcTexture(sampler2D tex, const vec2 uv) {
  return texture2D(tex, uv).r;
}

float bilinear(sampler2D tex, const vec2 uv) {
  vec2 px = 1.0 / u_image_res;
  vec2 vc = (floor(uv * u_image_res)) * px;
  vec2 f = fract(uv * u_image_res);
  float tl = calcTexture(tex, vc);
  float tr = calcTexture(tex, vc + vec2(px.x, 0));
  float bl = calcTexture(tex, vc + vec2(0, px.y));
  float br = calcTexture(tex, vc + px);
  return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

float getValue(sampler2D tex, const vec2 uv) {
  float min = u_range.x;
  float max = u_range.y;
  float r = bilinear(tex, uv);
  return r * (max - min) + min;
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  vec4 color1 = texture2D(image, st); 

  float value = getValue(image, materialInput.st);
  val = value;
  // val1 = value;
  float value_t = (value - u_color_range.x) / (u_color_range.y - u_color_range.x);

  vec4 color = texture2D(color_ramp, vec2(value_t, 0.5));

  color = czm_gammaCorrect(color);

  if(color1.r < (mixValue / 255.0)){
      color.a = 0.0;
  }
  if(color1.r > (maxValue / 255.0)){
      color.a = 0.0;
  }

  material.diffuse = color.rgb;
  // material.alpha = color.a;
  // material.alpha = min(colorImage.a,color.a);
  if(alpha){
      material.alpha = 0.0;
  }else{
      material.alpha = min(colorImage.a,color.a);
  }
  return material;
}