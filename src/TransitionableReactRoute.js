import React, {useContext, useEffect, useState, useRef} from 'react';

import {RouterContext} from './RouterContext';

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
  const mUrl = fullPath.split('/');

  const [regExpPattern, isDynamic] = mUrl
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

  let regExp = regExpPattern;
  if(isNested) {
    // when nested, we need the regExp to have a wildcard match
    regExp = `${regExpPattern}.*`;
  } else if(path === '/') {
    // given the filter above, we need to have this exception where '/' is added when needed
    regExp = `${regExpPattern}\\/`;
  }

  return [new RegExp(`${regExp}$`, 'ig'), isDynamic, component];
}

export function TransitionableReactRoute({path: nestedRoute, timeout = 1000, animateOnMount, children}) {
  const now = Date.now();
  const routes = useRef([]);
  const timeoutRefs = useRef([]);

  const router = useContext(RouterContext);
  const currentRoute = router.currentRoute;

  // The state will hold an abstract list of mounted components.
  // Should be in sync with mountedComponents
  const key = `${currentRoute}_${now}`;
  const [state, setState] = useState([]);

  // Only runs once on mount.
  // Needs to run before the first render, hence the use of ref vs useEffect
  if (!routes.current.length) {
    // We create a data structure representing the available routes + their regexp
    React.Children.forEach(children, _child => {
      const {path, defaultPath} = _child.props;
      const isTransitionableComponent = (_child.type === TransitionableReactRoute);

      const properties = {
        ..._child.props,
        fullPath: defaultPath ? 'defaultPath': normalisePath(`${nestedRoute ? nestedRoute: ''}/${path}`),
        timeout
      };

      if(isTransitionableComponent) {
        // force the same timeout everywhere
        properties.animateOnMount = animateOnMount;
      }

      const child = React.cloneElement(_child, properties);

      if(defaultPath) {
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
    setState(s => {
      const nState = [...s];
      const now = Date.now();

      const latestRoute = (last(nState) || {}).currentRoute;

      const prevComponent = greedyMatchComponent(routes.current, currentRoute);
      const nextComponent = greedyMatchComponent(routes.current, latestRoute);

      const isParent = prevComponent.component && prevComponent.component.type === TransitionableReactRoute;
      const isPrevParent = nextComponent.component && nextComponent.component.type === TransitionableReactRoute;

      if(!isPrevParent || !isParent) {
        nState.push({
          state: animateOnMount ? 0: 1,
          key,
          timestamp : now,
          currentRoute
        });
      }

      if(nState.length > 1) {
        nState[nState.length - 2] = {
          ...nState[nState.length - 2],
          now,
          state: 2
        };
      }

      timeoutRefs.current.push(setTimeout(() => {
        setState(s => {
          let dirty = false;
          const now = Date.now();
          const newState = [...s];

          for(let i in newState) {
            const nextTransitionState = NEXT_STEP_MAP[newState[i].state];
            if(now - newState[i].timestamp >= timeout && nextTransitionState !== newState[i].state) {
              dirty = true;
              newState[i] = {
                ...newState[i],
                state: nextTransitionState
              };
            }
          }

          if(dirty) {
            return newState.filter(({state}) => state < 3);
          }

          return s;
        });
      }, timeout));

      return nState;
    });
  }, [currentRoute]);

  // This replaces useMemo with semantic guarantee
  return useMemoisedUpdate(() => {
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
          transitionState: TRANSITION_STATES[state]
        }
      );
    });
  }, [state]);
}

function greedyMatchComponent(routes, currentRoute) {
  for (let [regExp, isDynamic, component] of routes) {
    regExp.lastIndex = 0;

    const match = regExp.exec(currentRoute);

    if (!match) {
      continue;
    }

    return {
      component,
      query: isDynamic.reduce((acc, curr, i) => {
        if(curr) {
          return {
            ...acc,
            [curr]: match[i + 1] || '/'
          }
        }
        return acc;
      }, {}),
    };
  }

  return { component: null, attributes: null };
}

function useMemoisedUpdate(fn, diff) {
  const [currState, setState] = useState([]);

  useEffect(() => {
    setState(currState => fn(currState))
  }, diff);

  return currState;
}

function normalisePath(path = '') {
  return path.replace('//', '/');
}

function last(arr = []) {
  return arr[arr.length - 1];
}
