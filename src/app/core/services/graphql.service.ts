import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { GraphQLResponse, GraphQLRequestOptions } from '../models/graphql.model';

/**
 * Generic application-wide GraphQL client service.
 * Supports configurable retries with backoff and parses GraphQL errors on HTTP 200.
 */
@Injectable({
  providedIn: 'root'
})
export class GraphQLService {
  private readonly http = inject(HttpClient);

  /**
   * Executes a GraphQL query or mutation against a given endpoint.
   *
   * @template T The expected type of data inside the GraphQL response.
   * @param endpoint The HTTP URL of the GraphQL server.
   * @param query The GraphQL query or mutation document.
   * @param variables Optional query variables.
   * @param options Optional retry count, delay, and headers.
   * @returns Observable emitting the parsed GraphQL data or throwing an Error.
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

    if (retries > 0) {
      stream$ = stream$.pipe(
        retry({
          count: retries,
          delay: (error: unknown, retryCount: number) => {
            console.warn(
              `[GraphQLService] Retrying request (${retryCount}/${retries}) to ${endpoint}...`,
              error
            );
            return timer(retryCount * retryDelayMs);
          }
        })
      );
    }

    return stream$.pipe(
      map((response: GraphQLResponse<T>) => {
        // Requirement: Handle GraphQL errors, including errors returned with HTTP 200
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors.map(e => e.message).join('; ');
          throw new Error(`GraphQL Error: ${errorMessages}`);
        }

        if (!response.data) {
          throw new Error('GraphQL response contained no data');
        }

        return response.data;
      }),
      catchError((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown GraphQL network failure';
        return throwError(() => new Error(message));
      })
    );
  }
}
