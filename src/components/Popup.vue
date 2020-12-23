<template>
  <div class="popup">
    Popup {{ name }}
  </div>
</template>

<script>
export default {
  name: 'Popup',
  props: {
    name: String,
    body: String,
    term: String,
    dates: Object,
    hasEnded: Boolean,
    requests: Object,
  },
};
</script>

<style scoped>
.popup {
  background-color: burlywood;

  position: fixed;
  z-index: 2000;
  top: var(--popup-offset);
  left: var(--popup-offset);
  width: calc(100vw - 2 * var(--popup-offset));
  height: calc(100vh - 2 * var(--popup-offset));
}
</style>
