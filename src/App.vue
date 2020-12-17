<template>
  <election-period-list data-src="./data_vParties_slim.csv"/>
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
