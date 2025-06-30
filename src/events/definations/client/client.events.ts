export type ClientForgetPasswordEventPayload = {
  fullName: string;
  email: string;
  token: string;
  expiry: Date;
};

export type ClientOtpEventPayload = {
  email: string;
  fullName: string;
  otpCode: number;
  otpId: string;
  expiry: Date;
};

export class ClientForgetPasswordEvent {
  constructor(public readonly payload: ClientForgetPasswordEventPayload) {}
}

export class ClientSendOtpEvent {
  constructor(public readonly payload: ClientOtpEventPayload) {}
}
