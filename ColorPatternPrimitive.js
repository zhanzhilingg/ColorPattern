/*
 * @Author        : zhanzhilin zhanzhilin@piesat.com
 * @Date          : 2024-04-17 09:15:00
 * @LastEditors   : zhanzhilin zhanzhilingg@icloud.com
 * @LastEditTime  : 2024-05-08 09:27:37
 * @FilePath      : /piesat-map/src/map/modules/colorPattern/ColorPatternPrimitive.js
 * @Description   : 
 * Copyright (c) 2024 by zhanzhilin email: zhanzhilin@piesat.com, All Rights Reserved.
 */

import { Cesium } from "../../namespace";
// import { clamp, normalization } from '../../utils'
import { DEFAULT_COLORS } from '.';

import frag from './ColorPatternGridFrag.glsl';
import vert from './ColorPatternGridVert.glsl';

import CreateGeometryWorker  from './CreateGeometry.worker.js?worker&inline';



export default class ColorPatternPrimitive {

  show= true
  isGrid= true
  
  _source
  _texture
  _drawCommand
  _geometry
  _interval= 0.5
  _extent= [90, 0, 150, 50]
  _size= [0,0,0]

  _height= 1000
  _heightScale= 1
  _extrudedHeight= 5000

  _isDestroyed= false
  _worker= new CreateGeometryWorker()
  _image= undefined

  constructor(source, options) {
    
    this._extent = Cesium.defaultValue(options.extent, this._extent)
    this._height = Cesium.defaultValue(options.height, this._height)
    this._heightScale = Cesium.defaultValue(options.heightScale, this._heightScale)
    this._extrudedHeight = Cesium.defaultValue(options.extrudedHeight, this._extrudedHeight)

    this._size = Cesium.defaultValue(options.size, this._size)
    this._source = Cesium.defaultValue(source, this._source)
    this._interval = Cesium.defaultValue(options.interval, this._interval)

    this._maxVal = Math.max(...this._source);
    this._minVal = Math.min(...this._source);

    const halfInterval = this._interval/2;

    this._extent = [
      this._extent[0]-halfInterval, 
      this._extent[1]-halfInterval, 
      this._extent[2]+halfInterval, 
      this._extent[3]+halfInterval
    ]

    this._createGeometry();
    this._createColorRamp();

  }


  // 创建色带
  _createColorRamp(colors=DEFAULT_COLORS, isLinearGradient){

    const colorbar = getColorRamp(colors, this._maxVal-this._minVal);
    const image = new Image();
    image.src = colorbar.toDataURL();
    this._image = image;
  }

  // 几何体
  _createGeometry() {

    const { _extent, _height, _heightScale, _extrudedHeight } = this;

    const rectangle = new Cesium.RectangleGeometry({
      ellipsoid: Cesium.Ellipsoid.WGS84,
      rectangle: Cesium.Rectangle.fromDegrees(..._extent),
      height: _height * _heightScale,
      // extrudedHeight: _extrudedHeight * _heightScale,
      vertexFormat: new Cesium.VertexFormat({
        position: true,
        st: true,
        normal: true
      }),
      granularity: ((this._interval/180)*Math.PI)
      // rotation: ,
      // stRotation: 
    });

    const geometry = Cesium.RectangleGeometry.createGeometry(rectangle);
    
    // 使用 web worker 计算新属性
    this._worker.postMessage({
      source: this._source,
      size: this._size,
      attributes: geometry.attributes,
      indices: geometry.indices,
    });
    this._worker.onmessage = (e) => {
      const { newPositions, newNormals, newSts, newColors, newIndices } = e.data;
      const attributes = Object.assign({}, geometry.attributes, {
        color: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 1,
          values: new Float32Array(newColors)
        }),
        position: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: new Float32Array(newPositions)
        }),
        normal: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: new Float32Array(newNormals)
        }),
        st: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: new Float32Array(newSts)
        })
      })
      geometry.attributes = attributes;
      geometry.indices = newIndices;

      this._geometry = geometry;
      this._worker.terminate();
    }

  }

  // 材质
  _createTexture(context, isGrid) {
    // 
    if (!this._texture) { 
      this._texture = new Cesium.Texture({
        context: context,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.FLOAT,
        source: this._image
        // {
        //   arrayBufferView: this.source,
        //   width: this.size[0],
        //   height: this.size[1],
        // },
        // sampler: new Cesium.Sampler({
        //   minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
        //   magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
        // }),
        // flipY: false
      })
    }
    return this._texture;
  }

  // 创建绘制命令
  _createCommand(context) {

    if (!Cesium.defined(this._geometry)) {
      return;
    }

    const attributelocations = Cesium.GeometryPipeline.createAttributeLocations(this._geometry);

    const vertexarray = Cesium.VertexArray.fromGeometry({
      context: context,
      geometry: this._geometry,
      attributes: attributelocations
    });

    const renderstate = Cesium.RenderState.fromCache({
      depthTest: {
        enabled: true,
      },
      depthMask: {
        enabled: true,
      },                                                  
      //blending: Cesium.BlendingState.ADDITIVE_BLEND,
      blending: Cesium.BlendingState.ALPHA_BLEND,
      // blending: Cesium.BlendingState.DISABLED,
    })
    const shaderProgram = Cesium.ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vert,
      fragmentShaderSource: frag,
      attributeLocations: attributelocations
    });

    const that = this;
    const uniformMap = {
      u_texture_map() {
        return that._createTexture(context, that.isGrid);
      },
      u_size() {
        return new Cesium.Cartesian3(...that._size);
      },
      u_line_width() {
        return new Cesium.Cartesian2(3.0, 3.0);
      },
      u_line_offset() {
        return new Cesium.Cartesian2(0.0, 0.0);
      },
      u_min_val() {
        return that._minVal
      },
      u_max_val() {
        return that._maxVal
      },
      u_time() {
        return performance.now() / 1000;
      },
      u_is_grid() {
        return true;
      }
    };

    this._drawCommand = new Cesium.DrawCommand({
      pass: Cesium.Pass.OPAQUE,
      //pass: Cesium.Pass.TRANSLUCENT,
      shaderProgram: shaderProgram,
      renderState: renderstate,
      vertexArray: vertexarray,
      uniformMap: uniformMap,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
    });
  }
  

  // 更新色带
  changeColorRamp(colors, isLinearGradient) {
    this._createColorRamp(colors, isLinearGradient);
    this._drawCommand = undefined;
    this._texture = undefined;
  }

  // 渲染时调用
  update(frameState) {

    if (!this._drawCommand) {
      // console.log(frameState)
      this._createCommand(frameState.context);                                 
    }
    if(this.show && this._drawCommand){
      frameState.commandList.push(this._drawCommand);
    }
  }

  // 销毁
  destroy() {
    this._drawCommand = undefined;
    this._worker.terminate();
    this._isDestroyed = true;
  }

  // 销毁判断
  isDestroyed() {
    return this._isDestroyed;
  }
}



/** 生成色带 */
export function getColorRamp(colors, range) {
  const max = range;
  // set max value
  colors[colors.length-1].value = max;

  const width = 100;
  const height = 1;
  const ramp = document.createElement("canvas");
  ramp.width = width;
  ramp.height = height;
  const ctx = ramp.getContext("2d");

  let l =0;
  colors.forEach((item) => {
    ctx.fillStyle = item.color;
    const value = item.value;
    const w = (value/range)*width;
    ctx.fillRect(l, 0, w, height);
    l+=w;
  })

  return ramp;
}