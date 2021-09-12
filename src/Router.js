import React, {useState, useEffect} from 'react';

import {RouterContext} from './RouterContext';

export function Router({base = '/', children}) {
  const [state, setState] = useState({currentRoute: trimBase(window.location.pathname, base), previousRoute: ''});

  const setRoute = path => {
    window.history.pushState({}, null, `${base}/${path}`.replace(/\/\/\/?/i, '/'));

    setState(nState => ({
      currentRoute: trimBase(window.location.pathname, base),
      previousRoute: nState.currentRoute
    }));
  };

  useEffect(() => {
    function onPopState() {
      setState(nState => ({
        currentRoute: `/${trimBase(window.location.pathname, base)}`.replace('//', '/'),
        previousRoute: nState.currentRoute
      }));
    }

    window.addEventListener('popstate', onPopState);

    return function() {
      window.removeEventListener('popstate', onPopState);
    }
  }, []);

  return <RouterContext.Provider value={{setRoute, ...state}}>
    {children}
  </RouterContext.Provider>;
}

// in theory, base should only be applied once
const baseRegexp = [];
export function trimBase(pathname, base = '/') {
  if(!baseRegexp[base]) {
    baseRegexp[base] = new RegExp(`^/?${base}/?(.*)`, 'ig');
  }

  baseRegexp[base].lastIndex = 0;

  return `/${baseRegexp[base].exec(pathname)[1]}`;
}
