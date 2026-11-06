import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import {
  GraphQLResponse,
  GraphQLRequestOptions,
  GraphQLError,
  GraphQLNetworkError,
  GraphQLHttpError
} from '../models/graphql.model';

/**
 * Robust generic GraphQL client service.
 * Supports configurable retries with delay, distinguishes network/HTTP/GraphQL errors,
 * and parses GraphQL errors returned within HTTP 200 responses.
 */
@Injectable({
  providedIn: 'root'
})
export class GraphQLService {
  private readonly http = inject(HttpClient);

  /**
   * Executes a GraphQL query or mutation against the specified endpoint.
   *
   * @template T The expected type of the data field in the GraphQL response.
   * @param endpoint The HTTP URL of the GraphQL server.
   * @param query The GraphQL query or mutation document string.
   * @param variables Optional key-value variables passed to the query.
   * @param options Optional configuration for retries, backoff delay, and custom headers.
   * @returns Observable emitting the parsed GraphQL data or throwing a typed Error.
   */
  public execute<T>(
    endpoint: string,
    query: string,
    variables?: Record<string, unknown>,
    options?: GraphQLRequestOptions
  ): Observable<T> {
    const retries = options?.retries ?? 0;
    const retryDelayMs = options?.retryDelayMs ?? 1000;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    });

    let stream$: Observable<GraphQLResponse<T>> = this.http.post<GraphQLResponse<T>>(
      endpoint,
      { query, variables },
      { headers }
    );

    // Apply retry with backoff delay if requested
    if (retries > 0) {
      stream$ = stream$.pipe(
        retry({
          count: retries,
          delay: (error: unknown, retryCount: number) => {
            console.warn(
              `[GraphQLService] Retrying GraphQL request (${retryCount}/${retries}) to ${endpoint}...`,
              error
            );
            return timer(retryCount * retryDelayMs);
          }
        })
      );
    }

    return stream$.pipe(
      map((response: GraphQLResponse<T>) => {
        // Requirement 4: Handle GraphQL errors even when HTTP status is 200
        if (response.errors && response.errors.length > 0) {
          const summary = response.errors.map(e => e.message).join('; ');
          throw new GraphQLError(`GraphQL Query Error: ${summary}`, response.errors);
        }

        if (!response.data) {
          throw new GraphQLError('GraphQL response contained neither data nor errors', []);
        }

        return response.data;
      }),
      catchError((error: unknown) => {
        // If it's already our GraphQLError, rethrow directly
        if (error instanceof GraphQLError) {
          return throwError(() => error);
        }

        // Requirement 2: Handle network errors (status 0 in Angular HttpClient)
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            return throwError(
              () =>
                new GraphQLNetworkError(
                  `Network error: Failed to reach GraphQL endpoint at ${endpoint}. Please check your connection or CORS settings.`,
                  error
                )
            );
          }

          // Requirement 3: Handle HTTP errors (4xx, 5xx)
          return throwError(
            () =>
              new GraphQLHttpError(
                `HTTP Error ${error.status} (${error.statusText}) from ${endpoint}`,
                error.status,
                error.statusText
              )
          );
        }

        // Other generic errors
        const message = error instanceof Error ? error.message : 'Unknown GraphQL transport failure';
        return throwError(() => new Error(message));
      })
    );
  }
}
