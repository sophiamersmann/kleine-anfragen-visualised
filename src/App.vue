<template>
  <root
    src-requests="./requests_v0.1.csv"
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
