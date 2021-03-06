import React, { useMemo } from "react";
import createPersistedState from "use-persisted-state";
import dayjs from "dayjs";

import {
  UserStateContextProvider,
  UserState,
  EarningsEnum,
  EarningsRecord,
  PensionEnum,
  UserProfile,
} from "./user-state-context";
import {
  UserStateActions,
  UserStateActionsContextProvider,
} from "./user-state-actions-context";

// Must use sessionStorage (not localStorage) or else it conflicts with other uses of sessionStorage within app
const useBirthDateState = createPersistedState(
  "BirthDate",
  global.sessionStorage
);
const useHaveEarningsState = createPersistedState(
  "haveEarnings",
  global.sessionStorage
);
const useEarningsFormatState = createPersistedState(
  "earningsFormat",
  global.sessionStorage
);
const useHaveSSAAccountState = createPersistedState(
  "haveSSAAccount",
  global.sessionStorage
);
const useEarningsState = createPersistedState(
  "earnings",
  global.sessionStorage
);
const useIsEmploymentCoveredState = createPersistedState(
  "coveredEmployment",
  global.sessionStorage
);
const usePensionOrRetirementAccountState = createPersistedState(
  "pensionOrRetirementAccount",
  global.sessionStorage
);
const usePensionAmountState = createPersistedState(
  "pensionAmount",
  global.sessionStorage
);
const usePensionDateAwarded = createPersistedState(
  "dateAwarded",
  global.sessionStorage
);
const useUserProfile = createPersistedState(
  "UserProfile",
  global.sessionStorage
);
const usePreferPiaUserCalcState = createPersistedState(
  "preferPiaUserCalcState",
  global.sessionStorage
);
const useExpectedLastEarningYear = createPersistedState(
  "ExpectedLastEarningYear",
  global.sessionStorage
);
const useAwiTrendOrManualPrediction = createPersistedState(
  "awiTrendOrManualPrediction",
  global.sessionStorage
);
const useAwiTrendSelection = createPersistedState(
  "awiTrendSelection",
  global.sessionStorage
);
const useExpectedPercentageWageIncrease = createPersistedState(
  "expectedPercentageWageIncrease",
  global.sessionStorage
);

// TODO The following should eventually be derived from the state values persisted to storage
const useRetireDateState = createPersistedState(
  "RetireDate",
  global.sessionStorage
);
const useYear62State = createPersistedState("Year62", global.sessionStorage);

/* Union the full set of years that the user might specify from both the
 * EarningsRecord we got from any XML/PDF input
 * and the birth year to specified retirement date of the user,
 * whichever is more complete. 
 * If no retire date is specified, set it to their 70th birthday
 */
function mergeYears(
  earnings: EarningsRecord,
  birthDate: Date | null,
  retireDate: Date | null,
  expectedLastEarningYear: number | null
): EarningsRecord {
  console.log(`expectedLastEarningYear:${expectedLastEarningYear}, birthdate: ${birthDate}, retireDate: ${retireDate}`)
  if (birthDate === null) return earnings;
  const birthYear = dayjs(birthDate).get('year');
  const maxRetireDate = dayjs(birthDate).add(71,'year').toDate()
  const retireYearFromReport = dayjs(retireDate!).get('year') || null;

  let cleanRetireDate: Date;
  if ((expectedLastEarningYear && retireDate) === null) {
    cleanRetireDate = dayjs(birthDate).add(71,'year').toDate();
  } else if ((expectedLastEarningYear === null) && (retireYearFromReport! - birthYear) < 71){
    cleanRetireDate = retireDate!
  } else if ((retireDate === null) && ((expectedLastEarningYear! - birthYear) < 71)){
    cleanRetireDate = dayjs().year(expectedLastEarningYear!).toDate()
  } else {
    cleanRetireDate = maxRetireDate
  }

  const earningsRecord = earnings || {};

  const startEmploymentYear =
    (earnings && Object.keys(earnings) && Number(Object.keys(earnings)[0])) ||
    birthYear + 18;
  const retireYear = dayjs(cleanRetireDate).get('year');
  const endYear = retireYear;

  var tempRecord = {} as EarningsRecord;
  for (var i = startEmploymentYear; i <= endYear; i++) {
    if (Object.keys(earningsRecord).includes(String(i))) {
      tempRecord[i] = earningsRecord[i];
    } else {
      tempRecord[i] = 0;
    }
  }
  return tempRecord;
}
/**
 * Helper function to get a Date object equivalent to the start of the date given
 */
function startOfDay(date: Date): Date {
  return dayjs(date).startOf("day").toDate();
}

interface UserStateManagerProps {
  children: React.ReactNode;
}

/**
 * Serve as a multi-context provider for descendent components, providing them with access to
 * the user state and a set of actions to mutate that state, while persisting it to session storage.
 */
export default function UserStateManager(
  props: UserStateManagerProps
): JSX.Element {
  const { children } = props;
  const [birthDate, setBirthDate] = useBirthDateState<Date | null>(null);
  const [retireDate, setRetireDate] = useRetireDateState<Date | null>(null);
  const [year62, setYear62] = useYear62State<number | null>(null);
  const [haveEarnings, setHaveEarnings] = useHaveEarningsState<boolean | null>(
    null
  );
  const [earnings, setEarnings] = useEarningsState<EarningsRecord | null>(null);
  const [
    earningsFormat,
    setEarningsFormat,
  ] = useEarningsFormatState<EarningsEnum | null>(null);
  const [haveSSAAccount, setHaveSSAAccount] = useHaveSSAAccountState<
    boolean | null
  >(null);
  const [
    isEmploymentCovered,
    setIsEmploymentCovered,
  ] = useIsEmploymentCoveredState<boolean | null>(null);
  const [
    pensionOrRetirementAccount,
    setPensionOrRetirementAccount,
  ] = usePensionOrRetirementAccountState<PensionEnum | null>(null);
  const [
    pensionDateAwarded,
    setPensionDateAwarded,
  ] = usePensionDateAwarded<Date | null>(null);
  const [userProfile, setUserProfile] = useUserProfile<UserProfile | null>(
    null
  );
  const [preferPiaUserCalc, setPreferPiaUserCalc] = usePreferPiaUserCalcState<
    boolean | null
  >(false);
  const [pensionAmount, setPensionAmount] = usePensionAmountState<
    number | null
  >(null);

  const [
    expectedLastEarningYear,
    setExpectedLastEarningYear,
  ] = useExpectedLastEarningYear<number | null>(dayjs().year());
  const [
    awiTrendOrManualPrediction,
    setAwiTrendOrManualPrediction,
  ] = useAwiTrendOrManualPrediction<FuturePredictionEnum | null>(null);
  const [
    awiTrendSelection,
    setAwiTrendSelection,
  ] = useAwiTrendSelection<FutureTrendEnum | null>(null);
  const [
    expectedPercentageWageIncrease,
    setExpectedPercentageWageIncrease,
  ] = useExpectedPercentageWageIncrease<number | null>(0.01);
  const userState: UserState = useMemo(
    () => (
      {
      birthDate: birthDate ? new Date(birthDate) : null,
      retireDate: retireDate ? new Date(retireDate) : null,
      fullRetirementAge:
        birthDate && retireDate
          ? dayjs(retireDate).diff(birthDate, "year", true)
          : null,
      isManual:
        !(earningsFormat === EarningsEnum.XML ||
        earningsFormat === EarningsEnum.PDF),
      fullRetirementAgeYearsOnly:
        birthDate && retireDate
          ? dayjs(retireDate).diff(birthDate, "year", false)
          : null,
      fullRetirementAgeMonthsOnly:
        birthDate && retireDate
          ? dayjs(retireDate).diff(birthDate, "month", false) % 12
          : null,
      year62,
      haveEarnings,
      earnings,
      earningsFormat,
      haveSSAAccount,
      isEmploymentCovered,
      pensionOrRetirementAccount,
      pensionAmount,
      pensionDateAwarded,
      userProfile,
      preferPiaUserCalc,
      expectedLastEarningYear,
      awiTrendOrManualPrediction,
      awiTrendSelection,
      expectedPercentageWageIncrease,
    }),
    [
      birthDate,
      earnings,
      earningsFormat,
      haveEarnings,
      haveSSAAccount,
      isEmploymentCovered,
      pensionAmount,
      pensionDateAwarded,
      pensionOrRetirementAccount,
      retireDate,
      userProfile,
      year62,
      preferPiaUserCalc,
      awiTrendOrManualPrediction,
      awiTrendSelection,
      expectedLastEarningYear,
      expectedPercentageWageIncrease
    ]
  );

  const actions: UserStateActions = useMemo(
    () => ({
      setBirthDate: (date) => setBirthDate(date ? startOfDay(date) : null),
      setRetireDate: (date) => setRetireDate(date ? startOfDay(date) : null),
      setYear62,
      setHaveEarnings,
      /* setEarnings & mergeYears is unlikely to fire retroactively on changes 
      of birthdate or retire date ideally we'd have a single function for all
       three alterations (or wrappers around each of them) if we go this way in the end*/
      setEarnings: (earnings) => setEarnings(mergeYears(earnings, birthDate, retireDate, expectedLastEarningYear)), 
      /* note the entries in the dependency array for birthDate, retireDate, and expectedLastEarningYear */
      setEarningsFormat,
      setHaveSSAAccount,
      setIsEmploymentCovered,
      setPensionOrRetirementAccount,
      setPensionAmount,
      setPensionDateAwarded,
      setUserProfile,
      setPreferPiaUserCalc,
      setExpectedLastEarningYear,
      setAwiTrendOrManualPrediction,
      setAwiTrendSelection,
      setExpectedPercentageWageIncrease,
    }),
    [
      setBirthDate,
      setRetireDate,
      setYear62,
      setHaveEarnings,
      setEarnings,
      setEarningsFormat,
      setHaveSSAAccount,
      setIsEmploymentCovered,
      setPensionOrRetirementAccount,
      setPensionAmount,
      setPensionDateAwarded,
      setUserProfile,
      setPreferPiaUserCalc,
      setExpectedLastEarningYear,
      setAwiTrendOrManualPrediction,
      setAwiTrendSelection,
      setExpectedPercentageWageIncrease,
      birthDate,
      retireDate,
      expectedLastEarningYear
    ]
  );

  return (
    <UserStateContextProvider value={userState}>
      <UserStateActionsContextProvider value={actions}>
        {children}
      </UserStateActionsContextProvider>
    </UserStateContextProvider>
  );
}
