import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional HTTP interceptor for application-wide request/response tracking.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};

