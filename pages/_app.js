import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import stores from '../stores/index.js'

import {
  CONFIGURE,
} from '../stores/constants'

import '../styles/globals.css'

import lightTheme from '../theme/light';
import darkTheme from '../theme/dark';

function MyApp({ Component, pageProps }) {
  const [ themeConfig, setThemeConfig ] = useState(lightTheme);

  const changeTheme = (dark) => {
    setThemeConfig(dark ? darkTheme : lightTheme)
    localStorage.setItem("chain-list-dark-mode", dark ? "dark" : "light");
  }

  useEffect(function() {
    const localStorageDarkMode = window.localStorage.getItem(
      "chain-list-dark-mode"
    );
    changeTheme(localStorageDarkMode ? localStorageDarkMode === "dark" : false);
  }, []);

  useEffect(function() {
    stores.dispatcher.dispatch({ type: CONFIGURE })
  },[]);

  return (
    <ThemeProvider theme={ themeConfig }>
      <CssBaseline />
      <Component {...pageProps} changeTheme={ changeTheme } />

    </ThemeProvider>
  )
}

export default MyApp
