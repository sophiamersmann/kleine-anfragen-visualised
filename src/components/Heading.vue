<template>
  <h1>
    <a class="no-style kleine-anfragen" href="https://kleineanfragen.de/" target="_blank">
      kleineAnfragen
    </a>
    <span class="visualised"> visualisiert</span>
  </h1>
</template>

<script>
export default {
  name: 'Heading',
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/global';

h1 {
  border-bottom: 1px solid $black;
  text-align: center;
  padding-bottom: 5px;

  .kleine-anfragen {
    font-family: 'Raleway', sans-serif;
    text-decoration: none;
    color: inherit;
  }

  .visualised {
    font-family: 'Quicksand', sans-serif;
    font-weight: bold;
  }
}
</style>
