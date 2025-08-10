#!/bin/bash
uvicorn vision:app --host 0.0.0.0 --port $PORT
