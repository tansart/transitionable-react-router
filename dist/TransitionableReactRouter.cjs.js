"use strict";function _interopDefault(t){return t&&"object"==typeof t&&"default"in t?t.default:t}Object.defineProperty(exports,"__esModule",{value:!0});var React=require("react"),React__default=_interopDefault(React);function _defineProperty(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ownKeys(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),n.push.apply(n,o)}return n}function _objectSpread2(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?ownKeys(Object(n),!0).forEach(function(e){_defineProperty(t,e,n[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):ownKeys(Object(n)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))})}return t}function _objectWithoutPropertiesLoose(t,e){if(null==t)return{};var n,o,r={},c=Object.keys(t);for(o=0;o<c.length;o++)n=c[o],e.indexOf(n)>=0||(r[n]=t[n]);return r}function _objectWithoutProperties(t,e){if(null==t)return{};var n,o,r=_objectWithoutPropertiesLoose(t,e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(t);for(o=0;o<c.length;o++)n=c[o],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(r[n]=t[n])}return r}const RouterContext=React.createContext();function Router(t){let{children:e}=t;const[n,o]=React.useState({currentRoute:window.location.pathname,previousRoute:""});return React.useEffect(()=>{function t(){o(t=>({currentRoute:"/".concat(window.location.pathname).replace("//","/"),previousRoute:t.currentRoute}))}return window.addEventListener("popstate",t),function(){window.removeEventListener("popstate",t)}},[]),React__default.createElement(RouterContext.Provider,{value:_objectSpread2({setRoute:t=>{window.history.pushState({},null,t),o(t=>({currentRoute:window.location.pathname,previousRoute:t.currentRoute}))}},n)},e)}const IS_SSR="undefined"==typeof window,TRANSITION_STATES=["entering","entered","exiting","exited"],NEXT_STEP_MAP=[1,1,3,3];function mapToRegExp(t){let[e,n,o]=t,r=arguments.length>1&&void 0!==arguments[1]&&arguments[1];const c=normalisePath(o?"".concat(o,"/").concat(n):n),[u,a]=deconstructURL(c);let i=u;return r?i="".concat(u,"\\/.*"):"/"===n&&(i="".concat(u,"\\/")),[new RegExp("".concat(i,"$"),"ig"),a,e]}function TransitionableReactRoute(t){let{path:e,timeout:n=1e3,animateOnMount:o,children:r}=t,c=_objectWithoutProperties(t,["path","timeout","animateOnMount","children"]);const u=Date.now(),a=React.useRef([]),i=React.useRef([]),s=React.useContext(RouterContext),l=s.currentRoute,p="".concat(l,"_").concat(u),[f,R]=React.useState(IS_SSR?[{state:o?0:1,key:p,timestamp:u,currentRoute:l}]:[]);return a.current.length||React__default.Children.forEach(r,t=>{const{path:r,defaultpath:c}=t.props,u=t.type===TransitionableReactRoute,i=_objectSpread2({},t.props,{fullPath:c?"defaultpath":normalisePath("".concat(e||"","/").concat(r)),timeout:n});u&&(i.animateOnMount=o);const s=React__default.cloneElement(t,i);c?a.current.push([/.*/gi,[!1],s]):a.current.push(mapToRegExp([s,r,e],u))}),React.useEffect(()=>()=>{i.current.forEach(clearTimeout),i.current=[]},[]),React.useEffect(()=>{!(c.transitionstate===TRANSITION_STATES[2])&&R(t=>{const e=[...t],r=Date.now(),c=checkIfSameParent((last(e)||{}).currentRoute,s.currentRoute,a),u=[],f=e.length-1;return e.length>0&&e[f].state<2&&!c&&(u.push(f),e[f]=_objectSpread2({},e[f],{now:r,state:2})),c||(u.push(e.length),e.push({state:o?0:1,key:p,timestamp:r,currentRoute:l})),u.forEach(t=>{const o=setTimeout(()=>onAnimationEnd(R,n),n);clearTimeout(e[t].timeoutRef),i.current.push(o),e[t].timeoutRef=o}),e})},[l]),React.useMemo(()=>f.map(t=>{let{currentRoute:e,key:n,state:o}=t;const r=greedyMatchComponent(a.current,e);return r.component?React__default.createElement(r.component.type,_objectSpread2({key:n},r.component.props,{query:r.query,transitionstate:TRANSITION_STATES[o]})):null}),[f])}function checkIfSameParent(t,e,n){const o=matchRoute(n,t),r=matchRoute(n,e);return r&&o?o[o.length-1]===r[r.length-1]:null}function matchRoute(t,e){if(!e)return null;for(let[n]of t.current){n.lastIndex=0;const t=n.exec(e);if(t)return t}}function onAnimationEnd(t,e){t(t=>{let n=!1;const o=Date.now(),r=[...t];for(let t=0;t<r.length;t++){const c=NEXT_STEP_MAP[r[t].state];o-r[t].timestamp>=e&&c!==r[t].state&&(n=!0,r[t]=_objectSpread2({},r[t],{state:c}))}return n?r.filter(t=>{let{state:e}=t;return e<3}):t})}function greedyMatchComponent(t,e){t:for(let[n,o,r]of t){n.lastIndex=0;const t=n.exec(e);if(!t)continue;let c={};for(let e=0;e<o.length;e++)if("string"==typeof o[e]&&(c[o[e]]=t[e+1],!t[e+1]))continue t;return{component:r,query:c}}return{component:null,attributes:null}}function deconstructURL(t){const e=t.split("/");return"/"===t?["^",[!1]]:e.filter(t=>!!t).reduce((t,e,n)=>{const o=t[1];return 0===e.indexOf(":")?(o.push(e.substring(1)),["".concat(t[0],"\\/?([^\\/]+)?"),o]):(o.push(!1),n>0?["".concat(t[0],"\\/(").concat(e,")"),o]:["".concat(t[0],"(").concat(e,")"),o])},["^\\/",[]])}function normalisePath(){return(arguments.length>0&&void 0!==arguments[0]?arguments[0]:"").replace("//","/")}function last(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return t[t.length-1]}exports.Router=Router,exports.RouterContext=RouterContext,exports.TransitionableReactRoute=TransitionableReactRoute;