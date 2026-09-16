export const getFYDateBounds = (fyString) => {
  // fyString format: "2026-27"
  const startYear = parseInt(fyString.split("-")[0], 10);
  const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // April 1
  const endDate = new Date(Date.UTC(startYear + 1, 3, 1, 0, 0, 0)); // April 1 next year
  return { startDate, endDate, startYear };
};

export const getMonthDateBounds = (startYear, month) => {
  // Adjust calendar year for Jan-Mar (months 1, 2, 3)
  const actualYear = month >= 4 ? startYear : startYear + 1;
  const startDate = new Date(Date.UTC(actualYear, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(actualYear, month, 1, 0, 0, 0));
  return { startDate, endDate, actualYear };
};
