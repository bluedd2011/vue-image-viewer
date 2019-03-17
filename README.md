## 介绍

这是一个功能丰富、体验优秀的```vue```图片预览插件。

本组件开发基于```vue 2.6.6```开发。

本组件源码及案例代码使用```pug```、```stylus```，注意安装相关loader。

<img src="http://cdn.ninix.cn/vue-image-viewer-1.png" alt="效果图1" width="1028px">
<img src="http://cdn.ninix.cn/vue-image-viewer-2.png" alt="效果图1" width="1028px">

## 功能

* 对多张图片可轮播预览
* 对不可预览的非图片文件，可点击下载
* 可缩放、旋转、切换，缩放切换支持键盘操作
* 展示缩略图
* 图片支持顺序加载或懒加载（点击触发加载）

## Attribute

属性|说明|类型|默认值
----|----|----|--
imageOptions   | 图片配合列表                   | Array
defaultIndex   | 默认预览的图片序号             | Number  | 0
loadMode       | 图片加载模式，auto表示自动顺序加载，select表示点击触发加载             | Boolean  | 'auto'
closeOnClickMask | 点击遮罩时是否关闭           | Boolean | true

* imageOptions 说明
    * 每个数组项包含属性：id、url、filename、cantPreview
        * id，非必填，表示图片的唯一标号，没有的话会被本组件自动添加
        * url，必填，表示图片的链接
        * filename，非必填，表示文件名，没有的话会被本组件自动添加为“未命名”
        * cantPreview，非必填，表示该文件是否可被预览，否的话会有下载按钮
    * 数组项会被本组件添加属性：loadStatus，naturalSize
        * loadStatus，字符串，表示图片加载状态，unload表示未下载，loading表示下载中，loaded表示已下载，fail表示下载失败
        * naturalSize，对象，包含图片的原始宽高数据

## Event

事件名      | 说明                            | 参数
------------|---------------------------------|---------
close       | 组件需要关闭时被触发
select      | 选择某个图片时被触发            | 接收两个参数，第一个为当前imageOption，第二个为序号

## 使用案例

```html
<template lang="pug">
  div
    el-button(@click='imageIsShow = true') image viewer
    image-viewer(
      load-mode='auto'
      :image-options='imageOptions'
      :default-index='0'
      v-if='imageIsShow'
      @select='selectImg'
      @close='imageIsShow = false'
    )
</template>

<script>
import VueImageViewer from 'vue-image-viewer'
export default {
  components: {
    VueImageViewer
  },
  data() {
    return {
      imageOptions: [
        {
          url: 'https://timgsa.baidu.com/timg?image&quality=80&size=b10000_10000&sec=1552358075&di=eec37d24300c3ddf4f311ad79222b9ac&src=http://i0.hdslb.com/bfs/article/d9c9a15dd66660eac002d3356b8f305dacc68a0a.jpg',
          filename: 'sss.jpg',
        },
        {
          url: 'https://jingyan.baidu.com/article/36d6ed1f85a1a91bce488367.html',
          filename: 'sss2.jpg',
          cantPreview: true
        },
        {
          url: 'http://p0.qhimg.com/t01a1b8efa310698686.png',
          filename: 'sss3.png',
        },
        {
          url: 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2309030243,1628308835&fm=26&gp=0.jpg',
          filename: 'sss4.jpg',
        },
        {
          url: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1552364296412&di=1296595393ea34824242f22f2ecdb489&imgtype=0&src=http%3A%2F%2Fb.hiphotos.baidu.com%2Fimage%2Fpic%2Fitem%2F63d9f2d3572c11df28d613086d2762d0f703c292.jpg',
          filename: 'sss5.jpg',
        },
      ],
      imageIsShow: false,
    }
  },
  methods: {
    // 切换图片时会被触发
    selectImg(item, index) {
      console.log(index)
    }
  }
}
</script>
```

如果想要全局引入，可在 main.js 写入以下内容：

```js
import VueImageViewer from 'vue-image-viewer'

Vue.use(VueImageViewer)
```
