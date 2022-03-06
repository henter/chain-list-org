import {
  ERROR,
  STORE_UPDATED,
  CONFIGURE,
  ACCOUNT_CONFIGURED,
  ACCOUNT_CHANGED,
  TRY_CONNECT_WALLET,
} from './constants';

import stores from './'
import { ethers } from "ethers";
import Web3 from 'web3';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID,
    },
  },
};

let instance;
let provider;
let signer;
let web3;

class Store {
  constructor(dispatcher, emitter) {

    this.dispatcher = dispatcher
    this.emitter = emitter

    this.store = {
      account: null,
      web3: null,
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload);
            break;
          case TRY_CONNECT_WALLET:
            this.tryConnectWallet(payload)
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async () => {

  };

  updateAccount = () => {
    const that = this
    const res = window.ethereum.on('accountsChanged', function (accounts) {
      that.setStore({ account: { address: accounts[0] } })
      that.emitter.emit(ACCOUNT_CHANGED)
      that.emitter.emit(ACCOUNT_CONFIGURED)
    })
  }


  tryConnectWallet = async () => {
    let web3ModelInstance = new Web3Modal({
      providerOptions,
    });
    instance = await web3ModelInstance.connect();
    provider = new ethers.providers.Web3Provider(instance);
    console.log('provider', provider)
    signer = provider.getSigner();
    web3 = new Web3(provider);

    const address = await signer.getAddress();
    console.log(address);
    if (address) {
      this.setStore({ account: { address: address }, web3: web3})
      this.emitter.emit(ACCOUNT_CONFIGURED)
    }
  }
}

export default Store;
