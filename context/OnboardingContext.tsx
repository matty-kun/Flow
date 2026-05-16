import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

type OnboardingContextType = {
  isOnboarded: boolean;
  userName: string | null;
  dailyGoalHours: number | null;
  projects: string[];
  setUserName: (name: string) => Promise<void>;
  setDailyGoalHours: (hours: number) => Promise<void>;
  setProjects: (projects: string[]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_KEY = "klowk_onboarded";
const USER_NAME_KEY = "klowk_user_name";
const DAILY_GOAL_KEY = "klowk_daily_goal_hours";
const PROJECTS_KEY = "klowk_projects";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [dailyGoalHours, setDailyGoalHoursState] = useState<number | null>(null);
  const [projects, setProjectsState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        const name = await AsyncStorage.getItem(USER_NAME_KEY);
        const goal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
        const savedProjects = await AsyncStorage.getItem(PROJECTS_KEY);

        setIsOnboarded(onboarded === "true");
        setUserNameState(name);
        if (goal) setDailyGoalHoursState(parseFloat(goal));
        if (savedProjects) setProjectsState(JSON.parse(savedProjects));
      } catch (e) {
        console.error("Failed to load onboarding state", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadOnboardingState();
  }, []);

  const setUserName = async (name: string) => {
    try {
      setUserNameState(name);
      await AsyncStorage.setItem(USER_NAME_KEY, name);
    } catch (e) {
      console.error("Failed to save user name", e);
    }
  };

  const setDailyGoalHours = async (hours: number) => {
    try {
      setDailyGoalHoursState(hours);
      await AsyncStorage.setItem(DAILY_GOAL_KEY, hours.toString());
    } catch (e) {
      console.error("Failed to save daily goal", e);
    }
  };

  const setProjects = async (projectsArray: string[]) => {
    try {
      setProjectsState(projectsArray);
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsArray));
    } catch (e) {
      console.error("Failed to save projects", e);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboarded(true);
    } catch (e) {
      console.error("Failed to complete onboarding", e);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem(USER_NAME_KEY);
      await AsyncStorage.removeItem(DAILY_GOAL_KEY);
      await AsyncStorage.removeItem(PROJECTS_KEY);
      setIsOnboarded(false);
      setUserNameState(null);
      setDailyGoalHoursState(null);
      setProjectsState([]);
    } catch (e) {
      console.error("Failed to reset onboarding", e);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarded,
        userName,
        dailyGoalHours,
        projects,
        setUserName,
        setDailyGoalHours,
        setProjects,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
