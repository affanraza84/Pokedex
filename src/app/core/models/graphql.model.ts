/**
 * Application-wide GraphQL types and response structures.
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
