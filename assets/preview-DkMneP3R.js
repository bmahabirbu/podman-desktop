import{b as i,r as p,D as T}from"./DocsRenderer-CFRXHY34-BzhZgDVe.js";import{g as j}from"./_commonjsHelpers-CqkleIqs.js";import"./preview-o1UDFf8P.js";import"./iframe-Dnn3TECw.js";import"./index-CfOrKyLd.js";import"./index-DrFu-skq.js";var E="DARK_MODE",y,b;function R(){return b||(b=1,y=function t(r,e){if(r===e)return!0;if(r&&e&&typeof r=="object"&&typeof e=="object"){if(r.constructor!==e.constructor)return!1;var n,a,o;if(Array.isArray(r)){if(n=r.length,n!=e.length)return!1;for(a=n;a--!==0;)if(!t(r[a],e[a]))return!1;return!0}if(r.constructor===RegExp)return r.source===e.source&&r.flags===e.flags;if(r.valueOf!==Object.prototype.valueOf)return r.valueOf()===e.valueOf();if(r.toString!==Object.prototype.toString)return r.toString()===e.toString();if(o=Object.keys(r),n=o.length,n!==Object.keys(e).length)return!1;for(a=n;a--!==0;)if(!Object.prototype.hasOwnProperty.call(e,o[a]))return!1;for(a=n;a--!==0;){var u=o[a];if(!t(r[u],e[u]))return!1}return!0}return r!==r&&e!==e}),y}var I=R();const D=j(I);function l(t){"@babel/helpers - typeof";return l=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(r){return typeof r}:function(r){return r&&typeof Symbol=="function"&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r},l(t)}var d;function w(t,r){var e=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);r&&(n=n.filter(function(a){return Object.getOwnPropertyDescriptor(t,a).enumerable})),e.push.apply(e,n)}return e}function P(t){for(var r=1;r<arguments.length;r++){var e=arguments[r]!=null?arguments[r]:{};r%2?w(Object(e),!0).forEach(function(n){M(t,n,e[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(e)):w(Object(e)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(e,n))})}return t}function M(t,r,e){return r=q(r),r in t?Object.defineProperty(t,r,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[r]=e,t}function q(t){var r=x(t,"string");return l(r)==="symbol"?r:String(r)}function x(t,r){if(l(t)!=="object"||t===null)return t;var e=t[Symbol.toPrimitive];if(e!==void 0){var n=e.call(t,r);if(l(n)!=="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(r==="string"?String:Number)(t)}function s(t){return L(t)||B(t)||N(t)||K()}function K(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function N(t,r){if(t){if(typeof t=="string")return g(t,r);var e=Object.prototype.toString.call(t).slice(8,-1);if(e==="Object"&&t.constructor&&(e=t.constructor.name),e==="Map"||e==="Set")return Array.from(t);if(e==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e))return g(t,r)}}function B(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function L(t){if(Array.isArray(t))return g(t)}function g(t,r){(r==null||r>t.length)&&(r=t.length);for(var e=0,n=new Array(r);e<r;e++)n[e]=t[e];return n}const{global:Y}=__STORYBOOK_MODULE_GLOBAL__,{STORY_CHANGED:X,SET_STORIES:Z,DOCS_RENDERED:rr}=__STORYBOOK_MODULE_CORE_EVENTS__;var A=Y,U=A.document,c=A.window,C="sb-addon-themes-3";(d=c.matchMedia)===null||d===void 0||d.call(c,"(prefers-color-scheme: dark)");var m={classTarget:"body",dark:i.dark,darkClass:["dark"],light:i.light,lightClass:["light"],stylePreview:!1,userHasExplicitlySetTheTheme:!1},k=function(r){c.localStorage.setItem(C,JSON.stringify(r))},V=function(r,e){var n=e.current,a=e.darkClass,o=a===void 0?m.darkClass:a,u=e.lightClass,v=u===void 0?m.lightClass:u;if(n==="dark"){var O,_;(O=r.classList).remove.apply(O,s(f(v))),(_=r.classList).add.apply(_,s(f(o)))}else{var h,S;(h=r.classList).remove.apply(h,s(f(o))),(S=r.classList).add.apply(S,s(f(v)))}},f=function(r){var e=[];return e.concat(r).map(function(n){return n})},F=function(r){var e=U.querySelector(r.classTarget);e&&V(e,r)},G=function(){var r=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},e=c.localStorage.getItem(C);if(typeof e=="string"){var n=JSON.parse(e);return r&&(r.dark&&!D(n.dark,r.dark)&&(n.dark=r.dark,k(n)),r.light&&!D(n.light,r.light)&&(n.light=r.light,k(n))),n}return P(P({},m),r)};F(G());const{addons:tr,useState:er,useEffect:nr}=__STORYBOOK_MODULE_PREVIEW_API__,{definePreview:ar}=__STORYBOOK_MODULE_PREVIEW_API__,or={parameters:{controls:{matchers:{color:/(background|color)$/i,date:/Date$/i}},darkMode:{current:"light",darkClass:"dark",lightClass:"light",dark:{...i.dark,appPreviewBg:"transparent"},light:{...i.light,appPreviewBg:"transparent"},stylePreview:!0},docs:{container:t=>{const[r,e]=p.useState(!0);p.useEffect(()=>(t.context.channel.on(E,e),()=>t.context.channel.removeListener(E,e)),[t.context.channel]);const n={...t};return n.theme=r?i.dark:i.light,p.createElement(T,n)}}}};export{or as default};
