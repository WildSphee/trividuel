let matchSocket = null;

export const setMatchSocket = (ws) => {
  matchSocket = ws;
};

export const getMatchSocket = () => matchSocket;
