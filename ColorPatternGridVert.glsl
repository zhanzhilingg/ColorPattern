
in float val;
in vec3 position; 
in vec2 st;
in vec3 normal;

out vec3 v_position;
out vec2 v_st;
out float v_val;
out vec3 v_normal;
out vec3 v_positionEC;


uniform float pointSize;

void main () {

  v_position = position;
  v_st = st;
  v_val = val;
  v_normal = normal;

  v_positionEC = (czm_modelView * vec4(position,1.0)).xyz;

  gl_Position= czm_modelViewProjection * vec4(position,1.0);
  
}