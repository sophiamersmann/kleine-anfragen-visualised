<template>
  <div class="data-button-group">
    <data-button
      v-for="option in options"
      :key=option.value
      :value=option.value
      :label=option.label
      :active=option.active
      @clicked="onClick" />
  </div>
</template>

<script>
import DataButton from './DataButton.vue';

export default {
  name: 'DataButtonGroup',
  components: {
    DataButton,
  },
  props: {
    options: Array,
  },
  emits: ['clicked'],
  methods: {
    onClick(value) {
      this.options.map((d) => {
        const e = d;
        e.active = e.value === value;
        return e;
      });
      this.$emit('clicked', value);
    },
  },
};
</script>
