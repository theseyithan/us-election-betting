const ElectionBetting = artifacts.require("ElectionBetting");

module.exports = function (deployer) {
  // Betting ends on Tuesday, November 5, 2024 12:00:00 AM EST
  const bettingEndDateTime = new Date('2024-11-05T05:00:00Z').getTime() / 1000;
  deployer.deploy(ElectionBetting, bettingEndDateTime);
}