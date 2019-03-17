<template lang="pug">
  .image-viewer.flex(
    @mousewheel='mouseWheel'
    @mouseup='mouseUp'
    @mousemove='mouseMove'
  )
    .image-viewer-content(
      ref='imageViewerContent'
      @click.self='clickMask'
    )
      .u-not-found(v-if='activedImage.cantPreview')
        .u-not-found-img
        .u-tip 无法预览该文件，可点击
          a.u-link(:href='activedImage.url' :download='activedImage.filename') 此处
          | 下载
      i.image-viewer-loading.u-loading-img(v-else-if='activedImage.loadStatus==="loading"')
      img.u-real-img(
        :class='{"u-transition": !isMouseDownInImg}'
        :style='contentImgStyle'
        :src='activedImage.url'
        :alt='activedImage.filename'
        v-else-if='activedImage.loadStatus==="loaded"'
        @click.stop=''
        @mousedown.prevent='mouseDown($event)'
      )
    .image-viewer-file-name(@click.stop='')
      | {{ activedImage.filename }}
      span(v-if='!activedImage.loadStatus==="loaded"') （{{activedImage.naturalSize.width}} x {{activedImage.naturalSize.height}}）
    .image-viewer-scale(
      :class='{"u-transition": timerScale2}'
      @click.stop=''
    )
      | {{ Math.round(this.scale * 100) }}%
    .image-viewer-btns(@click.stop='')
      .u-item.u-icon-zoom-in(title='放大' @click.stop='clickZoomIn')
      .u-item.u-icon-zoom-out(title='缩小' @click.stop='clickZoomOut')
      .u-item.u-icon-one-to-one(title='1:1比例' @click.stop='clickZoomInit')
      .u-item.u-icon-prev(title='上一幅' @click.stop='clickPrev')
      .u-item.u-icon-next(title='下一幅' @click.stop='clickNext')
      .u-item.u-icon-rotate-left(title='逆时针90°' @click.stop='clickRotateLeft')
      .u-item.u-icon-rotate-right(title='顺时针90°' @click.stop='clickRotateRight')
    .image-viewer-list(@click.stop='')
      .u-item(
        v-for="(item,index) in imageOptions"
        :key='item.id || index'
        :class='{"u-actived": index === activedIndex}'
        @click.stop='selectImg(index)'
      )
        .u-not-found-img(v-if='item.cantPreview')
        template(v-else-if='item.loadStatus==="loading"')
          i.image-viewer-loading.u-loading-img(v-if='index===activedIndex||loadMode==="auto"')
          .u-default-image(v-else)
        img.u-real-img(:src='item.url' v-else-if='item.loadStatus==="loaded"')
        .u-default-image(v-else-if='item.loadStatus==="unload"')
    i.image-viewer-icon-close(title='关闭' @click='clickClose')
</template>

<script>
export default {
  name: 'VueImageViewer',
  props: {
    imageOptions: Array,
    defaultIndex: {
      type: Number,
      default: 0
    },
    // 图片加载模式，auto表示自动依次加载，select表示点击触发加载
    loadMode: {
      type: String,
      default: 'auto'
    },
    // 点击遮罩时是否关闭
    closeOnClickMask: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      id: 0, // 默认id
      isMouseDownInImg: false, // 当前鼠标是否处于压下并压下时位于大图上
      activedIndex: 0, // 当前激活的大图的序号
      imgWidth: 0, // 当前大图的宽度
      imgHeight: 0, // 当前大图的高度
      scale: 1, // 当前大图的缩放比例
      tempScale: 1, // 对缩放做防抖处理
      minInitScale: 0.2, // 大图的最小缩放比例
      timerScale: null, // 缩放定时器
      timerScale2: null, // 缩放文本显隐定时器
      rotateZ: null, // 当前大图的旋转角度
      moveStartPoint: { // 鼠标开始移动时的位置
        x: 0,
        y: 0,
      },
      mouseUpVector: { // 鼠标松开停止移动时的位置
        x: 0,
        y: 0,
      },
      moveVector: { // 鼠标移动过程中的向量
        x: 0,
        y: 0,
      },
    }
  },
  computed: {
    activedImage() {
      return this.imageOptions[this.activedIndex]
    },
    contentImgStyle() {
      return {
        width: `${this.imgWidth}px`,
        height: `${this.imgHeight}px`,
        marginLeft: `${this.moveVector.x}px`,
        marginTop: `${this.moveVector.y}px`,
        transform: `rotateZ(${this.rotateZ}deg)`
      }
    },
  },
  methods: {
    // 设置缩放，并计算缩放后图片的大小与位置
    setScale(scale) {
      this.scale = scale
      const naturalSize = this.activedImage.naturalSize
      const imgWidth = Math.round(naturalSize.width * this.scale)
      const imgHeight = Math.round(naturalSize.height * this.scale)
      this.mouseUpVector.x = this.moveVector.x = Math.round(this.moveVector.x + (this.imgWidth - imgWidth) / 2)
      this.mouseUpVector.y = this.moveVector.y = Math.round(this.moveVector.y + (this.imgHeight - imgHeight) / 2)
      this.imgWidth = imgWidth
      this.imgHeight = imgHeight
    },
    // 设置旋转角度
    setRotate(deg) {
      this.rotateZ = this.rotateZ ? this.rotateZ + deg : deg
    },
    // 显示缩放比例文字
    showScaleTip() {
      if (this.timerScale2) window.clearTimeout(this.timerScale2)
      this.timerScale2 = window.setTimeout(() => {
        this.timerScale2 = null
      }, 3000)
    },
    // 重设初始位置，缩放，旋转
    setInitPosition(naturalSize) {
      const clientWidth = window.innerWidth
      const clientHeight = window.innerHeight
      let tempWidth = 0
      let tempHeight = 0
      let scale = 1
      if(naturalSize.width>clientWidth && naturalSize.height>clientHeight){
        if(clientWidth>clientHeight){
          tempWidth = Math.round(clientWidth * 0.6)
          scale = Math.max(Math.floor(tempWidth / naturalSize.width * 10) / 10, this.minInitScale)
        }else{
          tempHeight = Math.round(clientHeight * 0.6)
          scale = Math.max(Math.floor(tempHeight / naturalSize.height * 10) / 10, this.minInitScale)
        }
      } else if (naturalSize.width>clientWidth){
        tempWidth = Math.round(clientWidth * 0.6)
        scale = Math.max(Math.floor(tempWidth / naturalSize.width * 10) / 10, this.minInitScale)
      } else if (naturalSize.height>clientHeight){
        tempHeight = Math.round(clientHeight * 0.6)
        scale = Math.max(Math.floor(tempHeight / naturalSize.height * 10) / 10, this.minInitScale)
      }
      this.imgWidth = Math.round(scale * naturalSize.width)
      this.imgHeight = Math.round(scale * naturalSize.height)
      this.mouseUpVector.x = this.moveVector.x = (clientWidth - this.imgWidth) / 2
      this.mouseUpVector.y = this.moveVector.y = (clientHeight - this.imgHeight - 80) / 2
      this.scale = scale
      this.tempScale = scale
      this.setRotate(-this.rotateZ)
    },
    mouseWheel(e) {
      if (this.activedImage.loadStatus !== 'loaded') return false
      if (e.wheelDelta > 0) {
        this.tempScale = parseFloat((this.tempScale + 0.1).toFixed(1))
      } else if (this.tempScale > 0.2) {
        this.tempScale = parseFloat((this.tempScale - 0.1).toFixed(1))
      }
      if (this.timerScale) {
        window.clearTimeout(this.timerScale)
      }
      this.timerScale = window.setTimeout(() => {
        this.setScale(this.tempScale)
        this.showScaleTip()
        this.timerScale = null
      }, 50)
    },
    clickMask() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      if (this.closeOnClickMask) this.clickClose()
    },
    clickClose() {
      if (this.activedImage.loadStatus === 'loaded') this.setScale(0)
      setTimeout(() => {
        this.$emit('close')
      }, 300)
    },
    clickZoomIn() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      this.setScale(this.tempScale = parseFloat((this.tempScale + 0.1).toFixed(1)))
      this.showScaleTip()
    },
    clickZoomOut() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      if (this.tempScale > 0.2) {
        this.setScale(this.tempScale = parseFloat((this.tempScale - 0.1).toFixed(1)))
      }
      this.showScaleTip()
    },
    clickZoomInit() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      this.setScale(this.tempScale = 1)
      this.showScaleTip()
    },
    clickPrev() {
      if (this.activedIndex > 0) {
        this.selectImg(--this.activedIndex)
      } else {
        this.selectImg(this.activedIndex = this.imageOptions.length - 1)
      }
    },
    clickNext() {
      if (this.activedIndex < this.imageOptions.length - 1) {
        this.selectImg(++this.activedIndex)
      } else {
        this.selectImg(this.activedIndex = 0)
      }
    },
    clickRotateLeft() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      this.setRotate(-90)
    },
    clickRotateRight() {
      if (this.activedImage.loadStatus !== 'loaded') return false
      this.setRotate(90)
    },
    mouseDown(e) {
      this.isMouseDownInImg = true
      this.moveStartPoint.x = e.clientX
      this.moveStartPoint.y = e.clientY
    },
    mouseUp() {
      this.isMouseDownInImg = false
      this.mouseUpVector.x = this.moveVector.x
      this.mouseUpVector.y = this.moveVector.y
    },
    mouseMove(e) {
      if (this.isMouseDownInImg) {
        this.moveVector.x = this.mouseUpVector.x - (this.moveStartPoint.x - e.clientX)
        this.moveVector.y = this.mouseUpVector.y - (this.moveStartPoint.y - e.clientY)
      }
    },
    keydown(e) {
      const keyCode = e.keyCode
      switch (keyCode) {
        case 27:
          e.preventDefault()
          this.clickClose()
          break;
        case 38:
          e.preventDefault()
          this.clickZoomIn()
          break;
        case 40:
          e.preventDefault()
          this.clickZoomOut()
          break;
        case 37:
          e.preventDefault()
          this.clickPrev()
          break;
        case 39:
          e.preventDefault()
          this.clickNext()
          break;
        default:
          break;
      }
    },
    
    // 加载图片，不可预览的文件不适用
    async loadImg(imgOption) {
      return new Promise(function (resolve) {
        if (imgOption.cantPreview) {
          resolve(false)
        } else if (['loaded', 'loading'].indexOf(imgOption.loadStatus) >= 0) {
          resolve(imgOption.loadStatus)
        } else {
          imgOption.loadStatus = 'loading'
          const img = new Image()
          img.src = imgOption.url
          img.onload = function () {
            imgOption.loadStatus = 'loaded'
            imgOption.naturalSize = {
              width: img.width,
              height: img.height,
            }
            imgOption.height = img.height
            resolve(imgOption.loadStatus)
          }
          img.onerror = function () {
            imgOption.loadStatus = 'fail'
            resolve(imgOption.loadStatus)
          }
        }
      }).catch((error) => {
        throw new Error(error)
      })
    },
    async selectImg(index) {
      this.activedIndex = index
      const activedImage = this.imageOptions[this.activedIndex]
      if (!activedImage.cantPreview) {
        const loadStatus = await this.loadImg(activedImage)
        if (loadStatus === 'loaded') this.setInitPosition(activedImage.naturalSize)
      }
      this.$emit('select', activedImage, index)
    },
  },
  async mounted() {
    this.activedIndex = this.defaultIndex ? this.defaultIndex : 0
    this.imageOptions.forEach(item => {
      if (item.id === undefined) this.$set(item, 'id', ++this.id)
      // unload表示未下载，loading表示下载中，loaded表示已下载，fail表示下载失败
      if (item.loaded === undefined) this.$set(item, 'loadStatus', 'unload')
      if (item.filename === undefined) this.$set(item, 'filename', '未命名')
    })
    await this.selectImg(this.activedIndex)
    if (this.loadMode === 'auto') {
      for (let imageOption of this.imageOptions) {
        await this.loadImg(imageOption)
      }
    }
  },
  created() {
    window.addEventListener('keydown', this.keydown)
    document.body.style.overflow = 'hidden'
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.keydown)
    document.body.style.overflow = ''
  }
}
</script>

<style lang="stylus" scoped>
.image-viewer-loading
  animation image-viewer-loading 1s linear infinite
  border 4px solid rgba(255, 255, 255, .1)
  border-left-color rgba(255, 255, 255, .5)
  border-radius 50%
  content ''
  display inline-block
  height 40px
  width 40px
  z-index 1

@keyframes image-viewer-loading
  0%
    -webkit-transform rotate(0deg)
    transform rotate(0deg)
  100%
    -webkit-transform rotate(360deg)
    transform rotate(360deg)

.image-viewer
  display flex
  flex-direction column
  justify-content flex-end
  align-items center
  position fixed
  left 0
  top 0
  right 0
  bottom 0
  z-index 9999
  background rgba(0,0,0,.5)
  user-select none

.image-viewer-content
  position absolute
  top 0
  bottom 0
  width 100%
  .u-loading-img
    position absolute
    left 50%
    top 50%
    height 40px
    width 40px
    margin-left -20px
    margin-top -20px
    font-size 16px
    color #fff
  .u-real-img
    cursor move
    cursor -webkit-grab
    cursor grab
    &.u-transition
      transition all 0.3s
  .u-not-found
    position absolute
    top 50%
    left 50%
    margin-left -100px
    margin-top -150px
    width 200px
    text-align center
    .u-not-found-img
      margin 0 auto
      width 128px
      height 128px
      background url('./imgs/notfound.svg') center no-repeat
      background-size contain
    .u-tip
      margin-top 20px
      color #ccc
      font-size 12px
    .u-link
      color #409EFF
      cursor pointer


.image-viewer-file-name
  position relative
  font-size 12px
  text-align center
  margin-bottom 10px
  color #ccc

.image-viewer-btns
  position relative
  text-align center
  margin-bottom 58px
  .u-item
    display inline-block
    margin 0 3px
    width 24px
    height 24px
    border-radius 24px
    background rgba(0,0,0,.5)
    color #eee
    font-size 14px
    line-height 24px
    text-align center
    cursor pointer
    transition background-color .15s
    &:hover
      background rgba(0,0,0,.8)
    &::before
      content ''
      display block
      width 20px
      height 20px
      line-height 20px
      font-size 0
      margin 2px
      background-image url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAAUCAYAAABWOyJDAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAQPSURBVHic7Zs/iFxVFMa/0U2UaJGksUgnIVhYxVhpjDbZCBmLdAYECxsRFBTUamcXUiSNncgKQbSxsxH8gzAP3FU2jY0kKKJNiiiIghFlccnP4p3nPCdv3p9778vsLOcHB2bfveeb7955c3jvvNkBIMdxnD64a94GHMfZu3iBcRynN7zAOI7TG15gHCeeNUkr8zaxG2lbYDYsdgMbktBsP03jdQwljSXdtBhLOmtjowC9Mg9L+knSlcD8TNKpSA9lBpK2JF2VdDSR5n5J64m0qli399hNFMUlpshQii5jbXTbHGviB0nLNeNDSd9VO4A2UdB2fp+x0eCnaXxWXGA2X0au/3HgN9P4LFCjIANOJdrLr0zzZ+BEpNYDwKbpnQMeAw4m8HjQtM6Z9qa917zPQwFr3M5KgA6J5rTJCdFZJj9/lyvGhsDvwFNVuV2MhhjrK6b9bFiE+j1r87eBl4HDwCF7/U/k+ofAX5b/EXBv5JoLMuILzf3Ap6Z3EzgdqHMCuF7hcQf4HDgeoHnccncqdK/TvSDWffFXI/exICY/xZyqc6XLWF1UFZna4gJ7q8BsRvgd2/xXpo6P+D9dfT7PpECtA3cnWPM0GXGFZh/wgWltA+cDNC7X+AP4GzjZQe+k5dRxuYPeiuXU7e1qwLpDz7dFjXKRaSwuMLvAlG8zZlG+YmiK1HoFqT7wP2z+4Q45TfEGcMt01xLoNZEBTwRqD4BLpnMLeC1A41UmVxsXgXeBayV/Wx20rpTyrpnWRft7p6O/FdqzGrDukPNtkaMoMo3FBdBSQMOnYBCReyf05s126fU9ytfX98+mY54Kxnp7S9K3kj6U9KYdG0h6UdLbkh7poFXMfUnSOyVvL0h6VtIXHbS6nOP+s/Zm9mvyXW1uuC9ohZ72E9uDmXWLJOB1GxsH+DxPftsB8B6wlGDN02TAkxG6+4D3TWsbeC5CS8CDFce+AW500LhhOW2020TRjK3b21HEmgti9m0RonxbdMZeVzV+/4tF3cBpP7E9mKHNL5q8h5g0eYsCMQz0epq8gQrwMXAgcs0FGXGFRcB9wCemF9PkbYqM/Bas7fxLwNeJPdTdpo4itQti8lPMqTpXuozVRVXPpbHI3KkNTB1NfkL81j2mvhDp91HgV9MKuRIqrykj3WPq4rHyL+axj8/qGPmTqi6F9YDlHOvJU6oYcTsh/TYSzWmTE6JT19CtLTJt32D6CmHe0eQn1O8z5AXgT4sx4Vcu0/EQecMydB8z0hUWkTd2t4CrwNEePqMBcAR4mrBbwyXLPWJa8zrXmmLEhNBmfpkuY2102xxrih+pb+ieAb6vGhuA97UcJ5KR8gZ77K+99xxeYBzH6Q3/Z0fHcXrDC4zjOL3hBcZxnN74F+zlvXFWXF9PAAAAAElFTkSuQmCC")
      background-repeat no-repeat
  .u-icon-zoom-in::before
    background-position 0 0
  .u-icon-zoom-out::before
    background-position -20px 0
  .u-icon-one-to-one::before
    background-position -40px 0
  .u-icon-prev::before
    background-position -80px 0
  .u-icon-next::before
    background-position -120px 0
  .u-icon-rotate-left::before
    background-position -140px 0
  .u-icon-rotate-right::before
    background-position -160px 0
.image-viewer-scale
  position absolute
  top 50%
  left 50%
  margin-left -20px
  margin-top -10px
  width 40px
  height 20px
  line-height 20px
  border-radius 20px
  text-align center
  color #fff
  background rgba(0,0,0,.8)
  opacity 0
  transition opacity 0.3s
  &.u-transition
    opacity 1

.image-viewer-list
  position absolute
  bottom 0
  width 100%
  text-align center
  font-size 0
  background rgba(0,0,0,.5)
  .u-item
    display inline-block
    margin 0 1px 1px
    width 30px
    height 50px
    line-height 50px
    color #ccc
    font-size 14px
    overflow hidden
    cursor pointer
    &.u-actived
      .u-real-img,.u-not-found-img,.u-default-image
        opacity 1
  .u-loading-img
    width 20px
    height 20px
    border-width 2px
    vertical-align middle
  .u-real-img
    object-fit cover
  .u-not-found-img
    background url('./imgs/notfound.svg') center no-repeat
    background-size contain
  .u-default-image
    background url('./imgs/default.svg') center no-repeat
    background-size contain
  .u-real-img,.u-not-found-img,.u-default-image
    width 100%
    height 100%
    opacity 0.5
    transition opacity .15s
    &:hover
      opacity 0.75

.image-viewer-icon-close
  position absolute
  top 20px
  right 20px
  width 40px
  height 40px
  background url('./imgs/close.svg') center no-repeat
  background-size 100%
  cursor pointer
  opacity .5
  transition opacity .15s
  &:hover
    opacity 1
</style>
