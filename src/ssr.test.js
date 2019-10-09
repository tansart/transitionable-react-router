import React, {useState, useEffect, useRef} from 'react';
import {renderToString} from 'react-dom/server';

import {RouterContext} from './RouterContext';
import {TransitionableReactRoute} from './TransitionableReactRoute';

function App({currentRoute}) {
  return <RouterContext.Provider value={{currentRoute}}>
    <TransitionableReactRoute>
      <DisplayPath path="/" />
      <DisplayPath path="/random-route" />
      <TransitionableReactRoute path="/nested">
        <DisplayPath path="/" />
        <DisplayPath path="/random-route" />
      </TransitionableReactRoute>
    </TransitionableReactRoute>
  </RouterContext.Provider>
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

describe("#SSR", () => {
  it('falls back to the default route', async () => {
    expect(renderToString(<App currentRoute={'/'} />)).toMatch(/data-testid="\/random-route"/);
    expect(renderToString(<App currentRoute={'/random-route'} />)).toMatch(/data-testid="\/random-route"/);
    expect(renderToString(<App currentRoute={'/nested/'} />)).toMatch(/data-testid="\/nested\/"/);
    expect(renderToString(<App currentRoute={'/nested/random-route'} />)).toMatch(/data-testid="\/nested\/random-route"/);
  });
});
