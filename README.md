# ElectionBetting Smart Contract

ElectionBetting is an Ethereum-based smart contract that allows users to place bets on the outcome of a US election. Users can bet on either a Democratic or Republican victory, with odds dynamically adjusting based on the distribution of bets.

## Features

- Place bets on Democratic or Republican victory
- Dynamic odds calculation based on bet distribution
- Time-limited betting period
- Secure winner declaration by contract owner
- Automated winnings distribution
- Prevention of double-claiming winnings

## Contract Structure

The contract includes the following main components:

- `Outcome` enum: Represents possible election outcomes (Democrat or Republican)
- `Odds` struct: Stores current odds for both outcomes
- State variables: Track owner, betting period, election status, and winner
- Mappings: Store bets, total bets, current odds, and claimed winnings
- Events: Emit information about bets placed, winnings claimed, and election resolution

## Main Functions

1. `placeBet(Outcome _outcome)`: Allow users to place bets during the open betting period
2. `updateOdds()`: Internal function to recalculate odds after each bet
3. `getOdds()`: Return current betting odds
4. `resolveElection(Outcome _winner)`: Allow owner to declare the election winner after betting period ends
5. `claimWinnings()`: Allow winners to claim their winnings after election resolution

## Usage

1. Deploy the contract with a specified end date for the betting period
2. Users can place bets using the `placeBet` function
3. Check current odds using the `getOdds` function
4. After the betting period ends, the owner resolves the election
5. Winners can claim their winnings using the `claimWinnings` function

## Security Features

- Time-based restrictions on betting and resolving the election
- Only the contract owner can resolve the election
- Prevention of double-claiming winnings
- Checks for valid bet amounts and winning claims

## Development and Testing

This contract is developed using Solidity ^0.8.0. It's recommended to use Truffle or Hardhat for compilation, deployment, and testing. Ensure comprehensive testing of all functions, especially edge cases in odds calculation and winnings distribution.

## Disclaimer

This contract is for educational purposes only. Real-world implementation would require additional security measures, thorough auditing, and compliance with local laws and regulations regarding online betting.

## License

This project is licensed under the MIT License.