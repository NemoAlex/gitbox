Dropzone.autoDiscover = false

var treePart = Vue.extend({
  template: '#tree-part',
  data: function () {
    return {
      expanded: false,
      selected: false
    }
  },
  props: ['tree'],
  name: 'tree-part',
  computed: {
    'icon': function () {
      if (this.tree.type === 'folder') {
        if (!this.tree.children.length) return 'fa-folder-o'
        if (this.expanded) return 'fa-folder-open'
        return 'fa-folder'
      }
      else return 'fa-file-o'
    }
  },
  methods: {
    select: function () {
      this.$dispatch('select', this)
    }
  }
})

Vue.component('tree-part', treePart)

var vue =  new Vue({
  el: '#gitbox',
  data: {
    tree: {},
    navigator: [''],
    selecting: {},
    nowShowing: '',
    createFolderName: '',
    renameFolderName: '',
    renameFileName: '',
    dropzone: {}
  },
  computed: {
    'navigator': function () {
      if (!this.selecting.tree || !this.selecting.tree.path) return ['']
      return this.selecting.tree.path.replace(this.root, '').split('/')
    },
    'path': function () {
      if (!this.selecting.tree || !this.selecting.tree.path) return ''
      return this.selecting.tree.path.replace(this.root, '')
    }
  },
  watch: {
    'nowShowing': function (val) {
      if (val === 'renameFolder') {
        this.renameFolderName = this.navigator[this.navigator.length - 1]
        this.$els.renamefoldername.focus()
      }
      else if (val === 'renameFile') {
        this.renameFileName = this.navigator[this.navigator.length - 1]
        this.$els.renamefilename.focus()
      }
      else if (val === 'createFolder') this.$els.createfoldername.focus()
    },
    'path': function () {
      this.nowShowing = ''
      this.dropzone.removeAllFiles()
    }
  },
  events: {
    'select': function (component) {
      if (component.selected && component.expanded) component.expanded = false
      else component.expanded = true
      this.selecting.selected = false
      component.selected = true
      this.selecting = component
    }
  },
  methods: {
    'fetch': function () {
      this.$http.get('/tree')
      .then(function (res) {
        vue.root = res.data.root
        vue.tree = res.data.tree
      })
    },
    'createFolder': function () {
      this.nowShowing = ''
      this.$http.post('/create_folder', {
        path: this.path + '/' + this.createFolderName
      })
      .then(function (res) {
        this.createFolderName = ''
        this.fetch()
      })
    },
    'rename': function (newname) {
      this.nowShowing = ''
      this.$http.post('/rename', {
        path: this.path,
        newname: newname
      })
      .then(function (res) {
        this.renameFolderName = ''
        this.fetch()
        this.$emit('select', this.$children[0])
      })
    },
    'remove': function () {
      this.nowShowing = ''
      this.$http.post('/remove', {
        path: this.path
      })
      .then(function (res) {
        this.fetch()
        this.$emit('select', this.$children[0])
      })
    }
  },
  ready: function () {
    this.fetch()
    this.$emit('select', this.$children[0])
    this.dropzone = new Dropzone("#upload-dropzone");
    this.dropzone.on("complete", function(file) {
      vue.fetch()
    });
  }
})


