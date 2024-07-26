const ElectionBetting = artifacts.require("ElectionBetting");

module.exports = function (deployer) {
  deployer.deploy(ElectionBetting);
}