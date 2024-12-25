## 网格/色斑图

## 使用示例

以下是一个简单的示例，展示如何使用 `ColorPattern` 类来加载和显示网格/色斑图。

### 安装依赖

首先，确保你已经安装了必要的依赖：

```sh
npm install cesium netcdfjs
```

### 示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ColorPattern Demo</title>
  <link rel="stylesheet" href="path/to/cesium/Build/Cesium/Widgets/widgets.css">
  <script src="path/to/cesium/Build/Cesium/Cesium.js"></script>
  <script src="path/to/demo.js"></script>
</head>
<body>
  <div id="cesiumContainer" style="width: 100%; height: 100%;"></div>
  <script>
    import { Viewer } from 'cesium';
    import { ColorPattern } from './ColorPattern';

    // 创建 Cesium Viewer 实例
    const viewer = new Viewer('cesiumContainer');

    // 创建 ColorPattern 实例
    const colorPattern = new ColorPattern();

    // 加载 nc 文件并添加到场景中
    colorPattern.loadNCFile('path/to/your/ncfile.nc').then(() => {
      colorPattern.addTo(viewer);
    });

    // 设置颜色带
    const colors = [
      { color: "#00FF00", value: 0.5 },
      { color: "#FFFF00", value: 2 },
      { color: "#FF0000", value: 6 }
    ];
    colorPattern.changeColorRamp(colors, true);

    // 显示特定层级
    colorPattern.showLevel(0, true);
  </script>
</body>
</html>
```

### 方法说明
<b>ColorPattern</b> 类用于加载和显示网格/色斑图。<br />
<b>loadNCFile</b>  方法用于加载 nc 数据文件。<br />
<b>addTo</b>  方法用于将图形添加到 Cesium 场景中。<br />
<b>changeColorRamp</b>  方法用于设置颜色带。<br />
<b>showLevel</b>  方法用于显示特定层级。<br />


### live demo

https://test.zhanzl.com/


### 特别声明

在我发现自己封装的方法被上个公司的人盗用发布后，才深刻意识到声明原创的重要性。在此声明，我所封装的方法是基于本人的知识与经验，经过自主设计与开发形成的原创内容。

这些方法不仅是我专业能力的体现，更是在长期实践中不断打磨、完善的成果。从最初的构思到最终完成，每一个步骤都凝聚着我对技术的深入理解和创新思考。