export const BONUS_BOOKINGS_TARGET = 3;

export const getBonusProgressMessage = (target: number = BONUS_BOOKINGS_TARGET) => (
  `Completa ${target} prenotazioni e ricevi un bonus.`
);
