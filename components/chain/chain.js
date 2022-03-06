import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Button, Tooltip } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import { useRouter } from 'next/router'
import Image from "next/image";

import classes from './chain.module.css'

import stores from '../../stores/index.js'
import { getProvider } from '../../utils'

import {
  ERROR,
  CONNECT_WALLET,
  TRY_CONNECT_WALLET,
  ACCOUNT_CONFIGURED
} from '../../stores/constants'

import tmpIcons from "../../icons.json"

const ChainIcon = (props) => {
  const k = props.chain.chain.toLowerCase()
  let icon = props.chain.icon
  // icon = icon ? (
  //     icon?.startsWith('http') ? icon : '/chains/'+icon+'.svg'
  // ) : '/chains/unknown-logo.png'
  icon = '/chains/unknown-logo.png'

  if (tmpIcons[k] !== undefined) {
    icon = tmpIcons[k]
  }
  // const [imgSrc, setImgSrc] = useState(icon)
  // return (
  //     <div style={{marginRight: '24px', marginBottom:'-6px'}}>
  //       <Image
  //           src={imgSrc}
  //           onError={e => {
  //             setImgSrc('/chains/unknown-logo.png')
  //           }}
  //           width={ 28 }
  //           height={ 28 }
  //       />
  //     </div>
  // )

  return (
    <img
        src={icon}
        onError={e => {
          e.target.onerror = null;
          e.target.src = "/chains/unknown-logo.png";
        }}
        width={ 28 }
        height={ 28 }
        style={{marginRight: '24px', borderRadius:"50%"}}
    />
  )
}

export default function Chain({ chain }) {
  const router = useRouter()

  const [ account, setAccount ] = useState(null)
  const [ web3, setWeb3] = useState(null)

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account')
      setAccount(accountStore)
      const web3Store = stores.accountStore.getStore('web3')
      setWeb3(web3Store)
    }

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure)

    const accountStore = stores.accountStore.getStore('account')
    setAccount(accountStore)
    const web3Store = stores.accountStore.getStore('web3')
    setWeb3(web3Store)

    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure)
    }
  }, [])

  const toHex = (num) => {
    return '0x'+num.toString(16)
  }

  const addToNetwork = async () => {
    if(!(account && account.address)) {
      stores.dispatcher.dispatch({ type: TRY_CONNECT_WALLET })
      return
    }

    console.log('chain', chain)
    let rpc = chain.rpc.map(url => {
      url = url.replaceAll("${INFURA_API_KEY}", process.env.NEXT_PUBLIC_INFURA_PROJECT_ID)
      return url.replaceAll("{INFURA_API_KEY}", process.env.NEXT_PUBLIC_INFURA_PROJECT_ID)
    })
    console.log('chain rpc', rpc)
    const params = {
      chainId: toHex(chain.chainId), // A 0x-prefixed hexadecimal string
      chainName: chain.name,
      nativeCurrency: {
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol, // 2-6 characters long
        decimals: chain.nativeCurrency.decimals,
      },
      rpcUrls: rpc,
      blockExplorerUrls: [ ((chain.explorers && chain.explorers.length > 0 && chain.explorers[0].url) ? chain.explorers[0].url : chain.infoURL) ]
    }

    console.log('debug web3', account, web3, web3._provider.provider);

    let provider = web3.givenProvider || web3.provider || web3._provider.provider
    if (!provider) {
      console.log('no wallet env, please install MetaMask or other wallet')
      return
    }
    let ok = false
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(chain.chainId) }],
      }).then(result => {
        ok = true
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [params, account],
          }).then(result => {
            ok = true
          });
        } catch (error) {
          stores.emitter.emit(ERROR, error.message ? error.message : error)
          console.log(error)
        }
      }
      console.log(switchError)
      // handle other "switch" errors
    }
    console.log('add network result', ok)
    if (!ok) {
    }
  }

  const renderProviderText = () => {

    if(account && account.address) {
      const providerTextList = {
        Metamask: 'Add to Metamask',
        imToken: 'Add to imToken',
        Wallet: 'Add to Wallet'
      }
      return providerTextList[getProvider()]
    } else {
      return 'Connect wallet'
    }

  }

  if(!chain) {
    return <div></div>
  }

  if (tmpIcons[chain.chain.toLowerCase()] !== undefined) {
    chain.icon = tmpIcons[chain.chain.toLowerCase()]
  }
  const [imgSrc, setImgSrc] = useState(chain.icon ? (
      chain.icon?.startsWith('http') ? chain.icon : '/chains/'+chain.icon+'.svg'
  ) : '/chains/unknown-logo.png')
  return (
    <Paper elevation={ 1 } className={ classes.chainContainer } key={ chain.chainId }>
      <div className={ classes.chainNameContainer }>
        <ChainIcon chain={chain} />
        <Tooltip title={ chain.name }>
          <Typography variant='h5' className={ classes.name } >
            <a href={ chain.infoURL } target="_blank" rel="noreferrer">
              { chain.name }
            </a>
          </Typography>
        </Tooltip>
      </div>
      <div className={ classes.chainInfoContainer }>
        <div className={ classes.dataPoint }>
          <Typography variant='subtitle1' color='textSecondary' className={ classes.dataPointHeader} >ChainID</Typography>
          <Typography variant='h5'>{ chain.chainId }</Typography>
        </div>
        <div className={ classes.dataPoint }>
          <Typography variant='subtitle1' color='textSecondary' className={ classes.dataPointHeader}>Currency</Typography>
          <Typography variant='h5'>{ chain.nativeCurrency ? chain.nativeCurrency.symbol : 'none' }</Typography>
        </div>
      </div>
      <div className={ classes.addButton }>
        <Button
          variant='outlined'
          color='primary'
          onClick={ addToNetwork }
        >
          { renderProviderText() }
        </Button>
      </div>
    </Paper>
  )
}
