<template>
  <div class="ministry-button-group">
    <ministry-button
      v-for="(ministry, i) in ministries"
      :key=i
      :id=i
      :value=ministry.name
      :active="ministry.name === selectedMinistry"
      :requests=ministry.requests
      :maxValue=nRequests
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
      nRequests: null,
    };
  },
  created() {
    this.selectedMinistry = this.ministries[0].name;
    this.nRequests = this.ministries[0].requests
      .flatMap((d) => d.parties).length;
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
