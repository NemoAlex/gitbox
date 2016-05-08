Dropzone.options.uploadDropzone = {
  init: function() {
    this.on("complete", function(file) {
      vue.fetch()
    });
  }
}

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
    renameFolderName: ''
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
      if (val === 'renameFolder') this.$els.renamefoldername.focus()
      else if (val === 'createFolder') this.$els.createfoldername.focus()
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
        this.fetch()
      })
    },
    'renameFolder': function () {
      this.nowShowing = ''
      this.$http.post('/rename', {
        path: this.path,
        newname: this.renameFolderName
      })
      .then(function (res) {
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
  }
})


