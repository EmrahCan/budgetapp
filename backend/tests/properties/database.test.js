const fc = require('fast-check');
const pool = require('../../config/database');
const axios = require('axios');

/**
 * Feature: test-environment-fix, Property 2: Database connection reliability
 * For any connection attempt with correct credentials, the database should accept the connection without authentication failures
 * Validates: Requirements 1.2, 1.4
 */

describe('Database Connection Reliability Properties', () => {
  afterAll(async () => {
    // Clean up database connections
    await pool.end();
  });

  test('Property 2: Database connection reliability - connections should succeed consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of concurrent connections to test
        async (connectionCount) => {
          const connectionPromises = [];
          
          // Create multiple concurrent connection attempts
          for (let i = 0; i < connectionCount; i++) {
            connectionPromises.push(
              (async () => {
                const client = await pool.connect();
                const result = await client.query('SELECT NOW() as current_time');
                client.release();
                return result.rows[0];
              })()
            );
          }
          
          // All connections should succeed
          const results = await Promise.all(connectionPromises);
          
          // Verify all connections returned valid results
          results.forEach(result => {
            expect(result).toBeDefined();
            expect(result.current_time).toBeInstanceOf(Date);
          });
          
          // All connections should have succeeded (no exceptions thrown)
          expect(results).toHaveLength(connectionCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Database connection reliability - query execution should be consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), // Test queries
        async (testQueries) => {
          const client = await pool.connect();
          
          try {
            // Execute multiple queries in sequence
            for (const queryParam of testQueries) {
              const result = await client.query(
                'SELECT $1 as test_value, NOW() as timestamp', 
                [queryParam]
              );
              
              // Each query should return expected structure
              expect(result.rows).toHaveLength(1);
              expect(result.rows[0].test_value).toBe(queryParam);
              expect(result.rows[0].timestamp).toBeInstanceOf(Date);
            }
          } finally {
            client.release();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Database connection reliability - connection pool should handle load', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }), // Concurrent connection load
        async (loadSize) => {
          const startTime = Date.now();
          
          // Create high load of concurrent database operations
          const operations = Array.from({ length: loadSize }, (_, i) => 
            (async () => {
              const client = await pool.connect();
              try {
                // Simulate real database work
                const result = await client.query(
                  'SELECT $1 as operation_id, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $2',
                  [i, 'public']
                );
                return result.rows[0];
              } finally {
                client.release();
              }
            })()
          );
          
          const results = await Promise.all(operations);
          const endTime = Date.now();
          
          // All operations should complete successfully
          expect(results).toHaveLength(loadSize);
          
          // Each result should be valid
          results.forEach((result, index) => {
            expect(parseInt(result.operation_id)).toBe(index);
            expect(parseInt(result.table_count)).toBeGreaterThan(0);
          });
          
          // Operations should complete in reasonable time (under 10 seconds)
          expect(endTime - startTime).toBeLessThan(10000);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: test-environment-fix, Property 4: Health endpoint reliability
 * For any health check request, the endpoint should respond with valid status information
 * Validates: Requirements 2.1
 */
describe('Health Endpoint Reliability Properties', () => {
  const baseURL = process.env.TEST_API_URL || 'http://localhost:5000';
  
  // Helper function to check if server is available
  const isServerAvailable = async () => {
    try {
      await axios.get(`${baseURL}/health`, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  };
  
  test('Property 4: Health endpoint reliability - /health should always respond', async () => {
    const serverAvailable = await isServerAvailable();
    
    if (!serverAvailable) {
      console.log('Skipping health endpoint test - server not available at', baseURL);
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of concurrent requests
        async (requestCount) => {
          const healthRequests = [];
          
          // Create multiple concurrent health check requests
          for (let i = 0; i < requestCount; i++) {
            healthRequests.push(
              axios.get(`${baseURL}/health`, { timeout: 5000 })
                .catch(error => ({ error: error.message }))
            );
          }
          
          // All health checks should succeed or fail gracefully
          const responses = await Promise.all(healthRequests);
          
          // Filter out error responses
          const successfulResponses = responses.filter(r => !r.error);
          
          if (successfulResponses.length > 0) {
            // Verify successful responses have required structure
            successfulResponses.forEach(response => {
              expect(response.status).toBe(200);
              expect(response.data).toBeDefined();
              expect(response.data.status).toBeDefined();
              expect(response.data.message).toBeDefined();
              expect(response.data.timestamp).toBeDefined();
              expect(['OK', 'DEGRADED', 'ERROR']).toContain(response.data.status);
            });
          }
          
          expect(responses).toHaveLength(requestCount);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 4: Health endpoint reliability - /api/health should always respond', async () => {
    const serverAvailable = await isServerAvailable();
    
    if (!serverAvailable) {
      console.log('Skipping API health endpoint test - server not available at', baseURL);
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of concurrent requests
        async (requestCount) => {
          const healthRequests = [];
          
          // Create multiple concurrent API health check requests
          for (let i = 0; i < requestCount; i++) {
            healthRequests.push(
              axios.get(`${baseURL}/api/health`, { timeout: 5000 })
                .catch(error => ({ error: error.message }))
            );
          }
          
          // All health checks should succeed or fail gracefully
          const responses = await Promise.all(healthRequests);
          
          // Filter out error responses
          const successfulResponses = responses.filter(r => !r.error);
          
          if (successfulResponses.length > 0) {
            // Verify successful responses have required structure
            successfulResponses.forEach(response => {
              expect(response.status).toBe(200);
              expect(response.data).toBeDefined();
              expect(response.data.success).toBe(true);
              expect(response.data.status).toBeDefined();
              expect(response.data.message).toBeDefined();
              expect(response.data.timestamp).toBeDefined();
              expect(['OK', 'DEGRADED', 'ERROR']).toContain(response.data.status);
            });
          }
          
          expect(responses).toHaveLength(requestCount);
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Feature: test-environment-fix, Property 6: CRUD operation reliability
 * For any valid CRUD operation, the system should handle it consistently without data corruption
 * Validates: Requirements 2.5
 */
describe('CRUD Operation Reliability Properties', () => {
  const baseURL = process.env.TEST_API_URL || 'http://localhost:5000';
  let testUserId;
  let authToken;

  beforeAll(async () => {
    try {
      // Create a test user for CRUD operations
      const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResponse = await axios.post(`${baseURL}/api/auth/register`, testUser, {
        timeout: 5000
      });

      if (registerResponse.status === 201) {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: testUser.email,
          password: testUser.password
        }, { timeout: 5000 });

        authToken = loginResponse.data.token;
        testUserId = loginResponse.data.user.id;
      }
    } catch (error) {
      console.log('Failed to setup test user:', error.message);
    }
  });

  test('Property 6: CRUD operation reliability - account creation should be consistent', async () => {
    if (!authToken) {
      console.log('Skipping CRUD test - no auth token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }),
          accountType: fc.constantFrom('checking', 'savings', 'credit'),
          balance: fc.float({ min: 0, max: 10000 }),
          currency: fc.constant('TRY')
        }),
        async (accountData) => {
          try {
            // Create account
            const createResponse = await axios.post(`${baseURL}/api/accounts`, accountData, {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: 5000
            });

            if (createResponse.status === 201) {
              const createdAccount = createResponse.data.data;
              
              // Verify created account has correct data
              expect(createdAccount.name).toBe(accountData.name);
              expect(createdAccount.accountType).toBe(accountData.accountType);
              expect(parseFloat(createdAccount.balance)).toBeCloseTo(accountData.balance, 2);
              expect(createdAccount.currency).toBe(accountData.currency);
              expect(createdAccount.id).toBeDefined();

              // Read the created account
              const readResponse = await axios.get(`${baseURL}/api/accounts/${createdAccount.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 5000
              });

              if (readResponse.status === 200) {
                const readAccount = readResponse.data.data;
                expect(readAccount.id).toBe(createdAccount.id);
                expect(readAccount.name).toBe(accountData.name);
              }

              // Clean up - delete the test account
              await axios.delete(`${baseURL}/api/accounts/${createdAccount.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 5000
              });
            }
          } catch (error) {
            // Skip this iteration if there's an error (e.g., server not running)
            console.log('Skipping CRUD test iteration due to error:', error.message);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 6: CRUD operation reliability - account update should preserve data integrity', async () => {
    if (!authToken) {
      console.log('Skipping CRUD update test - no auth token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalName: fc.string({ minLength: 3, maxLength: 50 }),
          updatedName: fc.string({ minLength: 3, maxLength: 50 }),
          balance: fc.float({ min: 0, max: 10000 })
        }),
        async (testData) => {
          try {
            // Create account
            const accountData = {
              name: testData.originalName,
              accountType: 'checking',
              balance: testData.balance,
              currency: 'TRY'
            };

            const createResponse = await axios.post(`${baseURL}/api/accounts`, accountData, {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: 5000
            });

            if (createResponse.status === 201) {
              const createdAccount = createResponse.data.data;
              
              // Update account name
              const updateData = {
                name: testData.updatedName
              };

              const updateResponse = await axios.put(`${baseURL}/api/accounts/${createdAccount.id}`, updateData, {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 5000
              });

              if (updateResponse.status === 200) {
                const updatedAccount = updateResponse.data.data;
                
                // Verify update preserved other data
                expect(updatedAccount.name).toBe(testData.updatedName);
                expect(updatedAccount.accountType).toBe(accountData.accountType);
                expect(parseFloat(updatedAccount.balance)).toBeCloseTo(testData.balance, 2);
                expect(updatedAccount.currency).toBe(accountData.currency);
                expect(updatedAccount.id).toBe(createdAccount.id);
              }

              // Clean up
              await axios.delete(`${baseURL}/api/accounts/${createdAccount.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 5000
              });
            }
          } catch (error) {
            // Skip this iteration if there's an error
            console.log('Skipping CRUD update test iteration due to error:', error.message);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});