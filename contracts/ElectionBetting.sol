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

  event BetPlaced(address indexed better, Outcome indexed outcome, uint amount);
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

  // TODO: Implement function for users to claim winnings
  // TODO: Implement function to calculate and update odds
  // TODO: Implement function to get current betting odds

}
