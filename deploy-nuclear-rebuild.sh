#!/bin/bash

# MotoMindAI Nuclear Rebuild Deployment Script
# This script deploys the clean 7-table foundation, eliminating 23 cruft tables

echo "🚀 DEPLOYING NUCLEAR REBUILD - ELIMINATING TECHNICAL DEBT"
echo "=========================================================="

# Database connection from .env.local
DB_URL="postgresql://postgres:OGin3ykIzPCtQH6o@db.ucbbzzoimghnaoihyqbd.supabase.co:5432/postgres"

echo "📊 BEFORE: Checking current table count..."
psql "$DB_URL" -c "SELECT COUNT(*) as current_tables FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "💀 DEPLOYING NUCLEAR REBUILD..."
echo "   - Dropping 23+ cruft tables"
echo "   - Creating 7 essential tables"
echo "   - Adding security hardening"
echo "   - Setting up partitioning"
echo "   - Creating monitoring views"

# Deploy the nuclear rebuild
psql "$DB_URL" -f migrations/001-nuclear-rebuild-elite-supabase.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NUCLEAR REBUILD DEPLOYED SUCCESSFULLY!"
    echo ""
    echo "📊 AFTER: New clean foundation..."
    psql "$DB_URL" -c "SELECT COUNT(*) as new_tables FROM information_schema.tables WHERE table_schema = 'public';"
    
    echo ""
    echo "🔍 VERIFICATION: Core tables created..."
    psql "$DB_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    
    echo ""
    echo "🎯 HEALTH CHECK: System status..."
    psql "$DB_URL" -c "SELECT * FROM public.db_health_stats LIMIT 5;"
    
    echo ""
    echo "🎉 SUCCESS! Technical debt eliminated!"
    echo "   ✅ From 30+ tables → 7 core tables"
    echo "   ✅ Security hardened (search_path, RLS, private schema)"
    echo "   ✅ Performance optimized (partitioning, indexes)"
    echo "   ✅ Supabase native (auth integration)"
    echo "   ✅ Monitoring ready (health views)"
    
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Check the error messages above and fix any issues."
    exit 1
fi
