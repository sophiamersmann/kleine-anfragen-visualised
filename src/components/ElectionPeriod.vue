<template>
  <div class="election-period">
    <h1>Election Period</h1>
    <p>Body: {{ body }}</p>
    <p>Term: {{ term }}</p>
    <p>data: {{ data.length }}</p>
  </div>
</template>

<script>
export default {
  name: 'ElectionPeriod',
  props: {
    body: String,
    term: String,
    data: Object,
  },
};
</script>

<style scoped>
.election-period {
  background-color: aliceblue;
}
</style>
