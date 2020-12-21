<template>
  <top
    src-requests="./data_vParties_slim.csv"
    src-elections="./elections.csv" />
</template>

<script>
import Top from './components/Top.vue';

export default {
  name: 'App',
  components: {
    Top,
  },
};
</script>
