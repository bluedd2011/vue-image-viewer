import VueImageViewer from './src/vue-image-viewer'

VueImageViewer.install = function (Vue) {
  Vue.component(VueImageViewer.name, VueImageViewer)
}

export default VueImageViewer
