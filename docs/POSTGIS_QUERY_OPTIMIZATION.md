# PostGIS Query Optimization Guide
## Antalya Real Estate Platform

**Version:** 1.0.0  
**Database:** PostgreSQL 14+ with PostGIS 3.0+  
**Dataset Scale:** ~50,000 listings  
**Last Updated:** 2026-02-18

---

## 1. Database Schema Design

### 1.1 Core Listing Table

```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES consultants(id),
    
    -- Basic Information
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Pricing
    price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount > 0),
    price_currency VARCHAR(3) NOT NULL DEFAULT 'TRY' CHECK (price_currency IN ('TRY', 'USD', 'EUR')),
    price_is_negotiable BOOLEAN DEFAULT FALSE,
    category VARCHAR(10) NOT NULL CHECK (category IN ('RENT', 'SALE')),
    
    -- Property Specifications
    property_type VARCHAR(20) NOT NULL CHECK (property_type IN (
        'APARTMENT', 'VILLA', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER'
    )),
    square_meters NUMERIC(8, 2) NOT NULL CHECK (square_meters > 0),
    room_count INTEGER CHECK (room_count >= 0),
    bathroom_count INTEGER CHECK (bathroom_count >= 0),
    floor_number INTEGER,
    total_floors INTEGER,
    build_year INTEGER CHECK (build_year >= 1800 AND build_year <= EXTRACT(YEAR FROM NOW()) + 1),
    
    -- Features (Boolean flags)
    furnished BOOLEAN,
    balcony BOOLEAN,
    parking BOOLEAN,
    elevator BOOLEAN,
    pool BOOLEAN,
    sea_view BOOLEAN,
    
    -- Location (Text Fields)
    city VARCHAR(50) NOT NULL DEFAULT 'Antalya',
    district VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    address TEXT,
    postal_code VARCHAR(10),
    
    -- Geospatial (PostGIS)
    location_geom GEOMETRY(POINT, 4326) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'PUBLISHED', 'ARCHIVED'
    )),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 1
);

-- Add spatial index (critical for performance)
CREATE INDEX idx_listings_location_geom ON listings USING GIST (location_geom);

-- Add B-tree indexes for common filters
CREATE INDEX idx_listings_status ON listings (status) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_category ON listings (category) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_property_type ON listings (property_type) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_price_amount ON listings (price_amount) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_district ON listings (district) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_neighborhood ON listings (neighborhood) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_room_count ON listings (room_count) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_square_meters ON listings (square_meters) WHERE status = 'PUBLISHED';

-- Composite indexes for common query patterns
CREATE INDEX idx_listings_category_price ON listings (category, price_amount) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_district_neighborhood ON listings (district, neighborhood) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_property_type_price ON listings (property_type, price_amount) WHERE status = 'PUBLISHED';

-- Partial index for active listings (most queries filter by status)
CREATE INDEX idx_listings_published_location ON listings USING GIST (location_geom) WHERE status = 'PUBLISHED';

-- Index for text search (if full-text search is needed)
CREATE INDEX idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops) WHERE status = 'PUBLISHED';
CREATE INDEX idx_listings_description_trgm ON listings USING GIN (description gin_trgm_ops) WHERE status = 'PUBLISHED';
```

### 1.2 Spatial Reference System

**SRID 4326 (WGS84)** is used for all geometries:
- Standard GPS coordinates (latitude/longitude)
- Compatible with web mapping libraries (Leaflet, Mapbox, Google Maps)
- Sufficient precision for real estate use cases

**Note:** For distance calculations, consider transforming to a local projected coordinate system (e.g., SRID 3857 or Turkey-specific) for better accuracy, but 4326 is acceptable for Antalya region.

---

## 2. Bounding Box Search

### 2.1 Basic Bounding Box Query

```sql
-- Input parameters:
-- @min_lat, @max_lat, @min_lon, @max_lon (bounding box coordinates)
-- Antalya approximate bounds: lat 36.0-37.0, lon 30.0-32.0

SELECT 
    id,
    title,
    price_amount,
    price_currency,
    category,
    property_type,
    square_meters,
    room_count,
    district,
    neighborhood,
    ST_X(location_geom) AS longitude,
    ST_Y(location_geom) AS latitude
FROM listings
WHERE status = 'PUBLISHED'
  AND location_geom && ST_MakeEnvelope(
      @min_lon,  -- xmin (longitude)
      @min_lat,  -- ymin (latitude)
      @max_lon,  -- xmax (longitude)
      @max_lat,  -- ymax (latitude)
      4326       -- SRID
  )
ORDER BY created_at DESC
LIMIT 100;
```

### 2.2 Optimized Bounding Box with Filters

```sql
-- Optimized version with additional filters
-- Uses index on status first, then spatial index

SELECT 
    l.id,
    l.title,
    l.price_amount,
    l.price_currency,
    l.category,
    l.property_type,
    l.square_meters,
    l.room_count,
    l.district,
    l.neighborhood,
    ST_X(l.location_geom) AS longitude,
    ST_Y(l.location_geom) AS latitude,
    ST_Distance(
        l.location_geom,
        ST_MakePoint((@min_lon + @max_lon) / 2, (@min_lat + @max_lat) / 2, 4326)
    ) AS distance_meters
FROM listings l
WHERE l.status = 'PUBLISHED'
  AND l.location_geom && ST_MakeEnvelope(@min_lon, @min_lat, @max_lon, @max_lat, 4326)
  AND (@category IS NULL OR l.category = @category)
  AND (@property_type IS NULL OR l.property_type = @property_type)
  AND (@min_price IS NULL OR l.price_amount >= @min_price)
  AND (@max_price IS NULL OR l.price_amount <= @max_price)
  AND (@min_rooms IS NULL OR l.room_count >= @min_rooms)
  AND (@max_rooms IS NULL OR l.room_count <= @max_rooms)
ORDER BY l.created_at DESC
LIMIT @limit OFFSET @offset;
```

### 2.3 Query Plan Analysis

**Expected Query Plan:**
```
Limit (cost=... rows=100)
  -> Sort (cost=... rows=...)
      -> Index Scan using idx_listings_published_location on listings l
          Index Cond: (location_geom && '...'::geometry)
          Filter: (status = 'PUBLISHED'::listing_status)
```

**Key Optimizations:**
1. **Spatial Index First**: `&&` operator uses GIST index efficiently
2. **Status Filter**: Partial index `idx_listings_published_location` already filters by status
3. **Bounding Box Operator**: `&&` is faster than `ST_Within` or `ST_Contains` for initial filtering
4. **Additional Filters**: Applied after spatial filter to reduce dataset size

**Performance Characteristics:**
- **Index Scan**: Uses GIST index for spatial filtering
- **Selectivity**: Bounding box typically returns 100-5000 listings (depending on zoom level)
- **Filter Application**: Additional filters applied to already-reduced dataset
- **Expected Execution Time**: < 50ms for typical bounding box queries

---

## 3. Radius Search

### 3.1 Basic Radius Search

```sql
-- Input parameters:
-- @center_lat, @center_lon (center point)
-- @radius_meters (search radius in meters)

SELECT 
    id,
    title,
    price_amount,
    price_currency,
    category,
    property_type,
    square_meters,
    room_count,
    district,
    neighborhood,
    ST_X(location_geom) AS longitude,
    ST_Y(location_geom) AS latitude,
    ST_Distance(
        location_geom::geography,
        ST_MakePoint(@center_lon, @center_lat, 4326)::geography
    ) AS distance_meters
FROM listings
WHERE status = 'PUBLISHED'
  AND ST_DWithin(
      location_geom::geography,
      ST_MakePoint(@center_lon, @center_lat, 4326)::geography,
      @radius_meters
  )
ORDER BY distance_meters ASC
LIMIT 100;
```

### 3.2 Optimized Radius Search with Bounding Box Pre-filter

```sql
-- More efficient: Use bounding box first, then calculate exact distance
-- This reduces the number of distance calculations

WITH bounding_box AS (
    -- Calculate approximate bounding box for radius
    -- Uses Haversine formula approximation (good enough for pre-filtering)
    SELECT ST_MakeEnvelope(
        @center_lon - (@radius_meters / 111320.0 * COS(RADIANS(@center_lat))),
        @center_lat - (@radius_meters / 111320.0),
        @center_lon + (@radius_meters / 111320.0 * COS(RADIANS(@center_lat))),
        @center_lat + (@radius_meters / 111320.0),
        4326
    ) AS bbox
)
SELECT 
    l.id,
    l.title,
    l.price_amount,
    l.price_currency,
    l.category,
    l.property_type,
    l.square_meters,
    l.room_count,
    l.district,
    l.neighborhood,
    ST_X(l.location_geom) AS longitude,
    ST_Y(l.location_geom) AS latitude,
    ST_Distance(
        l.location_geom::geography,
        ST_MakePoint(@center_lon, @center_lat, 4326)::geography
    ) AS distance_meters
FROM listings l, bounding_box bb
WHERE l.status = 'PUBLISHED'
  AND l.location_geom && bb.bbox  -- Fast bounding box filter first
  AND ST_DWithin(  -- Then exact distance check
      l.location_geom::geography,
      ST_MakePoint(@center_lon, @center_lat, 4326)::geography,
      @radius_meters
  )
  AND (@category IS NULL OR l.category = @category)
  AND (@property_type IS NULL OR l.property_type = @property_type)
  AND (@min_price IS NULL OR l.price_amount >= @min_price)
  AND (@max_price IS NULL OR l.price_amount <= @max_price)
ORDER BY distance_meters ASC
LIMIT @limit OFFSET @offset;
```

### 3.3 Query Plan Analysis

**Expected Query Plan:**
```
Limit (cost=... rows=100)
  -> Sort (cost=... rows=...)
      Sort Key: (st_distance(...))
      -> Nested Loop (cost=... rows=...)
          -> CTE Scan on bounding_box bb
          -> Index Scan using idx_listings_published_location on listings l
              Index Cond: (location_geom && bb.bbox)
              Filter: (status = 'PUBLISHED'::listing_status AND st_dwithin(...))
```

**Key Optimizations:**
1. **Bounding Box Pre-filter**: Reduces candidates before expensive distance calculations
2. **Geography Cast**: `::geography` provides accurate meter-based distances
3. **ST_DWithin**: More efficient than `ST_Distance(...) < radius` (uses index)
4. **Two-Stage Filter**: Spatial index → bounding box → exact distance

**Performance Characteristics:**
- **Initial Filter**: Bounding box reduces dataset by ~90% (depending on radius)
- **Distance Calculation**: Only performed on pre-filtered results
- **Expected Execution Time**: 
  - Small radius (1km): < 30ms
  - Medium radius (5km): < 50ms
  - Large radius (20km): < 100ms

---

## 4. Neighborhood Filtering

### 4.1 Exact Neighborhood Match

```sql
-- Input parameters:
-- @district (optional)
-- @neighborhood (required for exact match)

SELECT 
    id,
    title,
    price_amount,
    price_currency,
    category,
    property_type,
    square_meters,
    room_count,
    district,
    neighborhood,
    ST_X(location_geom) AS longitude,
    ST_Y(location_geom) AS latitude
FROM listings
WHERE status = 'PUBLISHED'
  AND (@district IS NULL OR district = @district)
  AND neighborhood = @neighborhood
ORDER BY created_at DESC
LIMIT 100;
```

### 4.2 Neighborhood with Fuzzy Matching

```sql
-- For Turkish character normalization and fuzzy matching
-- Requires pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT 
    id,
    title,
    price_amount,
    price_currency,
    category,
    property_type,
    square_meters,
    room_count,
    district,
    neighborhood,
    ST_X(location_geom) AS longitude,
    ST_Y(location_geom) AS latitude,
    similarity(neighborhood, @neighborhood) AS match_score
FROM listings
WHERE status = 'PUBLISHED'
  AND (@district IS NULL OR district = @district)
  AND (
      neighborhood ILIKE '%' || @neighborhood || '%'
      OR similarity(neighborhood, @neighborhood) > 0.3
  )
ORDER BY match_score DESC, created_at DESC
LIMIT 100;
```

### 4.3 Query Plan Analysis

**Expected Query Plan (Exact Match):**
```
Limit (cost=... rows=100)
  -> Sort (cost=... rows=...)
      -> Index Scan using idx_listings_neighborhood on listings
          Index Cond: (neighborhood = @neighborhood)
          Filter: (status = 'PUBLISHED'::listing_status)
```

**Expected Query Plan (Fuzzy Match):**
```
Limit (cost=... rows=100)
  -> Sort (cost=... rows=...)
      Sort Key: (similarity(...)) DESC, created_at DESC
      -> Seq Scan on listings
          Filter: (status = 'PUBLISHED'::listing_status AND ...)
```

**Performance Characteristics:**
- **Exact Match**: Very fast (< 10ms) due to B-tree index
- **Fuzzy Match**: Slower (50-200ms) due to sequential scan and similarity calculation
- **Recommendation**: Use exact match when possible, cache neighborhood list for autocomplete

---

## 5. Combined Filtering (Price + Location)

### 5.1 Bounding Box + Price Range

```sql
-- Most common query pattern: map view with price filter

SELECT 
    l.id,
    l.title,
    l.price_amount,
    l.price_currency,
    l.category,
    l.property_type,
    l.square_meters,
    l.room_count,
    l.district,
    l.neighborhood,
    ST_X(l.location_geom) AS longitude,
    ST_Y(l.location_geom) AS latitude
FROM listings l
WHERE l.status = 'PUBLISHED'
  AND l.location_geom && ST_MakeEnvelope(@min_lon, @min_lat, @max_lon, @max_lat, 4326)
  AND l.category = @category
  AND l.price_amount BETWEEN @min_price AND @max_price
ORDER BY 
    CASE WHEN @sort_by = 'price_asc' THEN l.price_amount END ASC,
    CASE WHEN @sort_by = 'price_desc' THEN l.price_amount END DESC,
    CASE WHEN @sort_by = 'newest' THEN l.created_at END DESC,
    CASE WHEN @sort_by = 'default' THEN l.created_at END DESC
LIMIT @limit OFFSET @offset;
```

### 5.2 Radius + Price + Property Type

```sql
-- Radius search with multiple filters

WITH bounding_box AS (
    SELECT ST_MakeEnvelope(
        @center_lon - (@radius_meters / 111320.0 * COS(RADIANS(@center_lat))),
        @center_lat - (@radius_meters / 111320.0),
        @center_lon + (@radius_meters / 111320.0 * COS(RADIANS(@center_lat))),
        @center_lat + (@radius_meters / 111320.0),
        4326
    ) AS bbox
)
SELECT 
    l.id,
    l.title,
    l.price_amount,
    l.price_currency,
    l.category,
    l.property_type,
    l.square_meters,
    l.room_count,
    l.district,
    l.neighborhood,
    ST_X(l.location_geom) AS longitude,
    ST_Y(l.location_geom) AS latitude,
    ST_Distance(
        l.location_geom::geography,
        ST_MakePoint(@center_lon, @center_lat, 4326)::geography
    ) AS distance_meters
FROM listings l, bounding_box bb
WHERE l.status = 'PUBLISHED'
  AND l.location_geom && bb.bbox
  AND ST_DWithin(
      l.location_geom::geography,
      ST_MakePoint(@center_lon, @center_lat, 4326)::geography,
      @radius_meters
  )
  AND l.category = @category
  AND (@property_type IS NULL OR l.property_type = @property_type)
  AND l.price_amount BETWEEN @min_price AND @max_price
  AND (@min_rooms IS NULL OR l.room_count >= @min_rooms)
  AND (@max_rooms IS NULL OR l.room_count <= @max_rooms)
ORDER BY distance_meters ASC
LIMIT @limit OFFSET @offset;
```

### 5.3 Neighborhood + Price + Features

```sql
-- Neighborhood search with price and feature filters

SELECT 
    l.id,
    l.title,
    l.price_amount,
    l.price_currency,
    l.category,
    l.property_type,
    l.square_meters,
    l.room_count,
    l.district,
    l.neighborhood,
    ST_X(l.location_geom) AS longitude,
    ST_Y(l.location_geom) AS latitude
FROM listings l
WHERE l.status = 'PUBLISHED'
  AND l.district = @district
  AND l.neighborhood = @neighborhood
  AND l.category = @category
  AND l.price_amount BETWEEN @min_price AND @max_price
  AND (@furnished IS NULL OR l.furnished = @furnished)
  AND (@parking IS NULL OR l.parking = @parking)
  AND (@elevator IS NULL OR l.elevator = @elevator)
  AND (@pool IS NULL OR l.pool = @pool)
  AND (@sea_view IS NULL OR l.sea_view = @sea_view)
ORDER BY l.price_amount ASC
LIMIT @limit OFFSET @offset;
```

### 5.4 Query Plan Analysis

**Expected Query Plan (Bounding Box + Price):**
```
Limit (cost=... rows=100)
  -> Sort (cost=... rows=...)
      -> Index Scan using idx_listings_published_location on listings l
          Index Cond: (location_geom && '...'::geometry)
          Filter: (
              status = 'PUBLISHED'::listing_status 
              AND category = '...'::listing_category
              AND price_amount >= ... AND price_amount <= ...
          )
```

**Key Optimizations:**
1. **Spatial Index First**: Most selective filter applied first
2. **Composite Index Usage**: `idx_listings_category_price` may be used for price filtering
3. **Filter Order**: Apply most selective filters first
4. **Index Combination**: PostgreSQL can combine multiple indexes using bitmap scans

**Performance Characteristics:**
- **Spatial Filter**: Reduces dataset significantly (100-5000 rows)
- **Price Filter**: Further reduces to 10-500 rows (depending on price range)
- **Expected Execution Time**: < 100ms for typical combined queries

---

## 6. Index Strategy for 50k Listings

### 6.1 Index Priority Matrix

| Index Type | Priority | Use Case | Expected Impact |
|------------|----------|----------|----------------|
| `idx_listings_published_location` (GIST) | **CRITICAL** | All spatial queries | 10-100x speedup |
| `idx_listings_status` (Partial) | **CRITICAL** | Status filtering | 5-10x speedup |
| `idx_listings_category_price` (Composite) | **HIGH** | Price filtering | 2-5x speedup |
| `idx_listings_district_neighborhood` (Composite) | **HIGH** | Neighborhood queries | 3-5x speedup |
| `idx_listings_property_type_price` (Composite) | **MEDIUM** | Property type + price | 2-3x speedup |
| `idx_listings_price_amount` (B-tree) | **MEDIUM** | Price-only queries | 2-3x speedup |
| `idx_listings_neighborhood` (B-tree) | **MEDIUM** | Neighborhood-only | 2-3x speedup |
| `idx_listings_room_count` (B-tree) | **LOW** | Room filtering | 1.5-2x speedup |

### 6.2 Index Maintenance

```sql
-- Analyze tables regularly to update statistics
ANALYZE listings;

-- Update statistics after bulk inserts/updates
ANALYZE listings;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'listings'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'listings'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Reindex if needed (during maintenance window)
REINDEX INDEX CONCURRENTLY idx_listings_published_location;
```

### 6.3 Index Bloat Monitoring

```sql
-- Check for index bloat
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'listings'
  AND idx_scan = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 7. Query Performance Optimization

### 7.1 Connection Pooling

**Recommended Settings:**
- **Connection Pool Size**: 20-50 connections
- **Statement Timeout**: 5 seconds for search queries
- **Idle Timeout**: 10 minutes

### 7.2 Query Timeout Configuration

```sql
-- Set statement timeout for search queries
SET statement_timeout = '5s';

-- Or per-connection in application
-- PostgreSQL connection string: ?statement_timeout=5000
```

### 7.3 Prepared Statements

```sql
-- Use prepared statements for frequently executed queries
PREPARE search_bbox AS
SELECT id, title, price_amount, category, property_type,
       ST_X(location_geom) AS longitude, ST_Y(location_geom) AS latitude
FROM listings
WHERE status = 'PUBLISHED'
  AND location_geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
  AND category = $5
  AND price_amount BETWEEN $6 AND $7
LIMIT $8;

-- Execute with parameters
EXECUTE search_bbox(30.0, 36.0, 32.0, 37.0, 'SALE', 100000, 5000000, 100);
```

### 7.4 Materialized Views for Aggregations

```sql
-- Create materialized view for neighborhood statistics
CREATE MATERIALIZED VIEW neighborhood_stats AS
SELECT 
    district,
    neighborhood,
    category,
    COUNT(*) AS listing_count,
    AVG(price_amount) AS avg_price,
    MIN(price_amount) AS min_price,
    MAX(price_amount) AS max_price,
    ST_Collect(location_geom) AS bounds
FROM listings
WHERE status = 'PUBLISHED'
GROUP BY district, neighborhood, category;

-- Create index on materialized view
CREATE INDEX idx_neighborhood_stats_district ON neighborhood_stats (district, neighborhood);

-- Refresh periodically (e.g., every hour via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY neighborhood_stats;
```

---

## 8. Query Plan Analysis Examples

### 8.1 Example 1: Bounding Box Query

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, title, price_amount
FROM listings
WHERE status = 'PUBLISHED'
  AND location_geom && ST_MakeEnvelope(30.5, 36.5, 31.0, 37.0, 4326)
  AND category = 'SALE'
  AND price_amount BETWEEN 500000 AND 2000000
LIMIT 50;
```

**Expected Plan:**
```
Limit (cost=... rows=50) (actual time=15.234..18.456 rows=42 loops=1)
  -> Sort (cost=... rows=...) (actual time=15.123..17.890 rows=142 loops=1)
      Sort Key: created_at DESC
      Sort Method: quicksort Memory: 25kB
      -> Index Scan using idx_listings_published_location on listings
          Index Cond: (location_geom && '...'::geometry)
          Filter: (
              (status = 'PUBLISHED'::listing_status) 
              AND (category = 'SALE'::listing_category)
              AND (price_amount >= 500000::numeric)
              AND (price_amount <= 2000000::numeric)
          )
          Rows Removed by Filter: 23
Planning Time: 0.456 ms
Execution Time: 18.789 ms
```

**Analysis:**
- ✅ Uses spatial index efficiently
- ✅ Filters applied after spatial filter (good)
- ✅ Low execution time (< 20ms)
- ✅ Small number of rows examined (165 total, 42 returned)

### 8.2 Example 2: Radius Query

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, title, price_amount,
       ST_Distance(location_geom::geography, 
                   ST_MakePoint(30.7, 36.8, 4326)::geography) AS distance
FROM listings
WHERE status = 'PUBLISHED'
  AND ST_DWithin(
      location_geom::geography,
      ST_MakePoint(30.7, 36.8, 4326)::geography,
      5000
  )
ORDER BY distance
LIMIT 20;
```

**Expected Plan:**
```
Limit (cost=... rows=20) (actual time=25.123..28.456 rows=20 loops=1)
  -> Sort (cost=... rows=...) (actual time=25.012..27.890 rows=45 loops=1)
      Sort Key: (st_distance(...))
      Sort Method: top-N heapsort Memory: 26kB
      -> Index Scan using idx_listings_published_location on listings
          Index Cond: (location_geom && '...'::geometry)
          Filter: (
              (status = 'PUBLISHED'::listing_status)
              AND st_dwithin(...)
          )
          Rows Removed by Filter: 8
Planning Time: 0.567 ms
Execution Time: 28.901 ms
```

**Analysis:**
- ✅ Uses bounding box pre-filter (implicit in ST_DWithin)
- ✅ Distance calculation only on filtered rows
- ✅ Acceptable execution time (< 30ms)
- ⚠️ Consider adding explicit bounding box CTE for larger radii

### 8.3 Example 3: Neighborhood Query

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, title, price_amount
FROM listings
WHERE status = 'PUBLISHED'
  AND district = 'Muratpaşa'
  AND neighborhood = 'Lara'
  AND category = 'SALE'
ORDER BY price_amount ASC
LIMIT 50;
```

**Expected Plan:**
```
Limit (cost=... rows=50) (actual time=2.123..3.456 rows=38 loops=1)
  -> Sort (cost=... rows=...) (actual time=2.012..3.234 rows=38 loops=1)
      Sort Key: price_amount
      Sort Method: quicksort Memory: 12kB
      -> Index Scan using idx_listings_district_neighborhood on listings
          Index Cond: (
              (district = 'Muratpaşa'::text)
              AND (neighborhood = 'Lara'::text)
          )
          Filter: (
              (status = 'PUBLISHED'::listing_status)
              AND (category = 'SALE'::listing_category)
          )
Planning Time: 0.234 ms
Execution Time: 3.567 ms
```

**Analysis:**
- ✅ Excellent performance (< 5ms)
- ✅ Uses composite index efficiently
- ✅ Very selective (only 38 rows match)

---

## 9. Common Performance Issues and Solutions

### 9.1 Issue: Slow Spatial Queries

**Symptoms:**
- Sequential scan instead of index scan
- High execution time (> 100ms)

**Solutions:**
1. Ensure spatial index exists: `CREATE INDEX ... USING GIST (location_geom)`
2. Update statistics: `ANALYZE listings`
3. Check index usage: `EXPLAIN ANALYZE` to verify index is used
4. Consider partial index: `WHERE status = 'PUBLISHED'`

### 9.2 Issue: High Memory Usage

**Symptoms:**
- Sort operations using disk instead of memory
- `work_mem` exceeded

**Solutions:**
```sql
-- Increase work_mem for current session
SET work_mem = '64MB';

-- Or in postgresql.conf
work_mem = 64MB
```

### 9.3 Issue: Index Not Used

**Symptoms:**
- Sequential scan in query plan
- Index exists but not utilized

**Solutions:**
1. Check index condition matches query filter
2. Update table statistics: `ANALYZE listings`
3. Verify index is not corrupted: `REINDEX INDEX ...`
4. Check for data type mismatches

### 9.4 Issue: Slow Combined Filters

**Symptoms:**
- Multiple filters slow down query
- Bitmap scan with high cost

**Solutions:**
1. Create composite indexes for common filter combinations
2. Apply most selective filter first
3. Use partial indexes for frequently filtered columns
4. Consider materialized views for complex aggregations

---

## 10. Monitoring and Maintenance

### 10.1 Query Performance Monitoring

```sql
-- Enable query logging for slow queries
-- In postgresql.conf:
log_min_duration_statement = 1000  -- Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%listings%'
ORDER BY mean_time DESC
LIMIT 10;
```

### 10.2 Index Usage Monitoring

```sql
-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'listings'
ORDER BY idx_scan DESC;
```

### 10.3 Table Statistics

```sql
-- Check table and index statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'listings';

-- Update statistics manually
ANALYZE listings;
```

---

## 11. Antalya-Specific Optimizations

### 11.1 Antalya Bounding Box Constraint

```sql
-- Add check constraint to ensure coordinates are within Antalya
ALTER TABLE listings
ADD CONSTRAINT chk_antalya_bounds
CHECK (
    ST_X(location_geom) BETWEEN 30.0 AND 32.0  -- Longitude
    AND ST_Y(location_geom) BETWEEN 36.0 AND 37.0  -- Latitude
);

-- This allows PostgreSQL to optimize queries knowing all points are in this range
```

### 11.2 District and Neighborhood Lookup Table

```sql
-- Create lookup table for faster neighborhood queries
CREATE TABLE neighborhoods (
    id SERIAL PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    center_point GEOMETRY(POINT, 4326),
    bounds GEOMETRY(POLYGON, 4326),
    listing_count INTEGER DEFAULT 0,
    UNIQUE(district, neighborhood)
);

CREATE INDEX idx_neighborhoods_district ON neighborhoods (district);
CREATE INDEX idx_neighborhoods_bounds ON neighborhoods USING GIST (bounds);

-- Populate from listings
INSERT INTO neighborhoods (district, neighborhood, center_point, listing_count)
SELECT 
    district,
    neighborhood,
    ST_Centroid(ST_Collect(location_geom)) AS center_point,
    COUNT(*) AS listing_count
FROM listings
WHERE status = 'PUBLISHED'
GROUP BY district, neighborhood
ON CONFLICT (district, neighborhood) DO UPDATE
SET listing_count = EXCLUDED.listing_count;
```

---

## 12. Recommended Query Patterns

### 12.1 Pattern: Map View Search

```sql
-- Use for map bounding box searches (most common)
SELECT ... FROM listings
WHERE status = 'PUBLISHED'
  AND location_geom && ST_MakeEnvelope(...)
  AND [additional filters]
ORDER BY created_at DESC
LIMIT 100;
```

### 12.2 Pattern: "Near Me" Search

```sql
-- Use for radius-based searches
WITH bbox AS (SELECT ST_MakeEnvelope(...) AS geom)
SELECT ... FROM listings, bbox
WHERE status = 'PUBLISHED'
  AND location_geom && bbox.geom
  AND ST_DWithin(location_geom::geography, ...)
ORDER BY distance ASC
LIMIT 50;
```

### 12.3 Pattern: Neighborhood Browse

```sql
-- Use for neighborhood-specific searches
SELECT ... FROM listings
WHERE status = 'PUBLISHED'
  AND district = $1
  AND neighborhood = $2
  AND [filters]
ORDER BY price_amount ASC
LIMIT 50;
```

---

**Document Status:** Complete v1.0.0  
**Implementation Ready:** Yes  
**Testing Required:** Query plan verification, performance benchmarking
