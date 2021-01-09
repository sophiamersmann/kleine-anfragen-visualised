<template>
  <button :class=classes @click="onClick">
    <div class="label">
      {{ value }}
    </div>
    <div class="chart">
      G
    </div>
  </button>
</template>

<script>
export default {
  name: 'MinistryButton',
  props: {
    value: String,
    active: Boolean,
  },
  emits: ['clicked'],
  computed: {
    classes() {
      return {
        'ministry-button': true,
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
button {
  width: 100%;
  margin: calc(var(--spacing) / 4) 0;
  border: 0;

  display: grid;
  grid-template-columns: 1fr 50px;
  align-items: center;
}

.active {
  background-color: cornflowerblue;
}

.label {
  justify-self: start;
  text-align: left;
}

.chart {
  justify-self: end;
}
</style>
