import React, {useState, useEffect} from 'react';

import {RouterContext} from './RouterContext';

export function Router({children}) {
  const [state, setState] = useState({currentRoute: window.location.pathname, previousRoute: ''});

  const setRoute = path => {
    window.history.pushState({}, null, path);

    setState(nState => ({
      currentRoute: window.location.pathname,
      previousRoute: nState.currentRoute
    }));
  };

  useEffect(() => {
    function onPopState() {
      setState(nState => ({
        currentRoute: `/${window.location.pathname}`.replace('//', '/'),
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
