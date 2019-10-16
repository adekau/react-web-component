import { ReactComponentElement, PropsWithChildren, SyntheticEvent } from 'react';

var reactEvents: string[] = ["onAbort", "onAnimationCancel", "onAnimationEnd", "onAnimationIteration", "onAuxClick", "onBlur",
    "onChange", "onClick", "onClose", "onContextMenu", "onDoubleClick", "onError", "onFocus", "onGotPointerCapture",
    "onInput", "onKeyDown", "onKeyPress", "onKeyUp", "onLoad", "onLoadEnd", "onLoadStart", "onLostPointerCapture",
    "onMouseDown", "onMouseMove", "onMouseOut", "onMouseOver", "onMouseUp", "onChildMouseDown", "onChildClick", "onChildMouseUp", "onPointerCancel", "onPointerDown",
    "onPointerEnter", "onPointerLeave", "onPointerMove", "onPointerOut", "onPointerOver", "onPointerUp", "onReset",
    "onResize", "onScroll", "onSelect", "onSelectionChange", "onSelectStart", "onSubmit", "onTouchCancel",
    "onTouchMove", "onTouchStart", "onTransitionCancel", "onTransitionEnd", "onDrag", "onDragEnd", "onDragEnter",
    "onDragExit", "onDragLeave", "onDragOver", "onDragStart", "onDrop", "onFocusOut"];

var divergentNativeEvents = {
    onDoubleClick: 'dblclick'
};

var mimickedReactEvents = {
    onInput: 'onChange',
    onFocusOut: 'onBlur',
    onSelectionChange: 'onSelect'
};

type HTMLElementOrShadowRoot = HTMLElement | ShadowRoot;

export function retargetEvents(shadowRoot: HTMLElementOrShadowRoot): () => void {
    var removeEventListeners = [];

    reactEvents.forEach(function (reactEventName) {

        var nativeEventName = getNativeEventName(reactEventName);
        
        function retargetEvent(event: Event & SyntheticEvent) { 

            var path: HTMLElementOrShadowRoot[] = <HTMLElementOrShadowRoot[]>(event.composedPath && event.composedPath()) || composedPath(<HTMLElement>event.target);

            for (var i = 0; i < path.length; i++) {

                var el: HTMLElement | ShadowRoot = path[i];
                var reactComponent: ReactComponentElement<any> = findReactComponent(el);
                var props: PropsWithChildren<any> = findReactProps(reactComponent); 

                if (reactComponent && props) {
                    dispatchEvent(event, reactEventName, props);
                }

                if (reactComponent && props && mimickedReactEvents[reactEventName]) {
                    dispatchEvent(event, mimickedReactEvents[reactEventName], props);
                }

                if (event.cancelBubble) { 
                    break; 
                }                

                if (el === shadowRoot) {
                    break;
                }
            }
        }

        shadowRoot.addEventListener(nativeEventName, retargetEvent, false);
        
        removeEventListeners.push(function () { shadowRoot.removeEventListener(nativeEventName, retargetEvent, false); })
    });
    
    return function () {
      removeEventListeners.forEach((removeEventListener: () => void) => {
        removeEventListener();
      });
    };
};

function findReactComponent(item) {
  for (var key in item) {
      if (item.hasOwnProperty(key) && key.indexOf('_reactInternal') !== -1) {
          return item[key];
      }
  }
}

function findReactProps(component): PropsWithChildren<any> {
    if (!component) return undefined;
    if (component.memoizedProps) return component.memoizedProps; // React 16 Fiber
    if (component._currentElement && component._currentElement.props) return component._currentElement.props; // React <=15

}

function dispatchEvent(event: SyntheticEvent, eventType: string, componentProps: PropsWithChildren<any>): void {
    event.persist = function() {
        event['isPersistent'] = () => true;
    };

    Object.assign(event, { nativeEvent: event });

    if (componentProps[eventType]) {
        componentProps[eventType](event);
    }
}

function getNativeEventName(reactEventName: string): string {
    if (divergentNativeEvents[reactEventName]) {
        return divergentNativeEvents[reactEventName];
    }
    return reactEventName.replace(/^on/, '').toLowerCase();
}

function composedPath(el: HTMLElement): HTMLElementOrShadowRoot[] {
  var path = [];
  while (el) {
    path.push(el);
    if (el.tagName === 'HTML') {
      path.push(document);
      path.push(window);
      return path;
    }
    el = el.parentElement;
  }
}