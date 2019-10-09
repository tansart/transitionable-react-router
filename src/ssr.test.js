import React, {useState, useEffect, useRef} from 'react';
import {renderToString} from 'react-dom/server';

import {RouterContext} from './RouterContext';
import {TransitionableReactRoute} from './TransitionableReactRoute';

function App() {
  return <RouterContext.Provider value={{currentRoute: '/random-route'}}>
    <TransitionableReactRoute>
      <span path="/random-route">hello</span>
    </TransitionableReactRoute>
  </RouterContext.Provider>
}

describe("#TransitionableReactRoute", () => {
  it('falls back to the default route', async () => {
    expect(renderToString(<App />)).toBe(false);
  });
});

