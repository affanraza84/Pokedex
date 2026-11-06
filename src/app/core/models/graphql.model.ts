/**
 * Application-wide GraphQL types, response structures, and custom error classes.
 */

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLErrorItem {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

export interface GraphQLRequestOptions {
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
}

/**
 * Thrown when GraphQL execution returns errors in the JSON payload (even with HTTP 200).
 */
export class GraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors: GraphQLErrorItem[],
    public readonly statusCode = 200
  ) {
    super(message);
    this.name = 'GraphQLError';
  }
}

/**
 * Thrown on low-level transport/network failure (e.g. offline, DNS failure, connection refused).
 */
export class GraphQLNetworkError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'GraphQLNetworkError';
  }
}

/**
 * Thrown when the GraphQL HTTP response status is not 2xx.
 */
export class GraphQLHttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly statusText: string
  ) {
    super(message);
    this.name = 'GraphQLHttpError';
  }
}
