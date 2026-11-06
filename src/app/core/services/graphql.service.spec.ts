import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GraphQLService } from './graphql.service';
import {
  GraphQLError,
  GraphQLNetworkError,
  GraphQLHttpError
} from '../models/graphql.model';

describe('GraphQLService', () => {
  let service: GraphQLService;
  let httpMock: HttpTestingController;

  const testEndpoint = 'https://test-graphql-endpoint.org/graphql';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GraphQLService
      ]
    });

    service = TestBed.inject(GraphQLService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should successfully execute a GraphQL query and return parsed data', async () => {
    const mockData = { pokemon: { id: 1, name: 'bulbasaur' } };

    const promise = firstValueFrom(
      service.execute<{ pokemon: { id: number; name: string } }>(
        testEndpoint,
        'query { pokemon { id name } }'
      )
    );

    const req = httpMock.expectOne(testEndpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({ data: mockData });

    const data = await promise;
    expect(data).toEqual(mockData);
  });

  it('should throw GraphQLError when HTTP status is 200 but response contains errors array', async () => {
    const mockErrors = [
      { message: 'Cannot query field "unknownField" on type "Pokemon"' }
    ];

    const promise = firstValueFrom(service.execute(testEndpoint, 'query { unknownField }'));

    const req = httpMock.expectOne(testEndpoint);
    req.flush({ data: null, errors: mockErrors });

    try {
      await promise;
      expect.unreachable('Expected query to fail with GraphQLError');
    } catch (err: any) {
      expect(err instanceof GraphQLError).toBe(true);
      expect(err.message).toContain('Cannot query field');
      expect(err.errors.length).toBe(1);
      expect(err.statusCode).toBe(200);
    }
  });

  it('should throw GraphQLNetworkError when network transport fails (status 0)', async () => {
    const promise = firstValueFrom(service.execute(testEndpoint, 'query { pokemon }'));

    const req = httpMock.expectOne(testEndpoint);
    req.error(new ProgressEvent('Network failure'), { status: 0, statusText: 'Unknown Error' });

    try {
      await promise;
      expect.unreachable('Expected network error');
    } catch (err: any) {
      expect(err instanceof GraphQLNetworkError).toBe(true);
      expect(err.message).toContain('Failed to reach GraphQL endpoint');
    }
  });

  it('should throw GraphQLHttpError on 4xx/5xx HTTP responses', async () => {
    const promise = firstValueFrom(service.execute(testEndpoint, 'query { pokemon }'));

    const req = httpMock.expectOne(testEndpoint);
    req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

    try {
      await promise;
      expect.unreachable('Expected HTTP error');
    } catch (err: any) {
      expect(err instanceof GraphQLHttpError).toBe(true);
      expect(err.statusCode).toBe(502);
      expect(err.statusText).toBe('Bad Gateway');
    }
  });

  it('should retry specified number of times before failing', async () => {
    const promise = firstValueFrom(
      service.execute(testEndpoint, 'query { pokemon }', undefined, {
        retries: 2,
        retryDelayMs: 10
      })
    );

    // Initial attempt + 2 retries = 3 requests
    const req1 = httpMock.expectOne(testEndpoint);
    req1.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await new Promise(r => setTimeout(r, 15));
    const req2 = httpMock.expectOne(testEndpoint);
    req2.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await new Promise(r => setTimeout(r, 25));
    const req3 = httpMock.expectOne(testEndpoint);
    req3.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    try {
      await promise;
      expect.unreachable('Expected error after retries exhausted');
    } catch (err: any) {
      expect(err instanceof GraphQLHttpError).toBe(true);
    }
  });
});
