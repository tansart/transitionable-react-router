import React, {useState, useEffect, useRef} from 'react';
import {render, cleanup, fireEvent, act} from '@testing-library/react';

import {RouterContext} from './RouterContext';
import {TransitionableReactRoute} from './TransitionableReactRoute';

afterEach(cleanup);

describe("#TransitionableReactRoute", () => {
  it('falls back to the default route', async () => {
    const props = {
      currentRoute: '/route-unknown',
      timeout: 0
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('defaultpath')).toBeTruthy();
  });

  it('only shows the targeted section', async () => {
    const props = {
      currentRoute: '/',
      timeout: 0
    };
    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/')).toBeTruthy();
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);

    fireEvent.click(queryByTestId('path::/nested/'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/')).toBeTruthy();
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);

    fireEvent.click(queryByTestId('path::/nested/route-one'));
    fireEvent.click(queryByTestId('path::/route-three'));
    fireEvent.click(queryByTestId('path::/nested/route-two'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/route-two')).toBeTruthy();
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);

    fireEvent.click(queryByTestId('path::/route-five'));
    expect(queryByTestId('/route-five')).toBeTruthy();
    await act(async () => await pSleep(props.timeout));
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(1);
  });

  it('sets animation props accordingly', async () => {
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

    await act(async () => await pSleep(props.timeout + 16));
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entered');
    expect(document.querySelectorAll("[data-transitionstate]").length).toBe(1);

    fireEvent.click(queryByTestId('path::/route-five'));
    await act(async () => await pSleep(props.timeout * .5));
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/route-five').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout * .75));
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

  it('understands dynamic routes', async () => {
    const props = {
      currentRoute: '/dynamic/random',
      timeout: 0
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/dynamic/:route').dataset.route).toBe('random');
    await act(async () => await pSleep(1));

    fireEvent.click(queryByTestId('path::/nested/route-one'));
    expect(queryByTestId('/nested/route-one')).toBeTruthy();
    await act(async () => await pSleep(1));

    fireEvent.click(queryByTestId('path::/dynamic-two/route-two'));
    await act(async () => await pSleep(1));
    expect(queryByTestId('/dynamic-two/:random-attribute').dataset.randomAttribute).toBe('route-two');

    fireEvent.click(queryByTestId('path::/nested-two/some-random-route'));
    await act(async () => await pSleep(1));
    expect(queryByTestId('/nested-two/:route').dataset.route).toBe('some-random-route');
  });

  it(`dynamic paths can't be "/"`, async () => {
    const props = {
      currentRoute: '/nested-two/',
      timeout: 0
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(document.querySelectorAll("[data-transitionstate]").length).toEqual(0);

    fireEvent.click(queryByTestId('path::/dynamic/'));
    await act(async () => await pSleep(1));
    expect(queryByTestId('defaultpath')).toBeTruthy();
  });

  it(`allows for timeouts props to be updated`, async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/nested-two/one',
      timeout: 0
    };

    const {queryByTestId, rerender} = render(<TestWrapper {...props}/>);

    fireEvent.click(queryByTestId('path::/nested-two/two'));
    expect(queryByTestId('/nested-two/one').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested-two/two').dataset.transitionstate).toBe('entering');

    rerender(<TestWrapper animateOnMount={true} timeout={100} />);

    fireEvent.click(queryByTestId('path::/route-four'));
    await act(async () => await pSleep(1));
    expect(queryByTestId('/nested-two/two').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/route-four').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(110));
    expect(queryByTestId('/route-four').dataset.transitionstate).toBe('entered');
  });
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
        '/',
        '/nested/',
        '/nested/route-one',
        '/nested/route-two',
        '/route-three',
        '/route-four',
        '/route-five',
        '/dynamic/route-one',
        '/dynamic-two/route-two',
        '/nested-two/one',
        '/nested-two/two',
        '/nested-two/some-random-route',
        '/nested-two/',
        '/dynamic/'
      ]}
      handler={setRoute}
    />
    <RouterContext.Provider value={{currentRoute, previousRoute: prevRoute.current}}>
      <TransitionableReactRoute animateOnMount={animateOnMount} timeout={timeout}>
        <DisplayPath path={'/'} />

        <TransitionableReactRoute path={'/nested'}>
          <DisplayPath path={'/'} />
          <DisplayPath path={'/route-one'} />
          <DisplayPath path={'/route-two'} />
        </TransitionableReactRoute>

        <DisplayPath path={'/route-three'} />
        <DisplayPath path={'/route-four'} />
        <DisplayPath path={'/route-five'} />

        <DisplayPath path={'/dynamic/:route'} />
        <DisplayPath path={'/dynamic-two/:random-attribute'} />

        <TransitionableReactRoute path={'/nested-two'}>
          <DisplayPath path={'/one'} />
          <DisplayPath path={'/two'} />
          <DisplayPath path={'/:route'} />
        </TransitionableReactRoute>

        <DisplayPath defaultpath />
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

function DisplayPath({path, transitionstate, fullPath, query = {}}) {
  const routes = Object.keys(query).reduce((acc, k) => {
    acc[`data-${k.toLowerCase()}`] = query[k];
    return acc;
  }, {}) || {};

  return React.createElement('span', {
    'data-testid': fullPath,
    'data-transitionstate': transitionstate,
    ...routes
  }, path);
}

function pSleep(time) {
  return new Promise(r => setTimeout(r, Math.max(16, time))).catch(e => console.log(`oops following issue with pSleep ${JSON.stringify(e, null, 2)}`));
}
