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
    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/route-three')).toBeDefined();
    expect(queryByTestId('/route-four')).toBeNull();
    expect(queryByTestId('/route-five')).toBeNull();

    fireEvent.click(queryByTestId('path::/route-four'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/route-three')).toBeNull();
    expect(queryByTestId('/route-four')).toBeDefined();
    expect(queryByTestId('/route-five')).toBeNull();

    fireEvent.click(queryByTestId('path::/route-five'));
    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/route-three')).toBeNull();
    expect(queryByTestId('/route-four')).toBeNull();
    expect(queryByTestId('/route-five')).toBeDefined();
  });

  it('only shows the targeted section even when nested', async () => {
    const props = {
      currentRoute: '/nested/',
      timeout: 0
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/nested/')).toBeDefined();
    expect(queryByTestId('/nested/route-one')).toBeNull();
    expect(queryByTestId('/nested/route-two')).toBeNull();

    fireEvent.click(queryByTestId('path::/nested/route-one'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/route-one')).toBeDefined();
    expect(queryByTestId('/nested/')).toBeNull();
    expect(queryByTestId('/nested/route-two')).toBeNull();

    fireEvent.click(queryByTestId('path::/nested/route-two'));
    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/nested/route-two')).toBeDefined();
    expect(queryByTestId('/nested/')).toBeNull();
    expect(queryByTestId('/nested/route-one')).toBeNull();
  });

  it('sets its children animation props accordingly', async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/route-four',
      timeout: 100
    };

    const start = Date.now();
    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/route-four').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout));
    expect(queryByTestId('/route-four').dataset.transitionstate).toBe('entered');
    fireEvent.click(queryByTestId('path::/route-five'));
    await act(async () => await pSleep(props.timeout * 0.5));
    expect(queryByTestId('/route-four').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/route-five').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout * 0.65));
    expect(queryByTestId('/route-four')).toBeNull();
    expect(queryByTestId('/route-five').dataset.transitionstate).toBe('entered');
  });

  it('sets its nested children animation props accordingly', async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/nested/',
      timeout: 100
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entering');

    fireEvent.click(queryByTestId('path::/nested/route-one'));
    fireEvent.click(queryByTestId('path::/nested/route-two'));

    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entered');
  });

  it('sets its nested children animation props accordingly', async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/nested/route-one',
      timeout: 100
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);
    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('entering');

    fireEvent.click(queryByTestId('path::/nested/route-two'));

    await act(async () => await pSleep(props.timeout * .5));

    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entering');
  });

  it('sets its nested children animation props accordingly', async () => {
    const props = {
      animateOnMount: true,
      currentRoute: '/route-three',
      timeout: 100
    };

    const {queryByTestId} = render(<TestWrapper {...props}/>);

    expect(queryByTestId('/route-three').dataset.transitionstate).toBe('entering');

    fireEvent.click(queryByTestId('path::/nested/'));

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/nested/').dataset.transitionstate).toBe('entered');
    fireEvent.click(queryByTestId('path::/nested/route-one'));

    await act(async () => await pSleep(props.timeout));

    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('entered');
    fireEvent.click(queryByTestId('path::/nested/route-two'));

    await act(async () => await pSleep(props.timeout * .5));

    expect(queryByTestId('/nested/route-one').dataset.transitionstate).toBe('exiting');
    expect(queryByTestId('/nested/route-two').dataset.transitionstate).toBe('entering');

    await act(async () => await pSleep(props.timeout * .6));

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
        '/nested-two/',
        '/nested-two/one',
        '/nested-two/two'
      ]}
      handler={setRoute}
    />
    <RouterContext.Provider value={{currentRoute, previousRoute: prevRoute.current}}>
      <TransitionableReactRoute animateOnMount={animateOnMount} timeout={timeout} lvl={'parent'}>
        <TransitionableReactRoute path={'/nested'} lvl={'child'}>
          <DisplayPath path={'/'}/>
          <DisplayPath path={'/route-one'}/>
          <DisplayPath path={'/route-two'}/>
        </TransitionableReactRoute>

        <DisplayPath path={'/route-three'}/>
        <DisplayPath path={'/route-four'}/>
        <DisplayPath path={'/route-five'}/>

        <TransitionableReactRoute path={'/nested-two'} lvl={'child'}>
          <DisplayPath path={'/'}/>
          <DisplayPath path={'/one'}/>
          <DisplayPath path={'/two'}/>
        </TransitionableReactRoute>
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
