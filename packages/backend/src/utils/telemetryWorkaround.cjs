const applicationinsights = require("applicationinsights");

module.exports = {
  getClient: () => applicationinsights.defaultClient,
  getCorrelationContext: () => applicationinsights.getCorrelationContext(),
  setup: (str) => applicationinsights.setup(str),
};
