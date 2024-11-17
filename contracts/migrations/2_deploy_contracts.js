const Contacts = artifacts.require("../contracts/Contracts.sol");

module.exports = function(deployer) {
    deployer.deploy(Contacts);
};