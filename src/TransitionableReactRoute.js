import React, {useContext, useEffect, useState, useRef, useMemo} from 'react';

import {RouterContext} from './RouterContext';

const IS_SSR = typeof window === 'undefined';
const TRANSITION_STATES = ['entering', 'entered', 'exiting', 'exited'];
const NEXT_STEP_MAP = [1,1,3,3];
/**
 * Given a pseudo url, we create an array that contains a regExp to match against a url,
 * an array indicating any dynamic url (/static/:dynamic_file_name), which will become a props,
 * and the component that should be mounted when given a matching url
 * @param pattern
 * @param component
 * @returns {[regExp, array, component]}
 */
export function mapToRegExp([component, path, parentPath], isNested = false) {
  const fullPath = normalisePath(parentPath ? `${parentPath}/${path}`: path);
  const [regExpPattern, isDynamic] = deconstructURL(fullPath);

  let regExp = regExpPattern;
  if(isNested) {
    // when nested, we need the regExp to have a wildcard match
    regExp = `${regExpPattern}\\/.*`;
  } else if(path === '/') {
    // given the filter above, we need to have this exception where '/' is added when needed
    regExp = `${regExpPattern}\\/`;
  }

  return [new RegExp(`${regExp}$`, 'ig'), isDynamic, component];
}

export function TransitionableReactRoute({path: nestedRoute, timeout = 1000, animateOnMount, children, ...props}) {
  const now = Date.now();
  const routes = useRef([]);
  const timeoutRefs = useRef([]);

  const router = useContext(RouterContext);
  const currentRoute = router.currentRoute;

  // The state will hold an abstract list of mounted components.
  // Should be in sync with mountedComponents
  const key = `${currentRoute}_${now}`;
  const [state, setState] = useState(IS_SSR ? [{
    state: animateOnMount ? 0: 1,
    key,
    timestamp : now,
    currentRoute
  }]: []);

  // Only runs once on mount.
  // Needs to run before the first render, hence the use of ref vs useEffect
  if (!routes.current.length) {
    // We create a data structure representing the available routes + their regexp
    React.Children.forEach(children, _child => {
      const {path, defaultpath} = _child.props;
      const isTransitionableComponent = (_child.type === TransitionableReactRoute);

      const properties = {
        ..._child.props,
        fullPath: defaultpath ? 'defaultpath': normalisePath(`${nestedRoute ? nestedRoute: ''}/${path}`),
        timeout
      };

      if(isTransitionableComponent) {
        // force the same timeout everywhere
        properties.animateOnMount = animateOnMount;
      }

      const child = React.cloneElement(_child, properties);

      if(defaultpath) {
        routes.current.push([/.*/ig, [false], child]);
      } else {
        routes.current.push(mapToRegExp([child, path, nestedRoute], isTransitionableComponent));
      }
    });
  }

  useEffect(() => () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    // this is matching on an old parent
    const isUnmountingComponent = props.transitionstate === TRANSITION_STATES[2];
    !isUnmountingComponent && setState(s => {
      const nState = [...s];
      const now = Date.now();

      const prevRoute = (last(nState) || {}).currentRoute;
      const isSameParent = checkIfSameParent(prevRoute, router.currentRoute, routes);

      const dirtyIndexes = [];
      const prevIndex = nState.length - 1;

      // Let's force the previous route to unmount
      if(nState.length > 0 && nState[prevIndex].state < 2 && !isSameParent) {
        dirtyIndexes.push(prevIndex);
        nState[prevIndex] = {
          ...nState[prevIndex],
          now,
          state: 2
        };
      }

      if(!isSameParent) {
        dirtyIndexes.push(nState.length);
        nState.push({
          state: animateOnMount ? 0: 1,
          key,
          timestamp : now,
          currentRoute
        });
      }

      dirtyIndexes.forEach((index) => {
        const id = setTimeout(() => onAnimationEnd(setState, timeout), timeout);

        clearTimeout(nState[index].timeoutRef);
        timeoutRefs.current.push(id);
        nState[index].timeoutRef = id;
      });

      return nState;
    });
  }, [currentRoute]);

  return useMemo(() => {
    return state.map(({currentRoute, key, state}) => {
      const matchedComponent = greedyMatchComponent(routes.current, currentRoute);

      if(!matchedComponent.component) {
        return null;
      }

      return React.createElement(
        matchedComponent.component.type,
        {
          key,
          ...matchedComponent.component.props,
          query: matchedComponent.query,
          transitionstate: TRANSITION_STATES[state]
        }
      );
    });
  }, [state]);
}

function checkIfSameParent(prevRoute, currRoute, routes) {
  const pMatch = matchRoute(routes, prevRoute);
  const cMatch = matchRoute(routes, currRoute);

  if(!cMatch || !pMatch) {
    return null;
  }

  return (pMatch[pMatch.length - 1] === cMatch[cMatch.length - 1]);
}

function matchRoute(routes, route) {
  if(!route) {
    return null;
  }

  for (let [regExp] of routes.current) {
    regExp.lastIndex = 0;
    const m = regExp.exec(route);

    if(m) {
      return m;
    }
  }
}

function onAnimationEnd(setState, timeout) {
  setState(s => {
    let dirty = false;
    const now = Date.now();
    const newState = [...s];

    for(let i = 0; i < newState.length; i++) {
      const nextTransitionstate = NEXT_STEP_MAP[newState[i].state];
      if(now - newState[i].timestamp >= timeout && nextTransitionstate !== newState[i].state) {
        dirty = true;
        newState[i] = {
          ...newState[i],
          state: nextTransitionstate
        };
      }
    }

    if(dirty) {
      return newState.filter(({state}) => state < 3);
    }

    return s;
  });
}

function greedyMatchComponent(routes, currentRoute) {
  mainLoop:
    for (let [regExp, isDynamic, component] of routes) {
      regExp.lastIndex = 0;

      const match = regExp.exec(currentRoute);

      if (!match) {
        continue;
      }

      let query = {};
      for(let i = 0; i < isDynamic.length; i++) {
        if(typeof isDynamic[i] === 'string') {
          query[isDynamic[i]] = match[i + 1];

          if(!match[i + 1]) {
            continue mainLoop;
          }
        }
      }

      return {
        component,
        query
      };
    }

  return { component: null, attributes: null };
}

function deconstructURL(fullPath) {
  const mUrl = fullPath.split('/');

  if(fullPath === '/') {
    return [`^`, [false]];
  }

  return mUrl
    .filter(s => !!s)
    .reduce((acc, curr, i) => {
      const isDynamic = acc[1];
      if (curr.indexOf(':') === 0) {
        isDynamic.push(curr.substring(1));
        return [`${acc[0]}\\/?([^\\/]+)?`, isDynamic];
      }

      isDynamic.push(false);

      if (i > 0) {
        return [`${acc[0]}\\/(${curr})`, isDynamic];
      }
      return [`${acc[0]}(${curr})`, isDynamic];
    }, ['^\\/', []]);
}

function normalisePath(path = '') {
  return path.replace('//', '/');
}

function last(arr = []) {
  return arr[arr.length - 1];
}
