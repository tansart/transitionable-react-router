import React, {useState, useEffect, useRef} from 'react';
import {render, cleanup, fireEvent, act} from '@testing-library/react';

import {RouterContext} from './RouterContext';
import {TransitionableReactRoute} from './TransitionableReactRoute';

afterEach(cleanup);

describe("#TransitionableReactRoute", () => {
  it('only shows the targeted section', async () => {
    const props = {
      currentRoute: '/route-three',
      timeout: 0
    };
    const {queryByTestId, debug} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('/route-three')).toBeDefined();
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);

    fireEvent.click(queryByTestId('path::/nested/'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/')).toBeDefined();
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);

    fireEvent.click(queryByTestId('path::/route-five'));
    expect(queryByTestId('/route-five')).toBeDefined();
    await act(async () => await pSleep(props.timeout));
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);
  });

  it('sets its animation props accordingly', async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/nested/',
      timeout: 100
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entering');

    fireEvent.click(queryByTestId('path::/nested/route-one'));
    fireEvent.click(queryByTestId('path::/nested/route-two'));

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entered');
    expect(document.querySelectorAll("[data-transitionstate]").length).toBe(1);

    fireEvent.click(queryByTestId('path::/route-five'));
    await act(async () => await pSleep(props.timeout * .5));
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/route-five').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout * .5));
    expect(queryByTestId('/route-five').dataset.transitionstate).toBe('entered');
    expect(queryByTestId('/nested/route-two')).toBeNull();
  });

  it('does not animate on mount when {animateOnMount: false}', async () => {
    const props = {
      animateOnMount: false,
      currentRoute: '/route-three',
      timeout: 100
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('/route-three').dataset.transitionstate).toBe('entered');

    fireEvent.click(queryByTestId('path::/nested/'));

    expect(queryByTestId('/route-three').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entered');

    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entered');
    fireEvent.click(queryByTestId('path::/nested/route-one'));

    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('entered');
    fireEvent.click(queryByTestId('path::/nested/route-two'));

    await act(async () => await pSleep(props.timeout * .5));

    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entered');
  });

  /*it('properly handles a quick sequence of animation prop changes', async () => {
    // let the user dictate how to handle this

    // scenario 1: allow queue to pop some unwanted routes

    // scenario 2: allow a long sequence of components to hang in there

    // scenario 3: allow to force the state vs pop...?
  });*/

});

function TestWrapper(props) {
  const {animateOnMount, timeout} = props;

  const [currentRoute, setRoute] = useState(props.currentRoute);

  const prevRoute = useRef(null);

  useEffect(() => {
    prevRoute.current = currentRoute;
  }, [currentRoute]);

  return <>
    <Nav
      paths={[
        '/nested/',
        '/nested/route-one',
        '/nested/route-two',
        '/route-three',
        '/route-four',
        '/route-five',
        '/dynamic/route-one',
        '/dynamic/route-two',
        '/nested-two/',
        '/nested-two/one',
        '/nested-two/two'
      ]}
      handler={setRoute}
    />
    <RouterContext.Provider value={{currentRoute, previousRoute: prevRoute.current}}>
      <TransitionableReactRoute animateOnMount={animateOnMount} timeout={timeout}>
        <TransitionableReactRoute path={'/nested'}>
          <DisplayPath path={'/'} />
          <DisplayPath path={'/route-one'} />
          <DisplayPath path={'/route-two'} />
        </TransitionableReactRoute>

        <DisplayPath path={'/route-three'} />
        <DisplayPath path={'/route-four'} />
        <DisplayPath path={'/route-five'} />

        <DisplayPath path={'/dynamic/:route'} />

        <TransitionableReactRoute path={'/nested-two'}>
          <DisplayPath path={'/'} />
          <DisplayPath path={'/one'} />
          <DisplayPath path={'/two'} />
        </TransitionableReactRoute>

        <DisplayPath defaultPath />
      </TransitionableReactRoute>
    </RouterContext.Provider>
  </>
}

function Nav({paths, handler}) {
  return paths.map(path => <span
    key={`key-${path}`}
    data-testid={`path::${path}`}
    onClick={() => {
      handler(path);
    }}
  />)
}

function DisplayPath({path, transitionState, fullPath}) {
  return <span data-testid={fullPath} data-transitionstate={transitionState}>{path}</span>;
}

function pSleep(time) {
  return new Promise(r => setTimeout(r, time)).catch(e => console.log(`oops following issue with pSleep ${JSON.stringify(e, null, 2)}`));
}
