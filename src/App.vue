<template>
  <root
    src-requests="./requests.csv"
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
