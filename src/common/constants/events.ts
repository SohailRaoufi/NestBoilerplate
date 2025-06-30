export const eventTypes = ['user.send-otp', 'user.forgot-password'] as const;

export type EventType = (typeof eventTypes)[number];
