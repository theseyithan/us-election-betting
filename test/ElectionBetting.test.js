const ElectionBetting = artifacts.require("ElectionBetting");
const truffleAssert = require('truffle-assertions');

async function setTime(timestamp) {
  await web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_setTime',
    params: [timestamp * 1000], // Ganache expects milliseconds
    id: new Date().getTime()
  }, () => { });

  // Mine a new block to make sure the new time is recorded
  await web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_mine',
    params: [],
    id: new Date().getTime()
  }, () => { });
}

contract("ElectionBetting", async accounts => {
  let electionBetting;
  const owner = accounts[0];
  const hippie = accounts[1];
  const redneck = accounts[2];

  const futureTime = web3.utils.toBN(Math.floor(Date.now() / 1000) + 3600); // 1 hour in the future

  beforeEach(async () => {
    initialTime = Math.floor(Date.now() / 1000);
    await setTime(initialTime);

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
    const outcome = ElectionBetting.Outcome.Democrat;
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    const hippieBet = await electionBetting.bets(hippie, outcome);
    assert.equal(hippieBet.toString(), betAmount, "Bet amount is incorrect");
  });

  it("should emit BetPlaced event when a bet is placed", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = ElectionBetting.Outcome.Democrat;
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

    await setTime(futureTime.toNumber() + 1);

    await truffleAssert.reverts(
      electionBetting.placeBet(outcome, { from: hippie, value: betAmount }),
      "Betting period has ended"
    );
  });

  it("should allow owner to resolve the election after betting has ended", async () => {
    await setTime(futureTime.toNumber() + 1);

    const outcome = 1;
    await electionBetting.resolveElection(outcome, { from: owner });

    const resolvedWinner = await electionBetting.winner();
    assert.equal(resolvedWinner.toString(), outcome, "Winner is incorrect");

    const isResolved = await electionBetting.electionResolved();
    assert.equal(isResolved, true, "Election should be resolved");
  });

  it("should not allow non-owner to resolve the election", async () => {
    await setTime(futureTime.toNumber() + 1);

    await truffleAssert.reverts(
      electionBetting.resolveElection(1, { from: hippie }),
      "Only the owner can call this function"
    );
  });

  it("should not allow resolving the election before betting has ended", async () => {
    await truffleAssert.reverts(
      electionBetting.resolveElection(1, { from: owner }),
      "Betting period has not ended"
    );
  });

  it("should not allow resolving the election twice", async () => {
    await setTime(futureTime.toNumber() + 1);

    await electionBetting.resolveElection(1, { from: owner });

    await truffleAssert.reverts(
      electionBetting.resolveElection(1, { from: owner }),
      "Election has already been resolved"
    );
  });

  it("should allow winner to withdraw their winnings", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = ElectionBetting.Outcome.Democrat;
    
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    await setTime(futureTime.toNumber() + 1);

    await electionBetting.resolveElection(outcome, { from: owner });

    const initialBalance = await web3.eth.getBalance(hippie);
    await electionBetting.claimWinnings({ from: hippie });
    const finalBalance = await web3.eth.getBalance(hippie);

    assert(finalBalance > initialBalance, "Balance should increase after withdrawal");
  });

  it("should emit WinningsClaimed event when winnings are claimed", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = ElectionBetting.Outcome.Democrat;
    
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    await setTime(futureTime.toNumber() + 1);

    await electionBetting.resolveElection(outcome, { from: owner });

    const tx = await electionBetting.claimWinnings({ from: hippie });

    truffleAssert.eventEmitted(tx, 'WinningsClaimed', (ev) => {
      return ev.claimant === hippie,
        ev.amount.toString() === betAmount;
    }, 'WinningsClaimed event should be emitted with correct parameters');
  });

  it("should not allow non-winners to withdraw winnings", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = ElectionBetting.Outcome.Democrat;
    
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    await setTime(futureTime.toNumber() + 1);

    await electionBetting.resolveElection(
      ElectionBetting.Outcome.Republican, { from: owner }
    );

    await truffleAssert.reverts(
      electionBetting.claimWinnings({ from: hippie }),
      "You have no bets on the winning outcome"
    );
  });

  it("should not allow winners to withdraw winnings twice", async () => {
    const betAmount = web3.utils.toWei('1', 'ether');
    const outcome = ElectionBetting.Outcome.Democrat;
    
    await electionBetting.placeBet(outcome, { from: hippie, value: betAmount });

    await setTime(futureTime.toNumber() + 1);

    await electionBetting.resolveElection(outcome, { from: owner });

    await electionBetting.claimWinnings({ from: hippie });

    await truffleAssert.reverts(
      electionBetting.claimWinnings({ from: hippie }),
      "You have already claimed your winnings"
    );
  });

  it("should not allow withdrawing winnings before election is resolved", async () => {
    await truffleAssert.reverts(
      electionBetting.claimWinnings({ from: hippie }),
      "You can only claim winnings after the election has been resolved"
    );
  });
});