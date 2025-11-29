#!/bin/bash
# Budget App - Log Viewer
# Easy access to view different application logs

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="$HOME/budgetapp"

# Function to display menu
show_menu() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Budget App - Log Viewer           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Select log to view:"
    echo ""
    echo "  1) Backend - Combined logs"
    echo "  2) Backend - Error logs only"
    echo "  3) Backend - Performance logs"
    echo "  4) Nginx - Access logs"
    echo "  5) Nginx - Error logs"
    echo "  6) Monitoring logs"
    echo "  7) Health check logs"
    echo "  8) Cron job logs"
    echo "  9) Docker container logs (all)"
    echo " 10) Docker container logs (backend)"
    echo " 11) Docker container logs (frontend)"
    echo " 12) Docker container logs (nginx)"
    echo " 13) Docker container logs (database)"
    echo ""
    echo "  0) Exit"
    echo ""
}

# Function to view log
view_log() {
    local log_file="$1"
    local log_name="$2"
    
    if [ -f "$log_file" ]; then
        echo -e "${BLUE}Viewing: $log_name${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        tail -f "$log_file"
    else
        echo -e "${RED}Log file not found: $log_file${NC}"
        echo "Press Enter to continue..."
        read
    fi
}

# Function to view docker logs
view_docker_logs() {
    local container="$1"
    local name="$2"
    
    echo -e "${BLUE}Viewing: $name${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    docker logs -f --tail=100 "$container"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [0-13]: " choice
    
    case $choice in
        1)
            view_log "$APP_DIR/backend/logs/combined.log" "Backend Combined Logs"
            ;;
        2)
            view_log "$APP_DIR/backend/logs/error.log" "Backend Error Logs"
            ;;
        3)
            view_log "$APP_DIR/backend/logs/performance.log" "Backend Performance Logs"
            ;;
        4)
            view_log "$APP_DIR/nginx/logs/access.log" "Nginx Access Logs"
            ;;
        5)
            view_log "$APP_DIR/nginx/logs/error.log" "Nginx Error Logs"
            ;;
        6)
            view_log "$APP_DIR/logs/monitoring.log" "Monitoring Logs"
            ;;
        7)
            view_log "$APP_DIR/logs/health-check.log" "Health Check Logs"
            ;;
        8)
            view_log "$APP_DIR/logs/cron.log" "Cron Job Logs"
            ;;
        9)
            view_docker_logs "budget_backend budget_frontend budget_nginx budget_database" "All Containers"
            ;;
        10)
            view_docker_logs "budget_backend" "Backend Container"
            ;;
        11)
            view_docker_logs "budget_frontend" "Frontend Container"
            ;;
        12)
            view_docker_logs "budget_nginx" "Nginx Container"
            ;;
        13)
            view_docker_logs "budget_database" "Database Container"
            ;;
        0)
            echo ""
            echo -e "${GREEN}Goodbye!${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 2
            ;;
    esac
done

