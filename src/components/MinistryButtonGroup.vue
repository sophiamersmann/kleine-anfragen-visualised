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
      :sortedParties=sortedParties
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
    sortedParties: Array,
  },
  emits: ['selected'],
  data() {
    return {
      selectedMinistry: null,
    };
  },
  computed: {
    nRequests() {
      if (this.ministries === null) return null;
      return this.ministries[0].requests
        .flatMap((d) => d.parties).length;
    },
  },
  created() {
    if (this.ministries !== null) {
      this.selectedMinistry = this.ministries[0].name;
    }
  },
  updated() {
    if (this.selectedMinistry === null && this.ministries !== null) {
      this.selectedMinistry = this.ministries[0].name;
    }
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
  max-height: calc(var(--popup-height) - 350px);
  overflow-y: auto;
}
</style>
