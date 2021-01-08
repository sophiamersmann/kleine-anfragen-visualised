<template>
  <root
    src-requests="./_requests_v0.1_bawu15.csv"
    src-elections="./elections.csv" />
</template>

<script>
import Root from './components/Root.vue';

export default {
  name: 'App',
  components: {
    Root,
  },
};
</script>
