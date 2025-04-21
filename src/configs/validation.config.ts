import { UnprocessableEntityException, type ValidationPipeOptions } from '@nestjs/common';

/**
 * Validation options for the validation pipe.
 * This options is used for validating DTOs.
 * @see https://docs.nestjs.com/pipes#validation
 */
export const validationOptions: ValidationPipeOptions = {
  transform: true, // Transform payload to DTO instance
  whitelist: true, // Strip away any properties that do not have any decorators
  exceptionFactory: (errors) => {
    /**
     * Transform errors to be more readable.
     */
    return new UnprocessableEntityException({
      statusCode: 422,
      message: errors.map((error) => {
        /**
         * If the error has children, it means that the error is a nested object.
         * So we need to get the first child error. (e.g. location.latitude) and return it.
         */
        if (error.children && error.children.length > 0) {
          return {
            field: `${error.property}.${error.children[0].property}`,
            message: error.children.map((child) => (child.constraints ? Object.values(child.constraints)[0] : ''))[0],
          };
        }

        return {
          field: error.property,
          message: error.constraints ? Object.values(error.constraints)[0] : '',
        };
      }),
    });
  },
};
