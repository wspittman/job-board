const applicationinsights = require("applicationinsights");

module.exports = {
  getClient: () => applicationinsights.defaultClient,
  setup: (str) => applicationinsights.setup(str),
};
