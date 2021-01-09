<template>
  <div class="ministry-button-group">
    <ministry-button
      v-for="ministry in ministries"
      :key=ministry
      :value=ministry
      :active="ministry === selectedMinistry"
      @clicked="onClick" />
  </div>
</template>

<script>
import MinistryButton from './MinistryButton.vue';

export default {
  name: 'MinistryButtonGroup',
  components: {
    MinistryButton,
  },
  props: {
    ministries: Array,
  },
  emits: ['selected'],
  data() {
    return {
      selectedMinistry: null,
    };
  },
  created() {
    [this.selectedMinistry] = this.ministries;
  },
  methods: {
    onClick(selectedMinistry) {
      this.selectedMinistry = selectedMinistry;
      this.$emit('selected', selectedMinistry);
    },
  },
};
</script>

<style scoped>
.ministry-button-group {
  /* Magic value (popup height - heading height - margins etc.) */
  height: calc(var(--popup-height) - 150px);
  overflow-y: auto;
}
</style>
