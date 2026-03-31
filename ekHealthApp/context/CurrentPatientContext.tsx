import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type CurrentPatient = {
  fullName: string | null;
  nrc: string | null;
  visitId: string | null;
};

type CurrentPatientContextValue = CurrentPatient & {
  isHydrated: boolean;
  clearCurrentPatient: () => Promise<void>;
  setCurrentPatient: (patient: Partial<CurrentPatient>) => Promise<void>;
};

const STORAGE_KEY = 'ekhealth/current-patient';

const emptyPatient: CurrentPatient = {
  fullName: null,
  nrc: null,
  visitId: null,
};

const CurrentPatientContext = createContext<CurrentPatientContextValue | undefined>(undefined);

async function persistCurrentPatient(patient: CurrentPatient) {
  const hasPatient = Boolean(patient.visitId || patient.nrc || patient.fullName);

  if (!hasPatient) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(patient));
}

export function CurrentPatientProvider({ children }: { children: React.ReactNode }) {
  const [currentPatient, setCurrentPatientState] = useState<CurrentPatient>(emptyPatient);
  const [isHydrated, setIsHydrated] = useState(false);
  const currentPatientRef = useRef<CurrentPatient>(emptyPatient);

  useEffect(() => {
    let isMounted = true;

    const loadStoredPatient = async () => {
      try {
        const storedPatient = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedPatient || !isMounted) {
          return;
        }

        const parsedPatient = JSON.parse(storedPatient) as Partial<CurrentPatient>;
        setCurrentPatientState({
          fullName: parsedPatient.fullName ?? null,
          nrc: parsedPatient.nrc ?? null,
          visitId: parsedPatient.visitId ?? null,
        });
      } catch (error: any) {
        console.warn('Failed to hydrate current patient context:', error?.message ?? error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void loadStoredPatient();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    currentPatientRef.current = currentPatient;
  }, [currentPatient]);

  const setCurrentPatient = useCallback(async (patient: Partial<CurrentPatient>) => {
    const nextPatient = {
      ...currentPatientRef.current,
      ...patient,
    };

    currentPatientRef.current = nextPatient;
    setCurrentPatientState(nextPatient);

    try {
      await persistCurrentPatient(nextPatient);
    } catch (error: any) {
      console.warn('Failed to persist current patient context:', error?.message ?? error);
    }
  }, []);

  const clearCurrentPatient = useCallback(async () => {
    currentPatientRef.current = emptyPatient;
    setCurrentPatientState(emptyPatient);

    try {
      await persistCurrentPatient(emptyPatient);
    } catch (error: any) {
      console.warn('Failed to clear current patient context:', error?.message ?? error);
    }
  }, []);

  const value = useMemo<CurrentPatientContextValue>(
    () => ({
      ...currentPatient,
      clearCurrentPatient,
      isHydrated,
      setCurrentPatient,
    }),
    [clearCurrentPatient, currentPatient, isHydrated, setCurrentPatient]
  );

  return <CurrentPatientContext.Provider value={value}>{children}</CurrentPatientContext.Provider>;
}

export function useCurrentPatient() {
  const context = useContext(CurrentPatientContext);

  if (!context) {
    throw new Error('useCurrentPatient must be used within a CurrentPatientProvider.');
  }

  return context;
}
