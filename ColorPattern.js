/*
 * @Author        : zhanzhilin zhanzhilin@piesat.com
 * @Date          : 2024-04-16 11:00:27
 * @LastEditors   : zhanzhilin zhanzhilingg@icloud.com
 * @LastEditTime  : 2024-05-06 16:01:43
 * @FilePath      : /piesat-map/src/map/modules/colorPattern/ColorPattern.js
 * @Description   : 高性能网格/色斑图
 * Copyright (c) 2024 by zhanzhilin email: zhanzhilin@piesat.com, All Rights Reserved.
 */

import { Cesium } from '../../namespace'
import { arrayToMap } from '../../utils'
import { NetCDFReader } from 'netcdfjs'

import ColorPatternPrimitive from './ColorPatternPrimitive';


const DEFT_OPTIONS = {
  
}


/** 高性能网格/色斑图 */
export default class ColorPattern {

  _viewer
  _collection= new Cesium.PrimitiveCollection()

  constructor (options= {}) {
    // 
    options = Object.assign({}, DEFT_OPTIONS, options)

  }

  /**
   * 加载nc数据
   * @param {String} url 加载的nc数据文件地址
   * @returns Promise
   */
  async loadNCFile (url) {
    // load nc file as array buffer
    return await Cesium.Resource.fetchArrayBuffer(url).then(res => {
      // 
      const reader = new NetCDFReader(res);
      const dimensions = arrayToMap(reader.dimensions);
      const lonArray = new Float32Array(reader.getDataVariable('lon').flat());
      const latArray = new Float32Array(reader.getDataVariable('lat').flat());
      const levArray = new Float32Array(reader.getDataVariable("level").flat());
      const valArray = new Float32Array(reader.getDataVariable("value").flat());

      // const variables = arrayToMap(reader.variables);

      const minx = Math.min(...lonArray)
      const maxx = Math.max(...lonArray)
      const miny = Math.min(...latArray)
      const maxy = Math.max(...latArray)
      // const minz = Math.min(...levArray)
      // const maxz = Math.max(...levArray)

      const nx = dimensions['lon'].size;
      const ny = dimensions['lat'].size;
      const nz = dimensions['level'].size;

      const rect = [minx, miny, maxx, maxy]
      const size = [ nx, ny, nz ]

      const interval = 0.5;

      for (let i=0; i< nz; i++) {
        const oneLevelSize = nx*ny;
        const oneLevelData = valArray.slice(oneLevelSize*i, oneLevelSize*(i+1));
        // 
        const values = dealValues(oneLevelData, nx, ny);
        // create primitive
        const primitive = new ColorPatternPrimitive(values, {
          extent: rect,
          height: levArray[i],
          heightScale: 1000,
          size: [nx, ny, nz],
          interval,
          data: [lonArray, latArray, levArray]
        })
        this._collection.add(primitive)
      }

      return { 
        data: { lon: lonArray, lat: latArray, level: levArray, value: valArray, },
        rect, 
        size, 
      }
    })
  }

  /**
   * 添加到场景中
   * @param {Cesium.Viewer} viewer cesium场景对象
   */
  addTo(viewer) {
    viewer.scene.primitives.add(this._collection)
    this._viewer = viewer
  }

  /**
   * 销毁渲染对象
   */
  destroy () {
    if (this._viewer) {
      this._viewer.scene.primitives.remove(this._collection)
    }
    // this._collection.destroy()
  }

  /**
   * 设置颜色带
   * @param {Array} colors 颜色组 [{ color: "#ff0000", value:1 }]
   * @param {String} colors.color 颜色值，css color string
   * @param {Number} colors.value 颜色对应的值
   * @param {Boolean} isLinearGradient 是否线性渐变
   */
  changeColorRamp (colors, isLinearGradient) {
    // 
    for(let i=0; i< this._collection.length; i++) {
      const primitive = this._collection.get(i)
      primitive.changeColorRamp(colors, isLinearGradient)
    }
  }

  /**
   * 设置显示的层级
   * @param {Number} index 显示的层级下标
   * @param {Boolean} onlyCurrent 是否只显示当前层级，否侧显示小于index下标的所有层级
   */
  showLevel (index, onlyCurrent) {

    for(let i=0; i< this._collection.length; i++) {
      const primitive = this._collection.get(i)
      if ((!onlyCurrent && i < index) || index === i) {
        primitive.show = true
      } else {
        primitive.show = false
      }
    }
  }

}

/** 
 * 数据处理: y轴对调
 */
function dealValues (data, nx, ny) {
  const newData = []
  for (let i = ny-1; i >= 0; i--) {
    const row = data.slice(i*nx, (i+1)*nx)
    // const r = Math.round(nx/2)
    // const leftRow = row.slice(0, r)
    // const rightRow = row.slice(r, nx)
    // newData.push(...rightRow, ...leftRow)
    newData.push(...row)
  }
  return new Float32Array(newData)
}