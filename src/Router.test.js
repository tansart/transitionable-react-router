import React from 'react';
import {act, fireEvent, render, cleanup} from '@testing-library/react';

import {Router} from './Router';
import {RouterContext} from './RouterContext';

afterAll(cleanup);

describe("#Router", () => {
  let _setRoute = null;
  let _renderOptions = null;
  let _currentRoute = jest.fn();
  let _previousRoute = jest.fn();

  beforeEach(() => {
    _renderOptions = render(<Router>
      <RouterContext.Consumer>
        {({setRoute, currentRoute, previousRoute}) => {
          _setRoute = setRoute;
          _currentRoute(currentRoute);
          _previousRoute(previousRoute);
        }}
      </RouterContext.Consumer>
    </Router>);
  });

  it('initialises correctly', async () => {
    expect(typeof _setRoute).toBe('function');
    expect(last(_currentRoute)).toBe('/');
    expect(last(_previousRoute)).toBe('');
  });

  it('changes routes properly', async () => {
    act(() =>_setRoute('/route-one'));
    expect(last(_currentRoute)).toBe('/route-one');
    expect(last(_previousRoute)).toBe('/');
  });

  // Given we can't truly simulate a popstate, this will do.
  // We manually set the path to a random path, then check that invoking popstate
  // renders the Router with the given random path.
  it('pops routes properly', async () => {
    window.history.pushState({}, null, '/random-path');
    act(() => {
      window.dispatchEvent(new Event('popstate'));
    });
    expect(last(_currentRoute)).toBe('/random-path');
    expect(last(_previousRoute)).toBe('/route-one');
  });
});

function last({mock: {calls = []}}) {
  return (calls[calls.length -1] || [])[0];
}
