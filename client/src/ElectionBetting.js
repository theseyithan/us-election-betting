import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ElectionBettingContract from './contracts/ElectionBetting.json';

function ElectionBetting() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [bettingEndDateTime, setBettingEndDateTime] = useState(null);
  const [currentOdds, setCurrentOdds] = useState({ democrat: 0, republican: 0 });

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        setWeb3(web3);

        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);

          const networkId = await web3.eth.net.getId();
          const deployedNetwork = ElectionBettingContract.networks[networkId];
          const instance = new web3.eth.Contract(
            ElectionBettingContract.abi,
            deployedNetwork && deployedNetwork.address
          );

          setContract(instance);

          if (instance) {
            getBettingEndDateTime(instance);
            getCurrentOdds(instance);
          }
        } catch (error) {
          console.error("User denied account access or something went wrong:" + error);
        }
      } else {
        console.error("User has not installed MetaMask");
      }
    };

    initWeb3();
  }, []);

  const getBettingEndDateTime = async (instance) => {
    const bettingEndDateTime = await instance.methods.bettingEndDateTime().call();
    setBettingEndDateTime(new Date(bettingEndDateTime * 1000).toString());
  };

  const getCurrentOdds = async (instance) => {
    const odds = await instance.methods.getOdds().call();
    setCurrentOdds({ 
      democrat: Web3.utils.fromWei(odds.democrat.toString(), 'ether'),
      republican: Web3.utils.fromWei(odds.republican.toString(), 'ether')
    });
  };

  const placeBet = async (outcome, amount) => {
    if (contract && account) {
      try {
        await contract.methods.placeBet(outcome).send({
          from: account,
          value: Web3.utils.toWei(amount, 'ether')
        });
        alert("Successfully placed" + amount + "ETH on " + outcome);
        getCurrentOdds(contract);
      } catch (error) {
        alert("Error placing bet: " + error);
        console.error(error);
      }
    } else {
      alert("Contract or account not loaded. Please try again.");
    }
  };

  if (!web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <div>
      <h1>Election Betting</h1>
      <p>Account: {account}</p>
      <p>Betting ends on: {bettingEndDateTime}</p>
      
      <h2>Current Odds</h2>
      <p>Democrat: {currentOdds.democrat}</p>
      <p>Republican: {currentOdds.republican}</p>
      
      <h2>Place a Bet</h2>
      <button onClick={() => placeBet(0, 0.1)}>Bet 0.1 ETH on Democrat</button>
      <button onClick={() => placeBet(1, 0.1)}>Bet 0.1 ETH on Republican</button>
      <button onClick={() => getCurrentOdds(contract)}>Refresh Odds</button>
    </div>
  );
}

export default ElectionBetting;