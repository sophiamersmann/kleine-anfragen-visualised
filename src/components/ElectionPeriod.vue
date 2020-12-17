<template>
  <div class="election-period">
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
  margin: var(--spacing) 0;
  padding: calc(var(--spacing) / 2);
}
.election-period:first-of-type {
  margin-top: 0;
}
.election-period:last-of-type {
  margin-bottom: 0;
}
</style>
