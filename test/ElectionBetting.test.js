const ElectionBetting = artifacts.require("ElectionBetting");
const truffleAssert = require('truffle-assertions');

contract("ElectionBetting", async accounts => {
  let electionBetting;
  const owner = accounts[0];
  const hippie = accounts[1];
  const redneck = accounts[2];

  const futureTime = web3.utils.toBN(Math.floor(Date.now() / 1000) + 3600); // 1 hour in the future
  const pastTime = web3.utils.toBN(Math.floor(Date.now() / 1000) - 3600); // 1 hour in the past

  beforeEach(async () => {
    electionBetting = await ElectionBetting.new(futureTime, { from: owner });
  });

  it("should set the owner correctly", async () => {
    assert.equal(await electionBetting.owner(), owner);
  });

  it("should set the betting end date correctly", async () => {
    assert.equal(await electionBetting.bettingEndDateTime(), futureTime.toString());
  });

  it("should allow placing a bet", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = 0; // 0 is Democrat, 1 is Republican
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    const hippieBet = await electionBetting.bets(hippie, outcome);
    assert.equal(hippieBet.toString(), betAmount, "Bet amount is incorrect");
  });

  it("should emit BetPlaced event when a bet is placed", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = 0; // 0 is Democrat, 1 is Republican
    const tx = await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    truffleAssert.eventEmitted(tx, 'BetPlaced', (ev) => {
      return ev.better === hippie && 
             ev.outcome.toNumber() === outcome && 
             ev.amount.toString() === betAmount;
    }, 'BetPlaced event should be emitted with correct parameters');
  });

  it("should not allow placing a bet after betting has ended", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = 0; // 0 is Democrat, 1 is Republican

    const endedElectionBetting = await ElectionBetting.new(pastTime, { from: owner });

    await truffleAssert.reverts(
      endedElectionBetting.placeBet(outcome, { from: hippie, value: betAmount }),
      "Betting period has ended"
    );
  });
});