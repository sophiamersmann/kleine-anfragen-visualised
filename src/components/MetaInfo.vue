<template>
  <div class="meta">
    <div>
      <div class="meta-section--title">Autorin</div>
      <div class="meta-section--content">
        Sophia Mersmann
        <a href="https://sophiamersmann.github.io/portfolio/" target="_blank">
          (Portfolio)
        </a>
      </div>
    </div>
    <div>
      <div class="meta-section--title">Datum</div>
      <div class="meta-section--content">25.1.2020</div>
    </div>
    <div>
      <div class="meta-section--title">Source Code</div>
      <div class="meta-section--content">
        <a href="https://github.com/sophiamersmann/kleine-anfragen-visualised" target="_blank">
          Verfügbar auf Github
        </a>
      </div>
    </div>
    <div>
      <div class="meta-section--title">Kontakt</div>
      <div class="meta-section--content">
        <a class="contact-information" href="mailto:sophia.mersmann.blog@gmail.com" target="_blank">
          sophia.mersmann.blog@gmail.com
        </a>
        <a class="contact-information" href="https://twitter.com/sophiamersmann" target="_blank">
          Twitter
        </a>
        <a class="contact-information" href="https://github.com/sophiamersmann" target="_blank">
          GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MetaInfo',
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/global';

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  max-width: $text-max-width;
  gap: $spacing / 2;
  margin: 0 auto;
  line-height: 1.5;

  .meta-section--title {
    font-weight: bold;
    margin-bottom: 5px;
  }
}

.contact-information {
  margin-right: 4px;

  &[href*="mailto:"] {
    word-wrap: anywhere;
  }
}
</style>
