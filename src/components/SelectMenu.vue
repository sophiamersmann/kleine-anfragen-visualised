<template>
  <div class="select-menu">
    <select
      v-model=ministry
      @change=onChange>
      <option
        v-for="(ministry, i) in ministries"
        :key=i
        :value=ministry>
        {{ ministry }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'SelectMenu',
  props: {
    ministries: Array,
  },
  emits: ['selected'],
  data() {
    return {
      ministry: this.ministries[0],
    };
  },
  methods: {
    onChange() {
      this.$emit('selected', this.ministry);
    },
  },
};
</script>

<style scoped>
select {
  max-width: calc(var(--popup-width) - var(--popup-height) - 2 * var(--spacing));
}
</style>
