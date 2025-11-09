/**
 * RoutesContext.jsx
 *
 * Centralized state for managing multiple route objects and their
 * model predictions.  Exposes a Context so components can read/write
 * the active route without prop drilling.
 */

import React, {
  createContext,
  useReducer,
  useContext,
  useMemo
} from "react";

let __routeCounter = 0;

/**
 * Factory for creating a blank route object.
 * @param {Partial<Route>} partial - optional fields to override defaults
 */
function newRoute(partial = {}) {
  const uid =
    (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `route-${Date.now()}-${__routeCounter++}`;

  return {
    id: uid,
    origin: null,                   // {lat, lng, label}
    destination: null,              // {lat, lng, label}
    travelDateTimeText: "",         // YYYY-MM-DD HH:mm
    routeData: null,                // Route data returned from Mapbox Directions API
    modelInputs: null,              // Derived properties used for model prediction
    prediction: null,               // Predicted relative crash risk
    status: "idle",                 // "idle" | "loading" | "error" | "done"
    error: null,                    // Report errors during prediction
    meta: {},                       // UI metadata (color, name, etc.)
    ...partial,
  };
}

// initial app state: one blank route selected
const initialState = {
  routes: [newRoute()],
  activeIndex: 0,
};

/**
 * Reducer handles immutable state updates for all route actions.
 */
function routesReducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE": {
      const i = action.index;
      if (i < 0 || i >= state.routes.length) {
        return state;
      }

      return { ...state, activeIndex: i };
    }

    case "ADD_ROUTE": {
      const newR = newRoute(action.payload || {});
      return {
        routes: [...state.routes, newR],
        activeIndex: state.routes.length,
      };
    }

    case "COPY_ACTIVE": {
      if (state.activeIndex < 0) {
        return state;
      }

      const base = state.routes[state.activeIndex];
      const copy = newRoute({
        ...base,
        id: undefined,
        status: "idle",
        error: null,
        prediction: null,
        modelInputs: null,
      });
      return {
        routes: [...state.routes, copy],
        activeIndex: state.routes.length,
      };
    }

    case "DELETE_ROUTE": {
      const i = action.index;
      if (i < 0 || i >= state.routes.length) {
        return state;
      }
      const next = state.routes.slice();
      next.splice(i, 1);
      const nextActive = Math.min(i, next.length - 1);
      return {
        routes: next.length ? next : [newRoute()],
        activeIndex: next.length ? nextActive : 0,
      };
    }

    case "UPDATE_ACTIVE_FIELDS": {
      // Merge arbitrary fields into the currently active route.
      if (state.activeIndex < 0) {
        return state;
      }
      const next = state.routes.slice();
      next[state.activeIndex] = {
        ...next[state.activeIndex],
        ...action.payload,
      };
      return { ...state, routes: next };
    }

    case "SET_ACTIVE_STATUS": {
      // Update the status string and optional error message.
      if (state.activeIndex < 0) {
        return state;
      }
      const next = state.routes.slice();
      next[state.activeIndex] = {
        ...next[state.activeIndex],
        status: action.status,
        error: action.error ?? null,
      };
      return { ...state, routes: next };
    }

    case "SET_ACTIVE_RESULT": {
      // Write the model output (prediction + inputs) to the active route.
      if (state.activeIndex < 0) {
        return state;
      }
      const next = state.routes.slice();
      next[state.activeIndex] = {
        ...next[state.activeIndex],
        modelInputs: action.modelInputs ?? null,
        prediction: action.prediction ?? null,
        status: action.status ?? "done",
        error: null,
      };
      return { ...state, routes: next };
    }

    default:
      return state;
  }
}

/**
 * React Context used to expose routes state throughout the app.
 */
const RoutesCtx = createContext(null);

/**
 * Provider component that wraps the app.
 */
export function RoutesProvider({ children }) {
  const [state, dispatch] = useReducer(routesReducer, initialState);

  // Create convenient action wrappers once per render.
  const value = useMemo(() => {
    const active =
      state.activeIndex >= 0 ? state.routes[state.activeIndex] : null;

    return {
      ...state,
      active,                                   // currently selected route
      setActive: (index) => dispatch({ type: "SET_ACTIVE", index }),
      addRoute: (payload) => dispatch({ type: "ADD_ROUTE", payload }),
      copyActive: () => dispatch({ type: "COPY_ACTIVE" }),
      deleteRoute: (index) => dispatch({ type: "DELETE_ROUTE", index }),
      updateActive: (payload) =>
        dispatch({ type: "UPDATE_ACTIVE_FIELDS", payload }),
      setActiveStatus: (status, error) =>
        dispatch({ type: "SET_ACTIVE_STATUS", status, error }),
      setActiveResult: (result) =>
        dispatch({ type: "SET_ACTIVE_RESULT", ...result }),
    };
  }, [state]);

  return <RoutesCtx.Provider value={value}>{children}</RoutesCtx.Provider>;
}

/**
 * Hook for consuming the routes context.
 * Throws an error if called outside a <RoutesProvider>.
 */
export function useRoutes() {
  const ctx = useContext(RoutesCtx);
  if (!ctx) throw new Error("useRoutes must be used inside <RoutesProvider>");
  return ctx;
}
