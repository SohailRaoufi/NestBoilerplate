import { HttpException, HttpStatus } from '@nestjs/common';

type UnprocessableType = {
  message: string;
  field: string;
};

export class UnprocessableException extends HttpException {
  constructor(errors: UnprocessableType | UnprocessableType[]) {
    const error = Array.isArray(errors) ? errors : [errors];
    super(
      {
        statusCode: 422,
        error: 'Unprocessable Entity',
        errors: error,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
