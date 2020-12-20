<template>
  <main>
    <election-period-list
      src-requests="./data_vParties_slim.csv"
      src-elections="./elections.csv" />
  </main>
</template>

<script>
import ElectionPeriodList from './components/ElectionPeriodList.vue';

export default {
  name: 'App',
  components: {
    ElectionPeriodList,
  },
};
</script>

<style>
main {
  padding: var(--spacing);
}
</style>
