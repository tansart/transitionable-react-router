import React, {useEffect, useRef} from 'react';
import {act} from 'react-dom/test-utils';
import {render, cleanup, waitForDomChange} from 'react-testing-library';

import {RouterContext} from './RouterContext';
import {TransitionableReactRoute} from './TransitionableReactRoute';

afterEach(cleanup);

describe("#TransitionableReactRoute", () => {
  it('only shows the targeted section', async () => {
    const props = {
      currentRoute: '/',
      timeout: 0
    };
    const {queryByTestId, rerender} = render(<TestWrapper {...props}/>);
    await waitForDomChange({container: document.body});
    expect(queryByTestId('/')).toBeDefined();
    expect(queryByTestId('/route-one')).toBeUndefined();
    expect(queryByTestId('/route-two')).toBeUndefined();

    props.currentRoute = '/route-one';
    rerender(<TestWrapper {...props}/>);
    await waitForDomChange({container: document.body});
    expect(queryByTestId('/route-one')).toBeDefined();
    expect(queryByTestId('/')).toBeUndefined();
    expect(queryByTestId('/route-two')).toBeUndefined();

    props.currentRoute = '/route-two';
    rerender(<TestWrapper {...props} />);
    await waitForDomChange({container: document.body});
    expect(queryByTestId('/route-two')).toBeDefined();
    expect(queryByTestId('/')).toBeUndefined();
    expect(queryByTestId('/route-one')).toBeUndefined();
  });

  it('sets its children animation props accordingly', async () => {
    const props = {
      currentRoute: '/',
      timeout: 100
    };
    const {queryByTestId, rerender} = render(<TestWrapper {...props}/>);
    await waitForDomChange({container: document.body});

    props.currentRoute = '/route-one';
    act(() => rerender(<TestWrapper {...props} />));
    await pSleep(25);
    // use enum/static const
    expect(queryByTestId('/').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/route-one').dataset.transitionstate).toBe('entering');

    await pSleep(props.timeout);
    expect(queryByTestId('/').dataset.transitionstate).toBeUndefined();
    expect(queryByTestId('/route-one').dataset.transitionstate).toBe('entered');
    // '/' must be in exiting state
    // '/route-one' must be in entering state
  });

  it('properly handles a quick sequence of animation prop changes', async () => {
    // let the user dictate how to handle this

    // scenario 1: allow queue to pop some unwanted routes

    // scenario 2: allow a long sequence of components to hang in there

    // scenario 3: allow to force the state vs pop...?
  });
});

function TestWrapper({currentRoute, timeout}) {
  const prevRoute = useRef(null);
  useEffect(() => {
    prevRoute.current = currentRoute;
  }, [currentRoute]);

  return <RouterContext.Provider value={{currentRoute, previousRoute: prevRoute.current}}>
    <TransitionableReactRoute timeout={timeout}>
      <DisplayPath path={'/'}/>
      <DisplayPath path={'/route-one'}/>
      <DisplayPath path={'/route-two'}/>
    </TransitionableReactRoute>
  </RouterContext.Provider>
}

function DisplayPath({path, transitionState}) {
  return <span data-testid={path} data-transitionstate={transitionState}>{path}</span>;
}

function pSleep(time) {
  return new Promise(r => setTimeout(r, time)).catch(e => console.log(`oops following issue with pSleep ${JSON.stringify(e, null, 2)}`));
}
