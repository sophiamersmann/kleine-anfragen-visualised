<template>
  <button :class=classes @click="onClick">
    {{ label }}
  </button>
</template>

<script>
export default {
  name: 'DataButton',
  props: {
    value: String,
    label: String,
    active: Boolean,
  },
  emits: ['clicked'],
  computed: {
    classes() {
      return {
        'data-button': true,
        active: this.active,
      };
    },
  },
  methods: {
    onClick() {
      this.$emit('clicked', this.value);
    },
  },
};
</script>

<style scoped>
.active {
  background-color: cornflowerblue;
}
</style>
