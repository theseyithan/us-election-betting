// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectionBetting {
  enum Outcome { Democrat, Republican }

  address public owner;
  uint public bettingEndDateTime;
  bool public bettingEnded;
  bool public electionResolved;
  Outcome public winner;

  mapping(address => mapping(Outcome => uint)) public bets;
  mapping(Outcome => uint) public totalBets;

  mapping(address => uint) public claimedWinnings;

  event BetPlaced(address indexed better, Outcome indexed outcome, uint amount);
  event WinningsClaimed(address indexed claimant, Outcome indexed outcome, uint amount);
  event ElectionResolved(Outcome indexed winner);

  constructor(uint _bettingEndDateTime) {
    owner = msg.sender;
    bettingEndDateTime = _bettingEndDateTime;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only the owner can call this function");
    _;
  }

  modifier bettingOpen() {
    require(block.timestamp < bettingEndDateTime, "Betting period has ended");
    _;
  }

  function placeBet(Outcome _outcome) external payable bettingOpen {
    require(msg.value > 0, "Bet amount must be greater than 0");

    bets[msg.sender][_outcome] += msg.value;
    totalBets[_outcome] += msg.value;

    emit BetPlaced(msg.sender, _outcome, msg.value);
  }

  function resolveElection(Outcome _winner) external onlyOwner {
    require(block.timestamp >= bettingEndDateTime, "Betting period has not ended");
    require(!electionResolved, "Election has already been resolved");

    winner = _winner;
    electionResolved = true;

    emit ElectionResolved(_winner);
  }

  function claimWinnings() external {
    require(electionResolved, "You can only claim winnings after the election has been resolved");
    require(claimedWinnings[msg.sender] == 0, "You have already claimed your winnings");
    require(bets[msg.sender][winner] > 0, "You have no bets on the winning outcome");

    uint winningAmount = bets[msg.sender][winner];
    uint totalWinningBetsAmount = totalBets[winner];
    uint totalBetsAmount = totalBets[Outcome.Democrat] + totalBets[Outcome.Republican];

    uint amountWon = (winningAmount * totalBetsAmount) / totalWinningBetsAmount;
    bets[msg.sender][winner] = 0;
    claimedWinnings[msg.sender] = amountWon;

    (bool success, ) = msg.sender.call{value: amountWon}("");
    require(success, "Failed to send winnings to the better");

    emit WinningsClaimed(msg.sender, winner, amountWon);
  }

  // TODO: Implement function to calculate and update odds
  // TODO: Implement function to get current betting odds

}
