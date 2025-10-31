import io
import os
import json
import requests
import math
import joblib
import traceback
import numpy as np
import pandas as pd
import geopandas as gpd
import lightgbm as lgb

from flask_cors import CORS
from shapely.geometry import shape
from flask import Flask, render_template_string, url_for, send_file, abort, request, jsonify, Response

# Whitelisted CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://road-risk-playground.tarterware.info:3000",
    "https://road-risk-playground.tarterware.com"
]

# Return the CRS for Universal Transverse Mercater (UTM) Coordinate Reference System for the latitude 
# and longitude given.  UTM coordinate systems don't distort due to latitude
def get_utm_crs(lat: float, lng: float) -> str:
    if abs(lat) > 90.0:
        print(f"Not a valid latitude: {lat}!")
        return

    if abs(lng) > 180.0:
        print(f"Not a valid longitude: {lng}!")

    zone_is_south = lat < 0.0
    zone = math.ceil((lng + 180.0) / 6.0)

    crs = "+proj=utm +zone="
    crs = crs + str(zone)
    if lat < 0.0:
        crs = crs + " +south"

    crs = crs + " +datum=WGS84 +units=m +no_defs"

    return crs

# Next, define a function to get the directions between two points from Mapbox, and return the raw response as well as a GeoPandas representation of the route.
def read_mapbox_directions(o_lat: float, o_lng: float, d_lat: float, d_lng: float) -> tuple[dict, gpd.GeoDataFrame]:

    mapbox_token = os.environ['MAPBOX_TOKEN']
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{o_lng}%2C{o_lat}%3B{d_lng}%2C{d_lat}?alternatives=false&annotations=maxspeed&geometries=geojson&language=en&overview=full&steps=true&access_token={mapbox_token}"

    # Store the full Directions response for further processing later.
    response = requests.get(url)
    mapbox_data = response.json()

    # Retrieve the GEOJSON portion of the directions, which describes every geographic point along the route.
    # Then, create a GeoDataFrame of the route, which will enable measuring changes in heading, or curviness.
    subdata = mapbox_data['routes'][0]['geometry']

    crs = get_utm_crs(o_lat, o_lng)
    geom = shape(subdata)
    geo_df = gpd.GeoDataFrame([1], geometry=[geom], crs="EPSG:4326")

    # Convert coordinates into local UTM so latitude isn't distorted
    geo_df = geo_df.to_crs(crs)

    return mapbox_data, geo_df

# Find the maximum speed along a route
def max_speed(mapbox_data: dict) -> float:
    
    speeds = (
        ms["speed"]
        for route in mapbox_data.get("routes", [])
        for leg in route.get("legs", [])
        for ms in leg.get("annotation", {}).get("maxspeed", [])
        if isinstance(ms, dict) and "speed" in ms and isinstance(ms["speed"], (int, float))
    )

    max_speed = max(speeds, default=16.0934) / 1.60934  # If no max speed, use 10 MPH.
    
    return max_speed

# Road type is a bit complicated.  There are three categories: rural, urban, and highway.
# 
# First, look for a marker that appears when a route has some urban elements
def any_is_urban_true(mapbox_data: dict) -> bool:
    return any(
        "is_urban" in intersection
        for route in mapbox_data.get("routes", [])
        for leg in route.get("legs", [])
        for step in leg.get("steps", [])
        for intersection in step.get("intersections", [])
    )

# Now, see if it is a highway or not
def any_is_highway_true(mapbox_data: dict) -> bool:
    return any(
        (cls := intersection.get("mapbox_streets_v8", {}).get("class")) in {"primary", "secondary", "motoway"}
        for route in mapbox_data.get("routes", [])
        for leg in route.get("legs", [])
        for step in leg.get("steps", [])
        for intersection in step.get("intersections", [])
    )    

# Now we have enough to derive the type of road.  One question remains: should urban trump highway, or the other way around?
def get_road_type(mapbox_data: dict) -> bool:
    if any_is_highway_true(mapbox_data):
        return "highway"

    if any_is_urban_true(mapbox_data):
        return "urban"

    return "rural"

# Determine If Road Signs Present.  This is kind of lazy, but using 'is_urban' seems to be a good proxy.  I'm doing it.
def has_road_signs(mapbox_data: dict) -> bool:
    return any_is_urban_true(mapbox_data)

# Determine Lane Count
# Unfortunately, there isn't a good way I can find to reliably determine lane count.  For a proxy, let's look 
# at 'mapbox_streets_v8'.  A value of 'motorway' will be considered a three lane road, 'primary' or 'secondary' 
# will be two lanes, and all else will be 1.
def get_lane_count(mapbox_data: dict) -> bool:
    if any(
        (cls := intersection.get("mapbox_streets_v8", {}).get("class")) in {"motorway"}
        for route in mapbox_data.get("routes", [])
        for leg in route.get("legs", [])
        for step in leg.get("steps", [])
        for intersection in step.get("intersections", [])
    ):
        return 3
        
    if any(
        (cls := intersection.get("mapbox_streets_v8", {}).get("class")) in {"primary", "secondary"}
        for route in mapbox_data.get("routes", [])
        for leg in route.get("legs", [])
        for step in leg.get("steps", [])
        for intersection in step.get("intersections", [])
    ):
        return 2

    return 1

# Determine Curviness
# One way to measure curviness is to look at the angle (if any) desribed by three points.  To figure out the angle 
# of the turn, we create two arrows from the middle point, then measure the angle between them.
def angle_p1p2p3(p1: float, p2: float, p3: float) -> float:
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]], dtype=float)
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]], dtype=float)

    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 == 0.0 or n2 == 0.0:
        return 0.0  # undefined; (perhaps use value of None instead?)
        
    # robust atan2 using cross and dot
    cross = v1[0]*v2[1] - v1[1]*v2[0]           # scalar "2D cross"
    dot   = float(np.dot(v1, v2))
    theta = math.degrees(math.atan2(abs(cross), dot))

    return theta

# Next, let's define a function that iterates through all of a LineString's points, and calculates the angles to 
# the successive points.  We'll use this to determine overall curviness.

def calculate_linestring_curvature(linestring: dict) -> list[float]:
    """
    Calculates the curvature for each vertex of a Shapely LineString.
    Returns a list of curvature values. The first and last points
    have a curvature of 180 as they cannot form a triplet.
    """
    coords = np.array(linestring.coords)
    if len(coords) < 3:
        return [180] * len(coords)

    curvatures = [180]
    for i in range(1, len(coords) - 1):
        p1 = coords[i - 1]
        p2 = coords[i]
        p3 = coords[i + 1]

        ang = angle_p1p2p3(p1, p2, p3)

        curvatures.append(ang)

    curvatures.append(180)
    
    return curvatures

MAX_CURVY = 170.0

def calculate_curviness(geo_df: gpd.GeoDataFrame) -> float:
    geo_curvs = geo_df['geometry'].apply(calculate_linestring_curvature)
    geo_curvs_ser = pd.Series(geo_curvs[0])
    raw_curviness = geo_curvs_ser.mean()

    raw_curviness = max(raw_curviness, MAX_CURVY)
    curviness = (180.0 - raw_curviness) / (180.0 - MAX_CURVY)

    return curviness

# Time-Dependent Variables
# Some of the variables fed into the model are dependent on the time of day, holiday, and other features.  To facilitate testing, let's define a datetime picker.

from zoneinfo import ZoneInfo
from timezonefinder import TimezoneFinder

tf = TimezoneFinder()
def tz_from_coords(lat: float, lon: float) -> ZoneInfo:
    name = tf.timezone_at(lat=lat, lng=lon)
    if name is None:
        # fall back to nearest match (useful near borders or sparse areas)
        name = tf.closest_timezone_at(lat=lat, lng=lon)
    return ZoneInfo(name) if name else ZoneInfo("UTC")

import datetime as dt

# Determine if the selected day is a holiday.
from pandas.tseries.holiday import USFederalHolidayCalendar
import datetime

def is_holiday(dt: datetime.datetime) -> bool:
    cal = USFederalHolidayCalendar()
    start_date = str(dt.year) + '-01-01'
    end_date = str(dt.year) + '-12-31'
    holidays = cal.holidays(start=start_date, end=end_date).to_pydatetime()
    if datetime.datetime(dt.year, dt.month, dt.day) in holidays:
        return True

    return False

def is_holiday_during_drive(mapbox_data, dt_start: datetime.datetime) -> bool:
    # Determine the time of the end of the trip
    dt_end = dt_start + datetime.timedelta(seconds=mapbox_data['routes'][0]['duration'])

    return is_holiday(dt_start) or is_holiday(dt_end)

# Determine time of day
def get_time_of_day(dt: datetime.datetime) -> str:
    if dt.hour >= 4 and dt.hour < 12:
        return "morning"

    if dt.hour >= 12 and dt.hour < 20:
        return "afternoon"

    return "evening"

def get_time_of_day_during_drive(mapbox_data: dict, dt_start: datetime.datetime) -> str:
    # Determine the time of the end of the trip
    dt_end = dt_start + datetime.timedelta(seconds=mapbox_data['routes'][0]['duration'])

    start_tod = get_time_of_day(dt_start)
    end_tod = get_time_of_day(dt_end)

    # Return 'evening' if either time is 'evening'
    if start_tod == 'evening' or end_tod == 'evening':
        return 'evening'

    # Otherwise, return start_tod
    return start_tod

# Determine Lighting
# The lighting variable has three values: 'dim', 'daylight'. and 'night'.  In order to determine this, we need to get the sunrise and sunset times.
from suntimes import SunTimes
from timezonefinder import TimezoneFinder
from zoneinfo import ZoneInfo

def get_lighting(mapbox_data: bool, dt: datetime.datetime) -> str:
    # Get the starting position
    lng = mapbox_data['routes'][0]['geometry']['coordinates'][0][0]
    lat = mapbox_data['routes'][0]['geometry']['coordinates'][0][1]

    # Get the time zone for this location
    tf = TimezoneFinder()
    tzname = tf.timezone_at(lat=lat, lng=lng)

    # Update the time so that it is in the correct timezone.
    dt = datetime.datetime(dt.year, dt.month, dt.day, hour=dt.hour, minute=dt.minute, second=dt.second, tzinfo=ZoneInfo(tzname))
    
    # Initialize the suntime object, and calculate the periods when light is dim.
    sun = SunTimes(longitude=lng, latitude=lat, altitude=0)
    first_light_start = sun.risewhere(dt, tzname) - datetime.timedelta(minutes=30)
    first_light_end = sun.risewhere(dt, tzname) + datetime.timedelta(minutes=60)
    last_light_start = sun.setwhere(dt, tzname) - datetime.timedelta(minutes=60)
    last_light_end = sun.setwhere(dt, tzname) + datetime.timedelta(minutes=30)

    # If the provided time is between either of the above periods, lighting is dim.
    if dt > first_light_start and dt < first_light_end:
        return "dim"

    if dt > last_light_start and dt < last_light_end:
        return "dim"

    # The time between the dim periods is daylight
    if dt > first_light_end and dt < last_light_start:
        return 'daylight'

    # It must be night.
    return 'night'

def get_lighting_during_drive(mapbox_data: dict, dt_start: datetime.datetime) -> str:
    # Determine the time of the end of the trip
    dt_end = dt_start + datetime.timedelta(seconds=mapbox_data['routes'][0]['duration'])

    lighting_start = get_lighting(mapbox_data, dt_start)
    lighting_end = get_lighting(mapbox_data, dt_end)

    if lighting_start == 'dim' or lighting_end == 'dim':
        return 'dim'

    if lighting_start == 'night' or lighting_end == 'night':
        return 'night'

    return 'daylight'

# Determine if in School Season
def is_school_season(dt: datetime.datetime) -> bool:
    if dt.month <= 5 or dt.month >= 9:
        return True

    return False

def is_school_season_during_drive(mapbox_data: dict, dt_start: datetime.datetime) -> bool:
    # Determine the time of the end of the trip
    dt_end = dt_start + datetime.timedelta(seconds=mapbox_data['routes'][0]['duration'])

    return is_school_season(dt_start) & is_school_season(dt_end)

# Determine the weather
# We can get the current weather from the National Weather Service.
def get_current_weather(mapbox_data: dict) -> dict:
    # Get the starting position
    lng = mapbox_data['routes'][0]['geometry']['coordinates'][0][0]
    lat = mapbox_data['routes'][0]['geometry']['coordinates'][0][1]

    # Get the NWS grid coordinate for the starting position.
    url = f"https://api.weather.gov/points/{lat},{lng}"
    response = requests.get(url)
    location_data = response.json()

    # Save the location to create the forcast url
    gridId = location_data['properties']['gridId']
    gridX = location_data['properties']['gridX']
    gridY = location_data['properties']['gridY']

    url = f"https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast?units=us"
    response = requests.get(url)
    forecast_data = response.json()

    current_wx = forecast_data['properties']['periods'][0]['shortForecast']
    if current_wx in {'Fog', 'fog'}:
        return 'foggy'

    if current_wx in {'Rain', 'rain', 'Storm', 'storm', 'Snow', 'snow'}:
        return 'rainy'
        
    return 'clear'

def safe_quantile_bins(s: pd.Series, bins, labels):
    s = s.astype(float)
    # Fallback if no variation or too few rows
    if s.nunique(dropna=True) < 2 or len(s) < 6:
        mid = labels[len(labels)//2]
        return pd.Series([mid] * len(s), index=s.index, dtype="object")
    # Try quantile cut; if it still fails, use the fallback
    try:
        return pd.qcut(s, q=bins, labels=labels, duplicates="drop").astype("object")
    except ValueError:
        mid = labels[len(labels)//2]
        return pd.Series([mid] * len(s), index=s.index, dtype="object")

# Identify Feature Types
# Instead of one-hot encoding, we'll tell LightGBM which columns are categorical.
categorical_features = [
    'road_type', 'lighting', 'weather', 'time_of_day', 'holiday_x_lighting',
    'weather_lighting', 'curvature_bin', 'speed_x_curvature_bin'
]

# This argument isn't needed for inference, but set here so that feature_engineer() can be slotted in
# here when changed.  (Until I figure out how to segregate common code in the pythonic way.)
TARGET = "accident_risk"

def feature_engineer(df: pd.DataFrame, target: str = TARGET, drop_duplicates:bool = True) -> pd.DataFrame:
    """
    Applies feature engineering steps to the road accident dataset.

    Args:
        df (pd.DataFrame): The input DataFrame (either training or test data).

    Returns:
        pd.DataFrame: The DataFrame with engineered features.
    """
    # Make a copy to avoid modifying the original DataFrame
    df_engineered = df.copy()

    # If requested, remove any duplicate rows
    if drop_duplicates:
        df_engineered = df_engineered.drop_duplicates()
    
    # The num_reported_accidents is impossible to derive when in production, and it's leaky, too.  Drop it.
    # df_engineered = df_engineered.drop('num_reported_accidents', axis=1)
    
    # This feature was used in training, but is underivable.  Send in a zero here.
    # TODO - send in a argument so users can "what if".
    df_engineered['num_reported_accidents'] = pd.Series(np.zeros(len(df), dtype=float))

    # Create Interaction Features
    # Interaction between speed limit and road curvature
    # Add a small epsilon to curvature to prevent division by zero
    df_engineered['speed_curvature_ratio'] = df_engineered['speed_limit'] / (df_engineered['curvature'] + 1e-6)

    # Combined environmental conditions
    df_engineered['weather_lighting'] = df_engineered['weather'].astype(str) + '_' + df_engineered['lighting'].astype(str)

    # Binning Curvature
    # Create categorical bins for the curvature feature.
    # The quantiles are chosen to split the data into meaningful groups.
    df_engineered['curvature_bin'] = safe_quantile_bins(
        df_engineered['curvature'],
        [0, 0.25, 0.75, 1.0],
        ['low', 'medium', 'high']
    ).astype(str)

    # Create Polynomial Features
    # Squaring the most correlated features to capture non-linear relationships
    df_engineered['curvature_sq'] = df_engineered['curvature'] ** 2
    df_engineered['speed_limit_sq'] = df_engineered['speed_limit'] ** 2

    # More Advanced Interactions
    # Interact the new curvature bins with the speed limit.
    df_engineered['speed_x_curvature_bin'] = df_engineered['speed_limit'].astype(str) + '_' + df_engineered['curvature_bin']

    # Time-based Interactions
    # The effect of lighting might differ on a holiday.
    df_engineered['holiday_x_lighting'] = df_engineered['holiday'].astype(str) + '_' + df_engineered['lighting'].astype(str)

    # Convert boolean features to integers for the model
    bool_cols = df_engineered.select_dtypes(include='bool').columns
    df_engineered[bool_cols] = df_engineered[bool_cols].astype(int)

    # Convert categorical columns to the 'category' dtype for LightGBM
    for col in categorical_features:
        df_engineered[col] = df_engineered[col].astype('category')

    return df_engineered

### INITIALIZATION ###
_model = None

def _init():
  global _model, _meta
  if _model: 
    print(f"Model 'ml_model/export/model.pkl' already loaded; skipping loading.")
    return
    
  with open('ml_model/export/meta.json', 'r') as f:
    _meta = json.loads(f.read())

  with open('ml_model/export/model.pkl', 'rb') as f:
    _model = joblib.load(io.BytesIO(f.read()))

  print(f"Model 'ml_model/export/model.pkl' loaded.")

### Start the application ###
app = Flask(__name__)

# Initialize CORS, passing in allowed origins
CORS(app, origins=ALLOWED_ORIGINS)

def calc_drive_risk(o_lat: float, o_lng: float, d_lat: float, d_lng: float, date_str: str):

    # Load the model
    _init()

    # If the datetime string was supplied, convert it.  If not present, use current time.
    if date_str:
        dt = datetime.datetime.fromisoformat(date_str)
    else:
        dt = datetime.datetime.now()

    # Get the Mapbox Directions and GeoDataframe for the requested trip.
    mapbox_data, geo_df = read_mapbox_directions(o_lat, o_lng, d_lat, d_lng)
    print(f"Mapbox Directions obtained for route between {o_lat:.6f}, {o_lng:.6f}, and {d_lat:.6f}, {d_lng:.6f}")

    # Use the current time for all time-based
    road_type = get_road_type(mapbox_data)
    num_lanes = get_lane_count(mapbox_data)
    curvature = calculate_curviness(geo_df)
    speed_limit = max_speed(mapbox_data)
    lighting = get_lighting(mapbox_data, dt)
    weather = get_current_weather(mapbox_data)
    road_signs_present = has_road_signs(mapbox_data)
    public_road = True
    time_of_day = get_time_of_day_during_drive(mapbox_data, dt)
    holiday = is_holiday_during_drive(mapbox_data, dt)
    school_season = is_school_season(dt)

    model_inputs = {
        'road_type': road_type,
        'num_lanes': num_lanes,
        'curvature': curvature,
        'speed_limit': speed_limit,
        'lighting': lighting,
        'weather': weather,
        'road_signs_present': road_signs_present,
        'public_road': public_road,
        'time_of_day': time_of_day,
        'holiday': holiday,
        'school_season': school_season
    }

    model_inputs_df = pd.DataFrame([model_inputs])

    print(f"Model inputs dataframe before FE: {model_inputs_df}")

    model_inputs_df = feature_engineer(model_inputs_df, drop_duplicates = False)
    
    print(f"Model inputs dataframe after FE: {model_inputs_df}")

    # Now, call the ML model
    prediction = _model.predict(model_inputs_df)

    print(f"Received prediction: {prediction}")

    # Create a record with everything to send back
    response = {
        'mapbox_data': mapbox_data,
        'model_inputs': model_inputs,
        'prediction': prediction[0]
    }

    return response

@app.route("/drive-risk", methods=["GET", "POST"])
def drive_risk_query():
    if request.method == "POST":
        if not request.is_json:
            return jsonify(error="Content-Type must be application/json"), 400

        payload = request.get_json(silent=False)

        required = ("o_lat", "o_lng", "d_lat", "d_lng", "date_str")
        missing = [k for k in required if k not in payload]
        if missing:
            return jsonify(error=f"Missing keys: {', '.join(missing)}"), 400

        try:
            o_lat   = float(payload["o_lat"])
            o_lng   = float(payload["o_lng"])
            d_lat   = float(payload["d_lat"])
            d_lng   = float(payload["d_lng"])
            date_str = str(payload["date_str"])
        except (TypeError, ValueError):
            return jsonify(error="Invalid types in JSON payload"), 400

    else:  # GET
        o_lat   = request.args.get("o_lat", type=float)
        o_lng   = request.args.get("o_lng", type=float)
        d_lat   = request.args.get("d_lat", type=float)
        d_lng   = request.args.get("d_lng", type=float)
        date_str = request.args.get("date_str", type=str)
        if None in (o_lat, o_lng, d_lat, d_lng) or date_str is None:
            return jsonify(error="Missing one or more required query parameters"), 400

    result = calc_drive_risk(o_lat, o_lng, d_lat, d_lng, date_str)

    return jsonify(result), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9400, debug=False)

# A few helpers for the lambda_handler
def _origin(headers):
    if not headers:
        return ""
    h = {k.lower(): v for k,v in headers.items()}

    return h.get("origin", "")

def _cors(origin):
    acao = origin if "*" not in ALLOWED_ORIGINS and origin in ALLOWED_ORIGINS else (origin or "*")
    return {
        "Access-Control-Allow-Origin": acao,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    }

def _method(event):
    # HTTP API v2 / Function URL
    rc = event.get("requestContext") or {}
    http = rc.get("http") or {}
    if "method" in http:
        return http["method"].upper()

    # REST API v1
    return (event.get("httpMethod") or "").upper()

def lambda_handler(event, context):
    headers = event.get("headers") or {}
    cors = _cors(_origin(headers))
    method = _method(event)

    # CORS preflight: no body present
    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": {**cors, "Content-Length": "0"},
            "body": "",
        }

    try:
        raw = event.get("body")
        if raw is None:
            # Support GET ?o_lat=... for debugging
            qs = event.get("queryStringParameters") or {}
            if not qs:
                raise ValueError("No request body or query params")
            body = qs
        else:
            if event.get("isBase64Encoded"):
                import base64
                raw = base64.b64decode(raw).decode("utf-8")
            body = json.loads(raw)
        # Get the request payload from the request body
        body = json.loads(event["body"])

        o_lat = float(body["o_lat"])
        o_lng = float(body["o_lng"])
        d_lat = float(body["d_lat"])
        d_lng = float(body["d_lng"])
        date_str = body["date_str"]

        response = calc_drive_risk(o_lat, o_lng, d_lat, d_lng, date_str)

        return {
            "statusCode": 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            "body": json.dumps(response)
        }

    except Exception as e:
        err = traceback.format_exc()
        print(err)
        return {
            "statusCode": 500,
            "headers": {
                'Content-Type': 'application/json'
            },
            "body": err
        }

