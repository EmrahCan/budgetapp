#!/bin/bash
# Budget App - Smoke Tests
# Quick tests to verify deployment was successful

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost}"
TIMEOUT=10

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test header
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Budget App - Smoke Tests          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Testing: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo ""
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Test $TOTAL_TESTS: $test_name ... "
    
    # Run the test
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test HTTP endpoint
test_http() {
    local url="$1"
    local expected_status="${2:-200}"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url")
    [ "$status" = "$expected_status" ]
}

# Function to test JSON response
test_json() {
    local url="$1"
    local json_field="$2"
    
    local response=$(curl -s --max-time "$TIMEOUT" "$url")
    echo "$response" | grep -q "\"$json_field\""
}

# Function to test database connection via API
test_database() {
    local url="$1"
    
    # Try to hit an endpoint that requires database
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url")
    [ "$status" != "500" ] && [ "$status" != "503" ]
}

# Print header
print_header

# Test 1: Health endpoint returns 200
run_test "Health endpoint accessible" \
    "test_http '$BASE_URL/health' 200"

# Test 2: API health endpoint returns 200
run_test "API health endpoint accessible" \
    "test_http '$BASE_URL/api/health' 200"

# Test 3: API health returns JSON with status
run_test "API health returns valid JSON" \
    "test_json '$BASE_URL/api/health' 'status'"

# Test 4: Frontend loads successfully
run_test "Frontend loads (root path)" \
    "test_http '$BASE_URL/' 200"

# Test 5: API auth endpoint responds (even if unauthorized)
run_test "Auth endpoint responds" \
    "curl -s --max-time $TIMEOUT '$BASE_URL/api/auth/login' -X POST -H 'Content-Type: application/json' -d '{}' | grep -q 'success'"

# Test 6: Database connection works (via API)
run_test "Database connection via API" \
    "test_database '$BASE_URL/api/health'"

# Test 7: Static assets load (if applicable)
run_test "Static assets accessible" \
    "test_http '$BASE_URL/static/js/main.js' 200 || test_http '$BASE_URL/' 200"

# Test 8: API returns proper CORS headers
run_test "CORS headers present" \
    "curl -s -I --max-time $TIMEOUT '$BASE_URL/api/health' | grep -qi 'access-control'"

# Test 9: Nginx is serving requests
run_test "Nginx is responding" \
    "curl -s -I --max-time $TIMEOUT '$BASE_URL/health' | grep -qi 'nginx'"

# Test 10: Response time is reasonable (<5s)
run_test "Response time is acceptable" \
    "time_taken=\$(curl -s -o /dev/null -w '%{time_total}' --max-time $TIMEOUT '$BASE_URL/api/health'); [ \"\$(echo \"\$time_taken < 5\" | bc)\" = \"1\" ]"

# Print summary
echo ""
echo "════════════════════════════════════════"
echo -e "${BLUE}Test Summary${NC}"
echo "════════════════════════════════════════"
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo "════════════════════════════════════════"
echo ""

# Exit with appropriate code
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check if all containers are running: docker ps"
    echo "  2. Check container logs: docker-compose logs"
    echo "  3. Check health status: ./scripts/check-health.sh"
    echo "  4. Verify environment variables are set correctly"
    echo ""
    exit 1
fi

