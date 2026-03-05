let lastVisitId: string | null = null;
let lastNrc: string | null = null;

export const setLastVisitId = (id: string | null) => {
  lastVisitId = id;
};

export const getLastVisitId = () => lastVisitId;

export const setLastNrc = (nrc: string | null) => {
  lastNrc = nrc;
};

export const getLastNrc = () => lastNrc;

export default { setLastVisitId, getLastVisitId, setLastNrc, getLastNrc };
