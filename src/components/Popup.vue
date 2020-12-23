<template>
  <div class="popup">Popup {{ name }}</div>
  <div class="overlay" @click="onClick"></div>
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
  emits: ['flat'],
  methods: {
    onClick() {
      this.$emit('flat');
    },
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

  animation-name: scale-in;
  animation-duration: 0.3s;
  animation-timing-function: ease;
}

.overlay {
  background: rgba(143, 27, 15, 0.8);

  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  animation-name: fade-in;
  animation-duration: 0.3s;
  animation-timing-function: ease;
}

@keyframes scale-in {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
