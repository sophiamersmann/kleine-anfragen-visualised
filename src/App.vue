<template>
  <root
    src-requests="./data/requests"
    src-requests-per-head="./data/requests-per-head.csv"
    src-elections="./data/elections.csv" />
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
