import React, {useContext, useEffect, useState, useRef} from 'react';

import {RouterContext} from './RouterContext';

const TRANSITION_STATES = ['entering', 'entered', 'exiting', 'exited'];

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


export function TransitionableReactRoute({path: nestedRoute, timeout = 1000, animateOnMount, children, lvl}) {
  const now = Date.now();
  const routes = useRef([]);
  const mountedComponents = useRef([]);

  const router = useContext(RouterContext);
  const currentRoute = router.currentRoute;

  // The state will hold an abstract list of mounted components.
  // Should be in sync with mountedComponents
  const key = `${currentRoute}_${now}`;
  const [state, setState] = useState([{
    state: animateOnMount ? 0: 1,
    key,
    timestamp : now,
    currentRoute
  }]);

  // Only runs once on mount.
  // Needs to run before the first render, hence the use of ref vs useEffect
  if (!routes.current.length) {
    // We create a data structure representing the available routes + their regexp
    React.Children.forEach(children, _child => {
      const {path} = _child.props;
      const isTransitionableComponent = (_child.type === TransitionableReactRoute);

      const properties = {
        ..._child.props,
        fullPath: normalisePath(`${nestedRoute ? nestedRoute: ''}/${path}`),
        timeout
      };

      if(isTransitionableComponent && _child.props.animateOnMount == undefined) {
        properties.animateOnMount = animateOnMount;
      }

      const child = React.cloneElement(_child, properties);

      routes.current.push(mapToRegExp([child, path, nestedRoute], isTransitionableComponent));
    });
  }

  useEffect(() => {
    let newState = [...state];

    const now = Date.now();
    const latest = last(state);

    if(latest.currentRoute === currentRoute) {
      if(latest.state === 0) {
        if(now - latest.timestamp >= timeout) {
          newState[newState.length - 1].state = 1;
          setState(newState)
        } else {
          setTimeout(_ => { setState(newState) }, timeout);
        }
      }
    } else {
      console.log('new state push', key)
      newState.push({
        state: animateOnMount ? 0: 1,
        key,
        timestamp : now,
        currentRoute
      });

      newState[newState.length - 2].state = 2;
      newState[newState.length - 2].timestamp = now;

      setState(newState);
    }

    const filteredState = newState.filter(s => !(now - s.timestamp >= timeout && s.state === 2));

    if(newState.length !== filteredState.length) {
      setState(filteredState);
    }
  }, [currentRoute, state]);

  // This replaces useMemo with semantic guarantee
  return useMemoisedUpdate(() => {
    const components = [];

    console.log(lvl, state)
    for ( let i in state) {
      const matchedComponent = greedyMatchComponent(routes.current, state[i].currentRoute);
      console.log('>>>', matchedComponent.type.name)
      components.push(React.createElement(
        matchedComponent.type,
        {
          key: state[i].key,
          ...matchedComponent.props,
          // need to check if first mount.
          transitionState: TRANSITION_STATES[state[i].state]
        }
      ));
    }
    return components;
  }, [state]);
}

function greedyMatchComponent(routes, currentRoute) {
  for (let [regExp, isDynamic, component] of routes) {
    regExp.lastIndex = 0;

    const match = regExp.exec(currentRoute);

    if (!match) {
      continue;
    }

    return component;
  }
}

export function __TransitionableReactRoute({path: nestedRoute, timeout = 1000, animateOnMount, children}) {
  const router = useContext(RouterContext);
  const currentRoute = router.currentRoute;

  // The state will hold an abstract list of mounted components.
  // Should be in sync with mountedComponents
  const key = `${currentRoute}_${Date.now()}`;
  const [state, setState] = useState([{
    state: animateOnMount ? 1: 0,
    key,
    currentRoute
  }]);
  // `${animateOnMount ? "showing_": "shown_"}${currentRoute}`

  const routes = useRef([]);
  const mountedComponents = useRef([]);

  let isMounted = true;

  // unmount cleanup
  useEffect(() => () => {
    isMounted = false;
  }, []);

  // Only runs once on mount.
  // Needs to run before the first render, hence the use of ref vs useEffect
  if (!routes.current.length) {
    // We create a data structure representing the available routes + their regexp
    React.Children.forEach(children, _child => {
      const {path} = _child.props;
      const isTransitionableComponent = (_child.type === TransitionableReactRoute);

      const properties = {
        ..._child.props,
        fullPath: normalisePath(`${nestedRoute ? nestedRoute: ''}/${path}`),
        timeout
      };

      if(isTransitionableComponent && _child.props.animateOnMount == undefined) {
        properties.animateOnMount = animateOnMount;
      }

      const child = React.cloneElement(_child, properties);

      routes.current.push(mapToRegExp([child, path, nestedRoute], isTransitionableComponent));
    });
  }

  // This replaces useMemo with semantic guarantee
  const mComponents = useMemoisedUpdate(() => {
    let components = mountedComponents.current.map(component => {
      // set all mounted components to exiting
      return React.cloneElement(component, {
        ...component.props,
        transitionState: TRANSITION_STATES[2]
      })
    });

    for (let [regExp, isDynamic, component] of routes.current) {
      regExp.lastIndex = 0;

      const match = regExp.exec(currentRoute);

      if (!match) {
        continue;
      }

      // if the latest state matches the current URL, then we should ignore this state update
      /*if(components.length) {
        const last = components[components.length - 1];
        regExp.lastIndex = 0;
        if(regExp.exec(last.props.fullPath)) {
          console.log("### matching ###", last.props.transitionState);
          // matching routes
          if(last.props.transitionState === TRANSITION_STATES[0]) {
            components[components.length - 1] = React.cloneElement(
              last,
              {
                ...last.props,
                key: last.key,
                transitionState: TRANSITION_STATES[1]
              }
            );
          }
          // if the state update is due to entering -> entered
          // check shown/showing then update transitionState
          // but ideally we should move this logic when cloning the elements.
          break;
        }
      }*/

      /*const key = isDynamic.reduce((acc, _isDynamic, index) => {
        if (_isDynamic) {
          properties[_isDynamic] = match[index + 1];
        }

        const separator = index > 0 ? '/' : '';
        return `${acc}${separator}${match[index + 1] || ''}`;
      }, '') || '/';*/

      components.push(
        React.createElement(
          component.type,
          {
            key,
            ...component.props,
            // need to check if first mount.
            transitionState: TRANSITION_STATES[animateOnMount ? 0: 1]
          }
        )
      );

      break;
    }

    mountedComponents.current = components;

    return components;
  }, [state]);

  const lastComponent = mComponents[mComponents.length - 1];

  // on route updates, update the state
  /*useEffect(() => {
    // on route change
    const delay = lastComponent && lastComponent.type == TransitionableReactRoute ? 0: timeout;
    setTimeout(() => {
      isMounted && setState(`shown_${currentRoute}`);
    }, state.indexOf('shown_') > -1 ? 0: delay);
  }, [currentRoute]);*/
  useEffect(() => {
    // on route change & on mount
    const latestState = state[state.length - 1];
    if(latestState.state === 0 && latestState.currentRoute === currentRoute) {
      setTimeout(() => {
        latestState.state = 1;
        setState(Array.from(state))
      }, timeout)
    } else if (latestState.currentRoute === currentRoute) {
      setTimeout(() => {
        setState([...state, {
          state: 0,
          key,
          currentRoute
        }])
      }, timeout)
    }
  }, [currentRoute]);

  return mComponents;
}

function useMemoisedUpdate(fn, diff) {
  const [currState, setState] = useState([]);

  useEffect(() => {
    setState(fn(currState))
  }, diff);

  return currState;
}

function normalisePath(path) {
  return path.replace('//', '/');
}

function last(arr = []) {
  return arr[arr.length - 1];
}
