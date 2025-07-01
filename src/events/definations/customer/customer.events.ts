export type CustomerForgetPasswordEventPayload = {
  fullName: string;
  email: string;
  token: string;
  expiry: Date;
};

export type CustomerOtpEventPayload = {
  email: string;
  fullName: string;
  otpCode: number;
  otpId: string;
  expiry: Date;
};

export class CustomerForgetPasswordEvent {
  constructor(public readonly payload: CustomerForgetPasswordEventPayload) {}
}

export class CustomerSendOtpEvent {
  constructor(public readonly payload: CustomerOtpEventPayload) {}
}
