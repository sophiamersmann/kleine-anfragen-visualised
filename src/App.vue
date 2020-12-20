<template>
  <main>
    <election-period-list
      src-requests="./data_vParties_slim.csv"
      src-elections="./elections.csv" />
  </main>
  <nav></nav>
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
#app {
  display: grid;
  grid-template-columns: 1fr minmax(50px, 10%);
  padding: var(--spacing);
}

nav {
  background-color: bisque;
}
</style>
