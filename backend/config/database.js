const { Pool } = require('pg');
require('dotenv').config();

// Database configuration with Docker network support
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'budget_app',
  user: process.env.DB_USER || 'postgres',
  // Fix for production: ensure password is always a string, never empty
  password: process.env.DB_PASSWORD || 'postgres',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
  acquireTimeoutMillis: 60000, // Return error after 60 seconds if a client could not be checked out
  // SSL configuration: explicitly disable for Docker internal network
  // PostgreSQL driver requires this to be undefined or an object, not false
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

console.log(`🔗 Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Database connection retry logic with exponential backoff
const createPoolWithRetry = async (maxRetries = 5, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      const pool = new Pool(dbConfig);
      
      // Test the connection
      const client = await pool.connect();
      console.log('✅ Database connection successful');
      client.release();
      
      return pool;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries >= maxRetries) {
        console.error('💥 Max database connection retries reached. Exiting...');
        throw error;
      }
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff: double the delay for next retry
      delay *= 2;
    }
  }
};

// Create pool with retry logic (will be initialized on first use)
let pool;
const initializePool = async () => {
  if (!pool) {
    pool = await createPoolWithRetry();
  }
  return pool;
};

// Initialize pool immediately
pool = new Pool(dbConfig);

// Connection event handlers
pool.on('connect', (client) => {
  console.log(`✅ New database connection established (PID: ${client.processID})`);
});

pool.on('acquire', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Client acquired from pool (PID: ${client.processID})`);
  }
});

pool.on('remove', (client) => {
  console.log(`🔌 Client removed from pool (PID: ${client.processID})`);
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  console.error('Client details:', client ? `PID: ${client.processID}` : 'No client info');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

// Health check function
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Export pool and health check
module.exports = pool;
module.exports.healthCheck = healthCheck;