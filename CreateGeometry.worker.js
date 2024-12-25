/*
 * @Author        : zhanzhilin zhanzhilingg@icloud.com
 * @Date          : 2024-04-26 10:50:52
 * @LastEditors   : zhanzhilin zhanzhilingg@icloud.com
 * @LastEditTime  : 2024-04-26 14:35:16
 * @FilePath      : /piesat-map/src/map/modules/colorPattern/createGeometry.worker.js
 * @Description   : 
 * Copyright (c) 2024 by zhanzhilin email: zhanzhilingg@icloud.com, All Rights Reserved.
 */


// RectangleGrid

self.onmessage = e => {
  
  const { data } = e;
  
  const nx = data.size[0];
  const ny = data.size[1];
  const nz = data.size[2];

  const positions = data.attributes.position.values;
  const normals = data.attributes.normal.values;
  const sts = data.attributes.st.values;
  const colors = data.source.slice(0, data.size[0]*data.size[1]);
  const indices = data.indices;

  const newPositions = []
  const newNormals = []
  const newSts = []
  const newColors = []
  const newIndices = []

  // 行
  for(let y=0; y<ny; y++) {
    // 列
    for(let x=0; x<nx; x++) {
      // 矩形索引
      const index = x + y*nx;
      // 矩形，两个三角面，6个顶点索引（原索引）
      const perIndices = indices.slice(index*6, index*6+6);
      // 矩形颜色
      const color = colors[index];
      // 矩形4个顶点的颜色
      const perColors = [color, color, color, color];
      // 矩形4个顶点索引（原来索引）
      const perPositions = Array.from(new Set(perIndices));
      // 
      newColors.push(...perColors);
      // 矩形顶点循环
      perPositions.forEach((perIndex) => {

        const position = [positions[perIndex*3], positions[perIndex*3+1], positions[perIndex*3+2]];
        const normal = [normals[perIndex*3], normals[perIndex*3+1], normals[perIndex*3+2]];
        const st = [sts[perIndex*2], sts[perIndex*2+1]];
        
        newPositions.push(...position);
        newNormals.push(...normal);
        newSts.push(...st);
      })
      // 每个新矩形，添加6个顶点索引
      const last = newPositions.length/3;
      newIndices.push(last-4, last-2, last-3, last-3, last-2, last-1);

    }
  }
  
  self.postMessage({ newPositions, newNormals, newSts, newColors, newIndices });

};

self.onerror = e => console.log(e);
