import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.getMessage(exceptionResponse, exception);
    const error = this.getError(exceptionResponse, status);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getMessage(
    exceptionResponse: string | object | undefined,
    exception: unknown,
  ) {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return exceptionResponse.message;
    }
    return exception instanceof Error
      ? exception.message
      : 'Internal server error';
  }

  private getError(
    exceptionResponse: string | object | undefined,
    status: number,
  ) {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
    ) {
      return exceptionResponse.error;
    }
    return HttpStatus[status] ?? 'Error';
  }
}
