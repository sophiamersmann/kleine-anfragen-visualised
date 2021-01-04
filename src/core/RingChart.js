export default class RingChart {
  constructor(selector) {
    this.selector = selector;

    // data
    this.requests = null;

    // options
    this.svg = null;
    this.width = null;
    this.height = null;
  }

  data(requests) {
    this.requests = requests;
    return this;
  }
}
