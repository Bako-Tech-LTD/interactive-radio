import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { RadioState, CoveredTopic } from "@/types/radio";

export interface SourceConfig {
  rss: boolean;
  twitter: boolean;
  reddit: boolean;
}

interface RadioContextState {
  state: RadioState;
  currentTopic: string | null;
  coveredTopics: CoveredTopic[];
  isSpeaking: boolean;
  error: string | null;
  enabledSources: SourceConfig;
}

type RadioAction =
  | { type: "SET_STATE"; payload: RadioState }
  | { type: "SET_CURRENT_TOPIC"; payload: string | null }
  | { type: "ADD_COVERED_TOPIC"; payload: CoveredTopic }
  | { type: "SET_SPEAKING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "TOGGLE_SOURCE"; payload: keyof SourceConfig }
  | { type: "RESET" };

const initialState: RadioContextState = {
  state: "idle",
  currentTopic: null,
  coveredTopics: [],
  isSpeaking: false,
  error: null,
  enabledSources: {
    rss: true,
    twitter: true,
    reddit: false,
  },
};

function radioReducer(
  state: RadioContextState,
  action: RadioAction
): RadioContextState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, state: action.payload, error: null };
    case "SET_CURRENT_TOPIC":
      return { ...state, currentTopic: action.payload };
    case "ADD_COVERED_TOPIC":
      return {
        ...state,
        coveredTopics: [...state.coveredTopics, action.payload],
      };
    case "SET_SPEAKING":
      return { ...state, isSpeaking: action.payload };
    case "SET_ERROR":
      return { ...state, state: "error", error: action.payload };
    case "TOGGLE_SOURCE":
      return {
        ...state,
        enabledSources: {
          ...state.enabledSources,
          [action.payload]: !state.enabledSources[action.payload],
        },
      };
    case "RESET":
      return { 
        ...initialState, 
        enabledSources: state.enabledSources,
        coveredTopics: state.coveredTopics,
      };
    default:
      return state;
  }
}

interface RadioContextType extends RadioContextState {
  dispatch: React.Dispatch<RadioAction>;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(radioReducer, initialState);

  return (
    <RadioContext.Provider value={{ ...state, dispatch }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadioContext() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadioContext must be used within a RadioProvider");
  }
  return context;
}
